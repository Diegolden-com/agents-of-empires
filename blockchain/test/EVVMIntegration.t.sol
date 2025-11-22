// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/GameController.sol";
import "@evvm/testnet-contracts/interfaces/IEvvm.sol";

contract MockVRF {
    function requestRandomWords(uint256 /*gameId*/, bool /*enableNativePayment*/) external pure returns (uint256) {
        return 12345; // Mock request ID
    }
}

contract EVVMIntegrationTest is Test {

    GameController public game;
    MockVRF public vrf;

    function setUp() public {
        vrf = new MockVRF();
        game = new GameController(address(vrf));
    }

    function testInitialState() public {
        assertEq(game.owner(), address(this));
    }

    function testEVVMImport() public {
        // This test mainly verifies that the EVVM interfaces are correctly imported and available.
        // In a real scenario, we would mock the EVVM contract calling the GameController.
        assertTrue(address(game) != address(0));
    }

    function testStartGameSigned() public {
        // 1. Create a random signer (Agent)
        uint256 privateKey = 0xA11CE;
        address agent = vm.addr(privateKey);
        vm.deal(agent, 1 ether); // Give agent some ETH if needed (though fisher pays gas)
        
        // 2. Construct the message: "{EVVM_ID},startGame,{useNativePayment}"
        // EVVM_ID is "1" in GameController
        string memory message = "1,startGame,false";
        
        // 3. Sign the message (EIP-191)
        bytes32 messageHash = keccak256(
            abi.encodePacked(
                "\x19Ethereum Signed Message:\n",
                Strings.toString(bytes(message).length),
                message
            )
        );
        
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(privateKey, messageHash);
        bytes memory signature = abi.encodePacked(r, s, v);
        
        // 4. Call startGameSigned as a "Fisher" (this contract)
        // We need to send enough ETH for the deposit
        uint256 deposit = game.MIN_DEPOSIT();
        game.startGameSigned{value: deposit}(false, signature);
        
        // 5. Verify the game was created for the Agent
        // gameId starts at 1
        GameController.Game memory g = game.getGame(1);
        assertEq(g.player, agent, "Player should be the signer (agent), not the caller");
        assertEq(g.deposit, deposit, "Deposit should match");
    }

    function testFullGameLoopSigned() public {
        // 1. Setup Agent
        uint256 privateKey = 0xB0B;
        address agent = vm.addr(privateKey);
        vm.deal(agent, 1 ether);

        // 2. Start Game
        bytes memory sigStart = _sign(privateKey, "1,startGame,false");
        game.startGameSigned{value: game.MIN_DEPOSIT()}(false, sigStart);
        
        uint256 gameId = 1;

        // 3. Roll Dice
        bytes memory sigRoll = _sign(privateKey, "1,rollDice,1");
        game.rollDiceSigned(gameId, sigRoll);

        // 4. Place Settlement at location 10
        bytes memory sigSettlement = _sign(privateKey, "1,placeSettlement,1,10");
        game.placeSettlementSigned(gameId, 10, sigSettlement);

        // 5. Build Road at location 20
        bytes memory sigRoad = _sign(privateKey, "1,buildRoad,1,20");
        game.buildRoadSigned(gameId, 20, sigRoad);

        // 6. End Turn
        bytes memory sigEnd = _sign(privateKey, "1,endTurn,1");
        game.endTurnSigned(gameId, sigEnd);

        // Verify State
        GameController.PlayerState memory state = game.getPlayerState(gameId, agent);
        assertEq(state.settlements, 1, "Should have 1 settlement");
        assertEq(state.roads, 1, "Should have 1 road");
    }

    function _sign(uint256 privateKey, string memory message) internal returns (bytes memory) {
        bytes32 messageHash = keccak256(
            abi.encodePacked(
                "\x19Ethereum Signed Message:\n",
                Strings.toString(bytes(message).length),
                message
            )
        );
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(privateKey, messageHash);
        return abi.encodePacked(r, s, v);
    }
}
import "@openzeppelin/contracts/utils/Strings.sol";
