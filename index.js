
require('dotenv').config();
const web3 = require('web3');
const truffle = require('@truffle/contract');
const gelatoCoreJson = require('./json/GelatoCore.json');
const executorJson = require('./json/Executor.json');
const gelatoCoreExtensionJson = require('./json/GelatoCoreExtension.json');

// Global Constants

const gelatoCoreAddress = '0x733aDEf4f8346FD96107d8d6605eA9ab5645d632';
const executorAddress = '0xb376FA9e2390eB4CAD445e41D57C7e520e20A0A2';
const userAddress = '0x525F8E213EAc01E1a1E9607aebE1a7eBd8064e9F';
const gelatoCoreExtensionAddress = '0xF6DF9e3eFA82f520BDd5DA1fe89Cf7Be043cC1e6';

const gelatoCoreInterface = truffle(gelatoCoreJson);
const executorInterface = truffle(executorJson);
const gelatoCoreExtensionInterface = truffle(gelatoCoreExtensionJson);

const gelatoCoreABI = gelatoCoreInterface.abi;
const INFURA_ID = process.env.INFURA_ID;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const infuraProvider = 'https://rinkeby.infura.io/v3/' + String(INFURA_ID);
const web3Provider = new web3(new web3.providers.HttpProvider(infuraProvider));

const gelatoCore = new web3Provider.eth.Contract(gelatoCoreABI, gelatoCoreAddress);
const executor = new web3Provider.eth.Contract(executorInterface.abi, executorAddress);
const gelatoCoreExtension = new web3Provider.eth.Contract(gelatoCoreExtensionInterface.abi, gelatoCoreExtensionAddress);

// Global constant

// Global Variable

var fromBlock = 7197254; // Creation of Executor contract.
var validTask = [];

// Global Variable

async function ExecuteTask() {

}

async function CheckGelatoCoreSubmitTaskEventAndExecute() { // Get not expired past submit event or new committed on.
    var events = await gelatoCore.getPastEvents('LogTaskSubmitted', { fromBlock : fromBlock, toBlock: 'latest'});
    fromBlock = await web3Provider.eth.getBlockNumber();

    // Start Transform data and Store new valid Tasks.

    var timestamp = (await web3Provider.eth.getBlock('latest')).timestamp;

    var callback = () => {
        if (validTask.length > 0) {
            validTask.forEach(async (task) => {
                var gasPrice = await web3Provider.eth.getGasPrice();
                const canExec = await executor.methods.canExec(task, '5000000', gasPrice).call();
                console.log(canExec, 'Test');
                if (String(canExec) === "InvalidExecutor" || String(canExec).toUpperCase() == "OK") {
                    gasPrice = await gelatoCoreExtension.methods.getGasPrice().call({from: userAddress});
                    var gasNeeded = await gelatoCoreExtension.methods.getGelatoMaxGas().call({from: userAddress});
                    console.log(gasPrice);
                    console.log(gasNeeded);
                    var gas = await executor.methods.exec(task).estimateGas({from:userAddress, gas: gasNeeded, gasPrice : gasPrice});
                    //var gasPrice = await web3Provider.eth.getGasPrice();
                    var walletAccount = web3Provider.eth.accounts.privateKeyToAccount(PRIVATE_KEY);
                    var nonce = await web3Provider.eth.getTransactionCount(userAddress);
                    var txParams = {
                        nonce : nonce,
                        from : userAddress,
                        to: executorAddress,
                        data : executor.methods.exec(task).encodeABI(),
                        gas : gasNeeded,
                        gasPrice : gasPrice
                    }
                    var signedTx = await walletAccount.signTransaction(txParams);
                    web3Provider.eth.sendSignedTransaction(signedTx.rawTransaction).on('receipt', (tx) => {
                        if (tx.status === TRUE) {
                            console.log("\nTask succesfully executed ✅ \n");
                            return
                        }
                        console.log("\n Failed to execute Task ❌ \n");
                    });
                }
            });
        }
    }

    await asyncForEach(events, timestamp, callback);
    
    // End Transform data and Store new valid Tasks.

    // Start Check if condition are ok for valid Task to execute them

    // End Check if condition are ok for valid Task to execute them
}

async function asyncForEach(events, timestamp, callback) {
    for(var i=0; i<events.length; i++) {
        var event = events[i];
        var taskReceipt = event.returnValues.taskReceipt;
        var provider = taskReceipt.provider.addr;
    
        var executor = await gelatoCore.methods.executorByProvider(provider).call();
        if(Number(timestamp) < Number(taskReceipt.expiryDate) && String(executor) == String(executorAddress)) {
            validTask.push(taskReceipt);
        }
    }
    callback();
}

async function main() {
    await CheckGelatoCoreSubmitTaskEventAndExecute();
    setInterval(CheckGelatoCoreSubmitTaskEventAndExecute, 30 * 1000);
}

main();