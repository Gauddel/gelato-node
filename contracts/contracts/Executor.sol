pragma solidity ^0.6.2;
pragma experimental ABIEncoderV2;

import { GelatoCore, TaskReceipt } from "@gelatonetwork/core/contracts/gelato_core/GelatoCore.sol";
import {SafeMath} from "@gelatonetwork/core/contracts/external/SafeMath.sol";
import {Ownable} from "@gelatonetwork/core/contracts/external/Ownable.sol";

contract Executor is Ownable { // Decentralized Executor.

    using SafeMath for uint256;

    GelatoCore public gelatoCore;
    uint public minimumStake;

    constructor(address _gelatoCore) public {
        gelatoCore = GelatoCore(_gelatoCore);
    }

    function stake() external payable onlyOwner {
        require(msg.value > gelatoCore.minExecutorStake(), "Staking amount is not enough");
        minimumStake = gelatoCore.minExecutorStake();
        gelatoCore.stakeExecutor.value(minimumStake)();
    }

    function unstake() external onlyOwner {
        gelatoCore.unstakeExecutor();
        payable(msg.sender).transfer(address(this).balance);
    }

    function payRelayer() internal {
        assert(gelatoCore.executorStake(address(this)) >= minimumStake);
        uint256 withdrawAmount = gelatoCore.executorStake(address(this)) - minimumStake;
        gelatoCore.withdrawExcessExecutorStake(withdrawAmount);
        payable(msg.sender).transfer(withdrawAmount);
    }

    function exec(TaskReceipt memory _TR) external { // Decentralized execution.
        gelatoCore.exec(_TR);
        payRelayer();
    }

    function canExec(TaskReceipt memory _TR, uint256 _gasLimit, uint256 _gelatoGasPrice) external returns(string memory) {
        return gelatoCore.canExec(_TR, _gasLimit, _gelatoGasPrice);
    }

    receive() external payable {
        
    }
}