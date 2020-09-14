require('dotenv').config();
const web3 = require('web3');
const truffle = require('@truffle/contract');

const userProxyFactoryJson = require('./json/GelatoUserProxyFactory.json');
const gelatoCoreJson = require('./json/GelatoCore.json');

////////////// START : Global Contants //////////////

const INFURA_ID = process.env.INFURA_ID;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const infuraProvider = 'https://rinkeby.infura.io/v3/' + String(INFURA_ID);
const web3Provider = new web3(new web3.providers.HttpProvider(infuraProvider));

// Rinkeby Address

const userProxyFactoryAddress = '0x0309EC714C7E7c4C5B94bed97439940aED4F0624';
const gelatoCoreAddress = '0x733aDEf4f8346FD96107d8d6605eA9ab5645d632';
var userProxyAddress = '';

var userAddress = process.env.USERADDRESS;

const userProxyFactoryInterface = truffle(userProxyFactoryJson);
const gelatoCoreInterface = truffle(gelatoCoreJson);

const userProxyFactory = new web3Provider.eth.Contract(userProxyFactoryInterface.abi, userProxyFactoryAddress);
const gelatoCore = new web3Provider.eth.Contract(gelatoCoreInterface.abi, gelatoCoreAddress);

const CREATE_2_SALT = 42069;

////////////// END : Global Contants //////////////

async function getUserProxyAddress() {
    userProxyAddress = await userProxyFactory.methods.predictProxyAddress(
        userAddress,
        CREATE_2_SALT
    ).call({from : userAddress});
}

async function providerStakeIfNeeded() {
    var stake = await gelatoCore.methods.providerFunds(userProxyAddress).call({from: userAddress});
    var twoEther = web3Provider.utils.toWei('2', 'ether');
    if (Number(stake) < Number(twoEther)) {
        stake = String(BigInt(twoEther) -  BigInt(stake));
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

////////////// Run //////////////

async function run() {
    await getUserProxyAddress();
    await providerStakeIfNeeded();
}

run();