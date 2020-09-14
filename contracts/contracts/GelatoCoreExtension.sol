pragma solidity ^0.6.10;

import { GelatoSysAdmin } from "@gelatonetwork/core/contracts/gelato_core/GelatoSysAdmin.sol";

contract GelatoCoreExtension {
    
    GelatoSysAdmin gelato;
    
    constructor(address _gelatoCoreAddress) public {
        gelato = GelatoSysAdmin(_gelatoCoreAddress);
    }
    
    function getGasPrice() public view returns(uint256) {
        bytes memory oracleRequestData = gelato.oracleRequestData();
        address gelatoGasPriceOracle = gelato.gelatoGasPriceOracle();
        (bool success, bytes memory returndata) = gelatoGasPriceOracle.staticcall(
            oracleRequestData
        );
        if(success) {
           int oracleGasPrice = abi.decode(returndata, (int256));
            if (oracleGasPrice <= 0) revert("GelatoSysAdmin._getGelatoGasPrice:0orBelow");
            return uint256(oracleGasPrice);
        }
        revert('Gas price request didnt succeed.');
    }

    function getGelatoMaxGas() public view returns(uint256) {
        return gelato.gelatoMaxGas();
    }
}