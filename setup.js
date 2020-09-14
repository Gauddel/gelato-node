require('dotenv').config();
const web3 = require('web3');
const truffle = require('@truffle/contract');
const userProxyFactoryJson = require('./json/GelatoUserProxyFactory.json');
const gelatoCoreJson = require('./json/GelatoCore.json');
const gelatoUserProxyJson = require('./json/GelatoUserProxy.json');
const GelatoConditionJson = require('./json/GelatoCondition.json');
const GelatoActionJson = require('./json/GelatoAction.json');
const ExecutorJson = require('./json/Executor.json');
const IGelatoCoreJson = require('./json/IGelatoCore.json');

////////////// Global Contants //////////////

const INFURA_ID = process.env.INFURA_ID;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const infuraProvider = 'https://rinkeby.infura.io/v3/' + String(INFURA_ID);
const web3Provider = new web3(new web3.providers.HttpProvider(infuraProvider));

// Rinkeby Address

const gelatoActionAddress = '0xbD5F909a217d247F63424EC520204C702C0eF4AF'; // To put in .env
const gelatoConditionAddress = '0x2b9159bB0984e818730E45089dBE42E376d723c5'; // To put in .env
const executorAddress = '0xb376FA9e2390eB4CAD445e41D57C7e520e20A0A2'; // 0x66e4ceC6557Ca5b7A88a2589Dcb348967a0677f3 0x002808caF6f165fca9B81c4178Fc00B38d52E187
const userProxyFactoryAddress = '0x0309EC714C7E7c4C5B94bed97439940aED4F0624';
const gelatoCoreAddress = '0x733aDEf4f8346FD96107d8d6605eA9ab5645d632';
const providerModuleGelatoUserProxy = '0x66a35534126B4B0845A2aa03825b95dFaaE88B0C';
var userProxyAddress = '';

var userAddress = '0x525F8E213EAc01E1a1E9607aebE1a7eBd8064e9F';

const userProxyFactoryInterface = truffle(userProxyFactoryJson);
const gelatoCoreInterface = truffle(gelatoCoreJson);
const gelatoUserProxyInterface = truffle(gelatoUserProxyJson);
const GelatoConditionInterface = truffle(GelatoConditionJson);
const GelatoActionInterface = truffle(GelatoActionJson);
const ExecutorInterface = truffle(ExecutorJson);

const userProxyFactory = new web3Provider.eth.Contract(userProxyFactoryInterface.abi, userProxyFactoryAddress);
const gelatoCore = new web3Provider.eth.Contract(gelatoCoreInterface.abi, gelatoCoreAddress);
const gelatoCondition = new web3Provider.eth.Contract(GelatoConditionInterface.abi, gelatoConditionAddress);
const gelatoAction = new web3Provider.eth.Contract(GelatoActionInterface.abi, gelatoActionAddress);
const executor = new web3Provider.eth.Contract(ExecutorInterface.abi, executorAddress);

const CREATE_2_SALT = 42069;

const Operation = {
    Call: 0,
    Delegatecall: 1,
};


const DataFlow = {
    None: 0,
    In: 1,
    Out: 2,
    InAndOut: 3
}

////////////// Global Contants //////////////


////////////// Start Step 1 : Create a Proxy //////////////

async function getUserProxyAddress() {
    userProxyAddress = await userProxyFactory.methods.predictProxyAddress(
        userAddress,
        CREATE_2_SALT
    ).call({from : userAddress});
    console.log(userProxyAddress);
    await proxyIsDeployedAlready();
    // await executorStakeIfNeeded();
    // await providerStakeIfNeeded();
    // await setupProxy(); // Use TimeOut
    // setTimeout(, 10000); // wait 20 seconds before doing next step.
    // setTimeout(setupProxy, 10000); // wait 20 seconds before doing next step.
    // setTimeout(submitTask, 20000); // wait 20 seconds before doing next step.
    await submitTask();
}

async function proxyIsDeployedAlready() {
    var isCreated = await userProxyFactory.methods.isGelatoUserProxy(userProxyAddress).call({from : userAddress});
    console.log(isCreated);
    if(!isCreated) {
        await createUserProxy();
    }
}

async function createUserProxy() {
    var gas = await userProxyFactory.methods.createTwo(CREATE_2_SALT).estimateGas({from : userAddress});
    var walletAccount = web3Provider.eth.accounts.privateKeyToAccount(PRIVATE_KEY);
    var nonce = await web3Provider.eth.getTransactionCount(userAddress);
    var txParams = {
        nonce : nonce,
        from : userAddress,
        to: userProxyFactoryAddress,
        data : userProxyFactory.methods.createTwo(CREATE_2_SALT).encodeABI(),
        gas : gas
    }
    var signedTx = await walletAccount.signTransaction(txParams);
    web3Provider.eth.sendSignedTransaction(signedTx.rawTransaction).on('receipt', (tx) => {
        if (tx.status === TRUE) {
            console.log("\nUser Proxy succesfully created ✅ \n");
            return
        }
        console.log("\n Failed to create User Proxy ❌ \n");
    });
}

////////////// End Step 1 : Create a Proxy //////////////

////////////// START Step 2 : Provider Stake Ether in Gelato //////////////

