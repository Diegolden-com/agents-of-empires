// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/// @title IERC165
/// @notice Interface of the ERC165 standard
interface IERC165 {
    /// @notice Query if a contract implements an interface
    /// @param interfaceId The interface identifier
    /// @return true if the contract implements interfaceId
    function supportsInterface(bytes4 interfaceId) external view returns (bool);
}
