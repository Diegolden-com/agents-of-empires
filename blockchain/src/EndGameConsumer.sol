// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC165} from "./interfaces/IERC165.sol";
import {IReceiver} from "./interfaces/IReceiver.sol";

interface IGameController {
    function endGame(uint256 gameId, uint8 winner) external;
}

/// @title EndGameConsumer
/// @notice Receives game completion reports from Chainlink CRE workflow and calls GameController.endGame()
/// @dev Inherits security checks from IReceiverTemplate pattern
contract EndGameConsumer is IReceiver {
    address public owner;
    // Optional permission fields (all default to zero = disabled)
    address public forwarderAddress;
    address public expectedAuthor;
    bytes10 public expectedWorkflowName;
    bytes32 public expectedWorkflowId;

    // GameController reference
    IGameController public gameController;

    // Events
    event GameEnded(uint256 indexed gameId, uint8 winner);
    event GameControllerUpdated(address indexed oldController, address indexed newController);

    // Custom errors
    error InvalidSender(address sender, address expected);
    error InvalidAuthor(address received, address expected);
    error InvalidWorkflowName(bytes10 received, bytes10 expected);
    error InvalidWorkflowId(bytes32 received, bytes32 expected);
    error GameControllerNotSet();
    error NotOwner();

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    constructor(address _gameController) {
        require(_gameController != address(0), "ZERO_ADDRESS");
        owner = msg.sender;
        gameController = IGameController(_gameController);
    }

    /// @inheritdoc IReceiver
    /// @dev Receives signed report from CRE workflow with game result
    function onReport(bytes calldata metadata, bytes calldata report) external override {
        // Security Check 1: Verify caller is the trusted Chainlink Forwarder (if configured)
        if (forwarderAddress != address(0) && msg.sender != forwarderAddress) {
            revert InvalidSender(msg.sender, forwarderAddress);
        }

        // Security Checks 2-4: Verify workflow identity
        if (expectedWorkflowId != bytes32(0) || expectedAuthor != address(0) || expectedWorkflowName != bytes10(0)) {
            (bytes32 workflowId, bytes10 workflowName, address workflowOwner) = _decodeMetadata(metadata);

            if (expectedWorkflowId != bytes32(0) && workflowId != expectedWorkflowId) {
                revert InvalidWorkflowId(workflowId, expectedWorkflowId);
            }
            if (expectedAuthor != address(0) && workflowOwner != expectedAuthor) {
                revert InvalidAuthor(workflowOwner, expectedAuthor);
            }
            if (expectedWorkflowName != bytes10(0) && workflowName != expectedWorkflowName) {
                revert InvalidWorkflowName(workflowName, expectedWorkflowName);
            }
        }

        _processReport(report);
    }

    /// @notice Decodes report and calls GameController.endGame()
    /// @param report Encoded data containing (uint256 gameId, uint8 winner)
    function _processReport(bytes calldata report) internal {
        if (address(gameController) == address(0)) {
            revert GameControllerNotSet();
        }

        // Decode report: (gameId, winner)
        (uint256 gameId, uint8 winner) = abi.decode(report, (uint256, uint8));

        // Call GameController to end the game
        gameController.endGame(gameId, winner);

        emit GameEnded(gameId, winner);
    }

    /// @notice Updates the GameController address
    /// @param _gameController New GameController address
    function setGameController(address _gameController) external onlyOwner {
        require(_gameController != address(0), "ZERO_ADDRESS");
        address oldController = address(gameController);
        gameController = IGameController(_gameController);
        emit GameControllerUpdated(oldController, _gameController);
    }

    /// @notice Updates the forwarder address that is allowed to call onReport
    /// @param _forwarder The new forwarder address (use address(0) to disable this check)
    function setForwarderAddress(address _forwarder) external onlyOwner {
        forwarderAddress = _forwarder;
    }

    /// @notice Updates the expected workflow owner address
    /// @param _author The new expected author address (use address(0) to disable this check)
    function setExpectedAuthor(address _author) external onlyOwner {
        expectedAuthor = _author;
    }

    /// @notice Updates the expected workflow name from a plaintext string
    /// @param _name The workflow name as a string (use empty string "" to disable this check)
    function setExpectedWorkflowName(string calldata _name) external onlyOwner {
        if (bytes(_name).length == 0) {
            expectedWorkflowName = bytes10(0);
            return;
        }

        bytes32 hash = sha256(bytes(_name));
        bytes memory hexString = _bytesToHexString(abi.encodePacked(hash));
        bytes memory first10 = new bytes(10);
        for (uint i = 0; i < 10; i++) {
            first10[i] = hexString[i];
        }
        expectedWorkflowName = bytes10(first10);
    }

    /// @notice Updates the expected workflow ID
    /// @param _id The new expected workflow ID (use bytes32(0) to disable this check)
    function setExpectedWorkflowId(bytes32 _id) external onlyOwner {
        expectedWorkflowId = _id;
    }

    /// @notice Helper function to convert bytes to hex string
    function _bytesToHexString(bytes memory data) private pure returns (bytes memory) {
        bytes memory hexChars = "0123456789abcdef";
        bytes memory hexString = new bytes(data.length * 2);

        for (uint256 i = 0; i < data.length; i++) {
            hexString[i * 2] = hexChars[uint8(data[i] >> 4)];
            hexString[i * 2 + 1] = hexChars[uint8(data[i] & 0x0f)];
        }

        return hexString;
    }

    /// @notice Extracts metadata from onReport
    function _decodeMetadata(bytes memory metadata)
        internal
        pure
        returns (bytes32 workflowId, bytes10 workflowName, address workflowOwner)
    {
        assembly {
            workflowId := mload(add(metadata, 32))
            workflowName := mload(add(metadata, 64))
            workflowOwner := shr(mul(12, 8), mload(add(metadata, 74)))
        }
    }

    /// @inheritdoc IERC165
    function supportsInterface(bytes4 interfaceId) public pure override returns (bool) {
        return interfaceId == type(IReceiver).interfaceId || interfaceId == type(IERC165).interfaceId;
    }
}
