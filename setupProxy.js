require('dotenv').config();
const web3 = require('web3');
const truffle = require('@truffle/contract');

const userProxyFactoryJson = require('./json/GelatoUserProxyFactory.json');
const gelatoCoreJson = require('./json/GelatoCore.json');
const gelatoUserProxyJson = require('./json/GelatoUserProxy.json');

////////////// START : Global Contants //////////////

const INFURA_ID = process.env.INFURA_ID;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const infuraProvider = 'https://rinkeby.infura.io/v3/' + String(INFURA_ID);
const web3Provider = new web3(new web3.providers.HttpProvider(infuraProvider));

// Rinkeby Address

const executorAddress = process.env.EXECUTOR;
const userProxyFactoryAddress = '0x0309EC714C7E7c4C5B94bed97439940aED4F0624';
const gelatoCoreAddress = '0x733aDEf4f8346FD96107d8d6605eA9ab5645d632';
var userProxyAddress = '';

var userAddress = process.env.USERADDRESS;

const userProxyFactoryInterface = truffle(userProxyFactoryJson);
const gelatoCoreInterface = truffle(gelatoCoreJson);
const gelatoUserProxyInterface = truffle(gelatoUserProxyJson);

const userProxyFactory = new web3Provider.eth.Contract(userProxyFactoryInterface.abi, userProxyFactoryAddress);
const gelatoCore = new web3Provider.eth.Contract(gelatoCoreInterface.abi, gelatoCoreAddress);

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

////////////// END : Global Contants //////////////

async function getUserProxyAddress() {
    userProxyAddress = await userProxyFactory.methods.predictProxyAddress(
        userAddress,
        CREATE_2_SALT
    ).call({from : userAddress});
}

async function setupProxy() {
    const action = {
        addr: gelatoCoreAddress,
        data: gelatoCore.methods.multiProvide(executorAddress, [], []).encodeABI(), // Module String(providerModuleGelatoUserProxy) careful to redundancy
        operation: Operation.Call, // Operation Call
        value : '0',
        dataFlow: DataFlow.None,
        termsOkCheck: false,
    }

    const gelatoUserProxy = new web3Provider.eth.Contract(gelatoUserProxyInterface.abi, userProxyAddress);
    var gas = await gelatoUserProxy.methods.execAction(action).estimateGas({from : userAddress, value : '0'});

    var walletAccount = web3Provider.eth.accounts.privateKeyToAccount(PRIVATE_KEY);
    var nonce = await web3Provider.eth.getTransactionCount(userAddress);
    var txParams = {
        nonce : nonce,
        from : userAddress,
        to: userProxyAddress,
        value : '0',
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

////////////// Run //////////////

async function run() {
    await getUserProxyAddress();
    await setupProxy();
}

run();