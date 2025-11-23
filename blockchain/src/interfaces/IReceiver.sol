// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {IERC165} from "./IERC165.sol";

/// @title IReceiver
/// @notice Interface that Chainlink CRE Forwarder expects for receiving workflow reports
interface IReceiver is IERC165 {
    /// @notice Called by the Chainlink Forwarder to deliver a workflow report
    /// @param metadata Encoded workflow metadata (workflowId, workflowName, workflowOwner)
    /// @param report The encoded payload from your workflow
    function onReport(bytes calldata metadata, bytes calldata report) external;
}
