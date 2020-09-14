pragma solidity ^0.6.10;
pragma experimental ABIEncoderV2;

import {GelatoActionsStandard} from "@gelatonetwork/core/contracts/actions/GelatoActionsStandard.sol";
import {IGelatoInFlowAction} from "@gelatonetwork/core/contracts/actions/action_pipeline_interfaces/IGelatoInFlowAction.sol";
import {DataFlow} from "@gelatonetwork/core/contracts/gelato_core/interfaces/IGelatoCore.sol";
import {GelatoBytes} from "@gelatonetwork/core/contracts/libraries/GelatoBytes.sol";
import {SafeERC20} from "@gelatonetwork/core/contracts/external/SafeERC20.sol";
import {SafeMath} from "@gelatonetwork/core/contracts/external/SafeMath.sol";

contract GelatoAction is GelatoActionsStandard, IGelatoInFlowAction {

    using SafeMath for uint256;
    uint public numberToSet;

    function DATA_FLOW_IN_TYPE() external override pure returns (bytes32) {
        return keccak256("TOKEN,UINT256");
    }

    // function getActionData() public pure virtual returns(bytes memory) {
    //     //return abi.encodeWithSelector(this.action.selector, arg);
    // }

    function execWithDataFlowIn(bytes calldata _actionData, bytes calldata _inFlowData) external payable virtual override {
        // uint nbToSet = abi.decode(_actionData, (uint));
    }

    function action(uint256 _numberToSet) public {
        numberToSet = _numberToSet;
    }
}