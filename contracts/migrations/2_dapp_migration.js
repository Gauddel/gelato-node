const GelatoAction = artifacts.require("GelatoAction");
const GelatoCondition = artifacts.require("GelatoCondition");
const Executor = artifacts.require("Executor");
const GelatoCoreExtension = artifacts.require("GelatoCoreExtension");

module.exports = async function (deployer) {
  await deployer.deploy(GelatoAction);
  await deployer.deploy(GelatoCondition, '0x733aDEf4f8346FD96107d8d6605eA9ab5645d632');
  await deployer.deploy(Executor, '0x733aDEf4f8346FD96107d8d6605eA9ab5645d632');
  await deployer.deploy(GelatoCoreExtension, '0x733aDEf4f8346FD96107d8d6605eA9ab5645d632');
};