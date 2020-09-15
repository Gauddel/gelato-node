# Gelato Node (Alpha version on Rinkeby)

Decentralized bot.

## Run Gelato Node
##### Requirements
- Truffle.
- NPM.
##### Setup
Go to the smart contract folder :
```
cd contracts
```
Install dependencies :
```
npm i
```
Create a .env file :
```
touch .env
```
Fill the .env file :
```
INFURA_ID=<INFURA KEY>
MNEMONIC=<MNEMONIC can be find in metamask>
```
Deploy smart contract :
```
truffle migrate --network rinkeby
```
Go back to the parent folder :
```
cd ..
```
Create an environment file for the node :
```
touch .env
```
Fill the .env file with the deployed smart contract address:
```
INFURA_ID=<INFURA KEY>
PRIVATE_KEY=<PRIVATE KEY>
USERADDRESS=<ADDRESS ASSOCIATE TO THE PRIVATE KEY>
GELATOACTION=<DEPLOYED GELATO ACTION ADDRESS>
GELATOCONDITION=<DEPLOYED GELATO CONDITION ADDRESS>
EXECUTOR=<DEPLOYED EXECUTOR ADDRESS>
GELATOCOREEXTENSION=<DEPLOYED GELATOCOREEXTENSION ADDRESS>
BLOCK=<BLOCK NUMBER OF EXECUTOR CREATION BLOCK>
```
Create an user proxy if you didn't have one:
```
node createUserProxy.js
```

Increase Provider Stake (User here) if needed:
```
node increaseProviderStake.js
```
Increase Executor Stake if needed:
```
node increaseExecutorStake.js
```
Do the final setup (like assigning executor to the provider):
```
node setupProxy.js
```
Finaly, submit task:
```
node submitTask.js
```
We can launch our node:
```
node index.js
```
Here the condition are not fulfilled, for fulfilling the condition we need to set the variable (boolean) isOk of GelatoCondition to true.
For example, we can go to remix id, create a new GelatoCondition.sol and put the following code in the created file : 
```
pragma solidity ^0.6.2;

contract GelatoCondition {
    
    bool public isOk;
    
    function setOK(bool _isOk) external {
        isOk = _isOk;
    }
}
```
We can get the contract with the deployed address, and execute the function "setOK" with the input "true".
After doing that, the node will take the task and execute it.