async function providerStakeIfNeeded() {
    var stake = await gelatoCore.methods.providerFunds(userProxyAddress).call({from: userAddress});
    var milli = web3Provider.utils.toWei('3', 'milli');
    console.log(stake, 'Stake');
    console.log(milli, 'Milli');
    if (true){ //(Number(stake) < Number(milli)) {
        stake = web3Provider.utils.toWei('1', 'ether');
        var gas = await gelatoCore.methods.provideFunds(userProxyAddress).estimateGas({from: userAddress, value: stake});
        var walletAccount = web3Provider.eth.accounts.privateKeyToAccount(PRIVATE_KEY);
        var nonce = await web3Provider.eth.getTransactionCount(userAddress);
        var txParams = {
            nonce : nonce,
            from : userAddress,
            to: gelatoCoreAddress,
            data : gelatoCore.methods.provideFunds(userProxyAddress).encodeABI(),
            gas : gas,
            value : stake
        }
        var signedTx = await walletAccount.signTransaction(txParams);
        web3Provider.eth.sendSignedTransaction(signedTx.rawTransaction).on('receipt', console.log);
    }
}

////////////// START Step 2 : Provider Stake Ether in Gelato //////////////

////////////// START Step 1 Bis : Proxy Setup //////////////

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

////////////// START Step 1 Bis : Proxy Setup //////////////

////////////// START Step 2 : Proxy Setup //////////////

async function setupProxy() {
    console.log('Test 1');
    const action = {
        addr: gelatoCoreAddress,
        data: gelatoCore.methods.multiProvide(executorAddress, [], []).encodeABI(), // Module String(providerModuleGelatoUserProxy) careful to redundancy
        operation: Operation.Call, // Operation Call
        // value: web3Provider.utils.toWei('1', 'ether'),
        value : '0',
        dataFlow: DataFlow.None,
        termsOkCheck: false,
    }
    console.log(action);

    const gelatoUserProxy = new web3Provider.eth.Contract(gelatoUserProxyInterface.abi, userProxyAddress);
    var gas = await gelatoUserProxy.methods.execAction(action).estimateGas({from : userAddress, value : '0'}); // , value: web3Provider.utils.toWei('1', 'ether') pay one time
    console.log('Test 1');

    action.operation = Operation.Call;

    var walletAccount = web3Provider.eth.accounts.privateKeyToAccount(PRIVATE_KEY);
    var nonce = await web3Provider.eth.getTransactionCount(userAddress);
    var txParams = {
        nonce : nonce,
        from : userAddress,
        to: userProxyAddress,
        value : '0',
        // value: web3Provider.utils.toWei('1', 'ether'),
        data : gelatoUserProxy.methods.execAction(action).encodeABI(),
        gas : gas
    }

    var signedTx = await walletAccount.signTransaction(txParams);
    web3Provider.eth.sendSignedTransaction(signedTx.rawTransaction).on('receipt', (tx) => {
        console.log(tx);
        if (tx.status === TRUE) {
            console.log("\n User Proxy succesfully setup ✅ \n");
            return
        }
        console.log("\n Failed to setup User Proxy ❌ \n");
    });
}

////////////// END Step 2 : Proxy Setup //////////////


////////////// START Step 3 : Submit Task //////////////

async function submitTask() {

    const nowInSeconds = Math.floor(Date.now() / 1000);
    const expiryDate = nowInSeconds + (3600 * 48); // Expiry is set to 2 days from mow.
    const gelatoUserProxy = new web3Provider.eth.Contract(gelatoUserProxyInterface.abi, userProxyAddress);

    const myGelatoProvider = {
        addr: userProxyAddress,
        module: providerModuleGelatoUserProxy
    };

    const simpleAction = {
        addr: gelatoActionAddress,
        data: gelatoAction.methods.action(5).encodeABI(),
        operation: Operation.Call,
        dataFlow: DataFlow.None,
        value: '0',
        termsOkCheck: true,
    }

    const setNotOkAction = {
        addr: gelatoConditionAddress,
        data: gelatoCondition.methods.setOK(false).encodeABI(),
        operation: Operation.Call,
        dataFlow: DataFlow.None,
        value: '0',
    }

    const task = {
        conditions: [],
        actions: [simpleAction, setNotOkAction],
        selfProviderGasLimit: new web3Provider.utils.BN("0"),
        selfProviderGasPriceCeil: new web3Provider.utils.BN('0'),
    }

    const gas = await gelatoUserProxy.methods.submitTask(myGelatoProvider, task, String(expiryDate)).estimateGas({from : userAddress, gasLimit: 1000000,
        gasPrice: web3Provider.utils.toWei("10", "gwei")});
    var walletAccount = web3Provider.eth.accounts.privateKeyToAccount(PRIVATE_KEY);
    var nonce = await web3Provider.eth.getTransactionCount(userAddress);
    var txParams = {
        nonce : nonce,
        from : userAddress,
        to: userProxyAddress,
        data : gelatoUserProxy.methods.submitTask(myGelatoProvider, task, String(expiryDate)).encodeABI(),
        gas : gas
    }

    var signedTx = await walletAccount.signTransaction(txParams);
    web3Provider.eth.sendSignedTransaction(signedTx.rawTransaction).on('receipt', (tx) => {
        if (tx.status === TRUE) {
            console.log("\n Task succesfully submitted ✅ \n");
            return
        }
        console.log("\n Failed to submit Task ❌ \n");
    });
}

////////////// END Step 3 : Submit Task //////////////

////////////// Run //////////////

getUserProxyAddress()