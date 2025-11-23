// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console} from "forge-std/Test.sol";
import {GameMoveService} from "../src/GameMoveService.sol";

// Mock Staking Contract for testing purposes
contract MockStaking {
    address public evvmAddress;
    
    constructor(address _evvmAddress) {
        evvmAddress = _evvmAddress;
    }

    function getEvvmAddress() external view returns (address) {
        return evvmAddress;
    }

    function prepareServiceStaking(uint256 amount) external {
        // Mock implementation
    }

    function confirmServiceStaking() external {
        // Mock implementation
    }

    function serviceUnstaking(uint256 amount) external {
        // Mock implementation
    }

    function priceOfStaking() external pure returns (uint256) {
        return 1 ether;
    }
}

// Mock EVVM Contract for testing purposes
contract MockEvvm {
    function getEvvmID() external pure returns (uint256) {
        return 1337;
    }

    function pay(
        address from,
        address to,
        string memory metadata,
        address token,
        uint256 amount,
        uint256 priorityFee,
        uint256 nonce,
        bool priorityFlag,
        address fisher,
        bytes memory signature
    ) external {
        // Mock implementation
    }

    function caPay(address to, address token, uint256 amount) external {
        // Mock implementation
    }

    function isAddressStaker(address staker) external pure returns (bool) {
        return true; // Mock: always a staker
    }

    function getRewardAmount() external pure returns (uint256) {
        return 100 ether;
    }
}

contract GameMoveServiceTest is Test {
    GameMoveService public service;
    MockStaking public staking;
    MockEvvm public evvm;

    function setUp() public {
        evvm = new MockEvvm();
        staking = new MockStaking(address(evvm));
        service = new GameMoveService(address(staking));
    }

    function test_RecordMove() public {
        uint256 gameId = 1;
        string memory moveType = "BUILD_ROAD";
        bytes memory data = abi.encode(uint8(5));
        uint256 nonce = 1;

        // 1. Setup Agent
        uint256 agentPrivateKey = 0xA11CE;
        address agent = vm.addr(agentPrivateKey);

        // 2. Construct Message (must match contract logic)
        // Contract: string.concat(Strings.toString(gameId), ",", moveType, ",", dataHash, ",", Strings.toString(nonce));
        // Note: vm.toString(bytes32) returns hex string with 0x. Strings.toHexString also does.
        string memory dataHash = vm.toString(keccak256(data));
        string memory message = string.concat(
            vm.toString(gameId),
            ",",
            moveType,
            ",",
            dataHash,
            ",",
            vm.toString(nonce)
        );

        // 3. Sign Message
        // Try adding commas between prefix args
        string memory fullMessage = string.concat(
            "1337",
            ",",
            "recordMove",
            ",",
            message
        );

        bytes32 messageHash = keccak256(abi.encodePacked(
            "\x19Ethereum Signed Message:\n",
            vm.toString(bytes(fullMessage).length),
            fullMessage
        ));
        
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(agentPrivateKey, messageHash);
        bytes memory signature = abi.encodePacked(r, s, v);

        // 4. Call recordMove
        service.recordMove(
            gameId,
            agent,
            moveType,
            data,
            nonce,
            signature,
            0, // priorityFee
            0, // nonce_EVVM
            false, // priorityFlag
            "" // signature_EVVM
        );

        GameMoveService.Move[] memory moves = service.getMoves(gameId);
        assertEq(moves.length, 1);
        assertEq(moves[0].gameId, gameId);
        assertEq(moves[0].agent, agent);
        assertEq(moves[0].moveType, moveType);
        assertEq(moves[0].data, data);
        
        uint8 edgeId = abi.decode(moves[0].data, (uint8));
        assertEq(edgeId, 5);
    }

    function test_Stake() public {
        // This test mainly verifies that the calls don't revert with the mock
        service.stake(100);
    }

    function test_Unstake() public {
        // This test mainly verifies that the calls don't revert with the mock
        service.unstake(50);
    }
    function test_RecordInvalidMove() public {
        uint256 gameId = 1;
        uint256 agentPrivateKey = 0xB0B;
        address agent = vm.addr(agentPrivateKey);
        uint256 nonce = 1;

        // Helper to sign and call
        _signAndCall(gameId, agent, agentPrivateKey, "BUILD_ROAD", abi.encode(uint8(72)), nonce, "INVALID_EDGE_ID");
        _signAndCall(gameId, agent, agentPrivateKey, "BUILD_SETTLEMENT", abi.encode(uint8(54)), nonce + 1, "INVALID_VERTEX_ID");
        _signAndCall(gameId, agent, agentPrivateKey, "MOVE_ROBBER", abi.encode(uint8(19), address(0)), nonce + 2, "INVALID_HEX_ID");
    }

    function _signAndCall(
        uint256 gameId, 
        address agent, 
        uint256 privateKey, 
        string memory moveType, 
        bytes memory data, 
        uint256 nonce, 
        string memory revertReason
    ) internal {
        string memory dataHash = vm.toString(keccak256(data));
        string memory message = string.concat(
            vm.toString(gameId),
            ",",
            moveType,
            ",",
            dataHash,
            ",",
            vm.toString(nonce)
        );

        string memory fullMessage = string.concat(
            "1337",
            ",",
            "recordMove",
            ",",
            message
        );

        bytes32 messageHash = keccak256(abi.encodePacked(
            "\x19Ethereum Signed Message:\n",
            vm.toString(bytes(fullMessage).length),
            fullMessage
        ));
        
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(privateKey, messageHash);
        bytes memory signature = abi.encodePacked(r, s, v);

        vm.expectRevert(bytes(revertReason));
        service.recordMove(
            gameId,
            agent,
            moveType,
            data,
            nonce,
            signature,
            0, 0, false, ""
        );
    }
}
