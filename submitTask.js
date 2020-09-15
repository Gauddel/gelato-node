require('dotenv').config();
const web3 = require('web3');
const truffle = require('@truffle/contract');

const userProxyFactoryJson = require('./json/GelatoUserProxyFactory.json');
const gelatoUserProxyJson = require('./json/GelatoUserProxy.json');
const GelatoConditionJson = require('./json/GelatoCondition.json');
const GelatoActionJson = require('./json/GelatoAction.json');

////////////// START : Global Contants //////////////

const INFURA_ID = process.env.INFURA_ID;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const infuraProvider = 'https://rinkeby.infura.io/v3/' + String(INFURA_ID);
const web3Provider = new web3(new web3.providers.HttpProvider(infuraProvider));

// Rinkeby Address

const gelatoActionAddress = process.env.GELATOACTION;
const gelatoConditionAddress = process.env.GELATOCONDITION;
const userProxyFactoryAddress = '0x0309EC714C7E7c4C5B94bed97439940aED4F0624';
const providerModuleGelatoUserProxy = '0x66a35534126B4B0845A2aa03825b95dFaaE88B0C';
var userProxyAddress = '';

var userAddress = process.env.USERADDRESS;

const userProxyFactoryInterface = truffle(userProxyFactoryJson);
const gelatoUserProxyInterface = truffle(gelatoUserProxyJson);
const GelatoConditionInterface = truffle(GelatoConditionJson);
const GelatoActionInterface = truffle(GelatoActionJson);

const userProxyFactory = new web3Provider.eth.Contract(userProxyFactoryInterface.abi, userProxyFactoryAddress);
const gelatoCondition = new web3Provider.eth.Contract(GelatoConditionInterface.abi, gelatoConditionAddress);
const gelatoAction = new web3Provider.eth.Contract(GelatoActionInterface.abi, gelatoActionAddress);

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

async function submitTask() {

    const nowInSeconds = Math.floor(Date.now() / 1000);
    const expiryDate = nowInSeconds + (3600 * 48); // Expiry is set to 2 days from mow.
    const gelatoUserProxy = new web3Provider.eth.Contract(gelatoUserProxyInterface.abi, userProxyAddress);

    const myGelatoProvider = {
        addr: userProxyAddress,
        module: providerModuleGelatoUserProxy
    };

    const simpleCondition = {
        inst: gelatoConditionAddress,
        data: '0x'
    }

    const simpleAction = {
        addr: gelatoActionAddress,
        data: gelatoAction.methods.action(10).encodeABI(),
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
        conditions: [simpleCondition],
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

////////////// Run //////////////

async function run() {
    await getUserProxyAddress();
    await submitTask();
}

run();
