require('dotenv').config();
const web3 = require('web3');
const truffle = require('@truffle/contract');

const gelatoCoreJson = require('./json/GelatoCore.json');
const ExecutorJson = require('./json/Executor.json');

////////////// START : Global Contants //////////////

const INFURA_ID = process.env.INFURA_ID;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const infuraProvider = 'https://rinkeby.infura.io/v3/' + String(INFURA_ID);
const web3Provider = new web3(new web3.providers.HttpProvider(infuraProvider));

// Rinkeby Address

const executorAddress = process.env.EXECUTOR;
const gelatoCoreAddress = '0x733aDEf4f8346FD96107d8d6605eA9ab5645d632';

var userAddress = process.env.USERADDRESS;

const gelatoCoreInterface = truffle(gelatoCoreJson);
const ExecutorInterface = truffle(ExecutorJson);

const gelatoCore = new web3Provider.eth.Contract(gelatoCoreInterface.abi, gelatoCoreAddress);
const executor = new web3Provider.eth.Contract(ExecutorInterface.abi, executorAddress);

////////////// END : Global Contants //////////////

async function executorStakeIfNeeded() {
    var stake = await gelatoCore.methods.executorStake(executorAddress).call();
    var minimunStake = await gelatoCore.methods.minExecutorStake().call();
    if(stake < minimunStake) { // Stake some ethereum
        stake = String(BigInt(minimunStake) - BigInt(stake) + BigInt(1));
        var gas = await executor.methods.stake().estimateGas({from: userAddress, value: stake});
        var walletAccount = web3Provider.eth.accounts.privateKeyToAccount(PRIVATE_KEY);
        var nonce = await web3Provider.eth.getTransactionCount(userAddress);
        var txParams = {
            nonce : nonce,
            from : userAddress,
            to: executorAddress,
            data : executor.methods.stake().encodeABI(),
            gas : gas,
            value : stake
        }
        var signedTx = await walletAccount.signTransaction(txParams);
        web3Provider.eth.sendSignedTransaction(signedTx.rawTransaction).on('receipt', console.log);
    }
}

////////////// Run //////////////

async function run() {
    await executorStakeIfNeeded();
}

run();