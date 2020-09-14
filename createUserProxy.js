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

////////////// START : Global Contants //////////////

const INFURA_ID = process.env.INFURA_ID;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const infuraProvider = 'https://rinkeby.infura.io/v3/' + String(INFURA_ID);
const web3Provider = new web3(new web3.providers.HttpProvider(infuraProvider));

// Rinkeby Address

const gelatoActionAddress = process.env.GELATOACTION;
const gelatoConditionAddress = process.env.GELATOCONDITION;
const executorAddress = process.env.EXECUTOR;
const userProxyFactoryAddress = '0x0309EC714C7E7c4C5B94bed97439940aED4F0624';
const gelatoCoreAddress = '0x733aDEf4f8346FD96107d8d6605eA9ab5645d632';
const providerModuleGelatoUserProxy = '0x66a35534126B4B0845A2aa03825b95dFaaE88B0C';
var userProxyAddress = '';

var userAddress = process.env.USERADDRESS;

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

////////////// END : Global Contants //////////////

async function getUserProxyAddress() {
    userProxyAddress = await userProxyFactory.methods.predictProxyAddress(
        userAddress,
        CREATE_2_SALT
    ).call({from : userAddress});
}

async function proxyIsDeployedAlready() {
    return await userProxyFactory.methods.isGelatoUserProxy(userProxyAddress).call({from : userAddress});
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

////////////// Run //////////////

async function run() {
    await getUserProxyAddress();
    var isDeployed = await proxyIsDeployedAlready();
    if(!isDeployed) {
        await createUserProxy();
    }
}

run();
