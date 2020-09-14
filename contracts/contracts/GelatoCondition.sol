pragma solidity ^0.6.2;
pragma experimental ABIEncoderV2;

import {GelatoStatefulConditionsStandard} from "@gelatonetwork/core/contracts/conditions/GelatoStatefulConditionsStandard.sol";
import {SafeMath} from "@gelatonetwork/core/contracts/external/SafeMath.sol";
import {IGelatoCore} from "@gelatonetwork/core/contracts/gelato_core/interfaces/IGelatoCore.sol";
import {IERC20} from "@gelatonetwork/core/contracts/external/IERC20.sol";

contract GelatoCondition is GelatoStatefulConditionsStandard {

    bool public isOk;

    constructor(address _gelatoCore) public GelatoStatefulConditionsStandard(IGelatoCore(_gelatoCore)) {
        isOk = false;
    }

    function ok(uint256 _taskReceiptId, bytes calldata _conditionData, uint256 _cycleId) public view virtual override returns(string memory) {
        if (isOk) {
            return OK;
        }
        return "NotOKForDoingAction";
    }

    function setOK(bool _isOk) external {
        isOk = _isOk;
    }
}