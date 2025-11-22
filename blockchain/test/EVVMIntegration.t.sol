// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/GameController.sol";
import "../src/GameVRFConsumer.sol";

contract MockVRF {
    function requestRandomWords(uint256 /*gameId*/, bool /*enableNativePayment*/) external pure returns (uint256) {
        return 12345; // Mock request ID
    }
}

contract EVVMIntegrationTest is Test {
    GameController public game;
    MockVRF public vrf;
    address public bettor;

    function setUp() public {
        vrf = new MockVRF();
        game = new GameController(address(vrf));
        bettor = address(0x1234);
        vm.deal(bettor, 10 ether);
    }

    function testInitialState() public {
        assertEq(game.owner(), address(this));
        assertEq(game.gameCounter(), 0);
    }

    function testStartGame() public {
        vm.startPrank(bettor);
        uint256 gameId = game.startGame{value: game.MIN_DEPOSIT()}(2); // Bet on AI player 2
        vm.stopPrank();
        
        assertEq(gameId, 1, "First game should have ID 1");
        assertEq(game.gameCounter(), 1, "Game counter should be 1");
        
        GameController.Game memory g = game.getGame(gameId);
        assertEq(g.bettor, bettor, "Bettor should be set correctly");
        assertEq(g.deposit, game.MIN_DEPOSIT(), "Deposit should match");
        assertEq(g.bettorChoice, 2, "Bettor choice should be 2");
        assertEq(uint8(g.status), uint8(GameController.GameStatus.PENDING_RANDOMNESS), "Status should be PENDING_RANDOMNESS");
        assertEq(g.randomReady, false, "Random should not be ready yet");
    }

    function testStartGameInsufficientDeposit() public {
        vm.prank(bettor);
        vm.expectRevert("NOT_ENOUGH_ETH");
        game.startGame{value: 0.00001 ether}(0);
    }

    function testStartGameInvalidBettorChoice() public {
        vm.startPrank(bettor);
        vm.expectRevert("INVALID_BETTOR_CHOICE");
        game.startGame{value: 0.0001 ether}(4); // Invalid choice (only 0-3 allowed)
        vm.stopPrank();
    }

    function testReceiveRandomWords() public {
        // Start a game first
        vm.prank(bettor);
        uint256 gameId = game.startGame{value: game.MIN_DEPOSIT()}(1);
        
        // Prepare random words (need at least 7)
        uint256[] memory randomWords = new uint256[](7);
        randomWords[0] = 2; // Exclude company 2 (OPENAI)
        randomWords[1] = 1; // Model selection for player 0
        randomWords[2] = 0; // Model selection for player 1
        randomWords[3] = 1; // Model selection for player 2
        randomWords[4] = 0; // Model selection for player 3
        randomWords[5] = 42; // Play order seed
        randomWords[6] = 123; // Board generation seed
        
        // Call receiveRandomWords as VRF
        vm.prank(address(vrf));
        game.receiveRandomWords(gameId, 12345, randomWords);
        
        // Verify game state
        GameController.Game memory g = game.getGame(gameId);
        assertEq(g.randomReady, true, "Random should be ready");
        assertEq(uint8(g.status), uint8(GameController.GameStatus.ACTIVE), "Status should be ACTIVE");
        
        // Verify AI players were assigned
        GameController.AIPlayer[4] memory players = game.getAIPlayers(gameId);
        for (uint8 i = 0; i < 4; i++) {
            assertTrue(players[i].playOrder >= 1 && players[i].playOrder <= 4, "Play order should be 1-4");
        }
        
        // Verify board was generated
        GameController.Hexagon[19] memory board = game.getBoard(gameId);
        // Count resources to verify proper distribution
        uint256 woodCount = 0;
        uint256 sheepCount = 0;
        uint256 wheatCount = 0;
        uint256 brickCount = 0;
        uint256 oreCount = 0;
        uint256 desertCount = 0;
        
        for (uint8 i = 0; i < 19; i++) {
            if (board[i].resource == GameController.Resource.WOOD) woodCount++;
            else if (board[i].resource == GameController.Resource.SHEEP) sheepCount++;
            else if (board[i].resource == GameController.Resource.WHEAT) wheatCount++;
            else if (board[i].resource == GameController.Resource.BRICK) brickCount++;
            else if (board[i].resource == GameController.Resource.ORE) oreCount++;
            else if (board[i].resource == GameController.Resource.DESERT) desertCount++;
        }
        
        assertEq(woodCount, 4, "Should have 4 wood hexagons");
        assertEq(sheepCount, 4, "Should have 4 sheep hexagons");
        assertEq(wheatCount, 4, "Should have 4 wheat hexagons");
        assertEq(brickCount, 3, "Should have 3 brick hexagons");
        assertEq(oreCount, 3, "Should have 3 ore hexagons");
        assertEq(desertCount, 1, "Should have 1 desert hexagon");
    }

    function testEndGame() public {
        // Start and activate a game
        vm.prank(bettor);
        uint256 gameId = game.startGame{value: game.MIN_DEPOSIT()}(1);
        
        uint256[] memory randomWords = new uint256[](7);
        for (uint8 i = 0; i < 7; i++) {
            randomWords[i] = i + 1;
        }
        
        vm.prank(address(vrf));
        game.receiveRandomWords(gameId, 12345, randomWords);
        
        // End the game with winner = 2
        game.endGame(gameId, 2);
        
        GameController.Game memory g = game.getGame(gameId);
        assertEq(uint8(g.status), uint8(GameController.GameStatus.FINISHED), "Status should be FINISHED");
        assertEq(g.winner, 2, "Winner should be player 2");
        assertTrue(g.endTime > 0, "End time should be set");
    }

    function testEndGameOnlyOwnerOrCRE() public {
        // Start and activate a game
        vm.prank(bettor);
        uint256 gameId = game.startGame{value: game.MIN_DEPOSIT()}(1);
        
        uint256[] memory randomWords = new uint256[](7);
        for (uint8 i = 0; i < 7; i++) {
            randomWords[i] = i + 1;
        }
        
        vm.prank(address(vrf));
        game.receiveRandomWords(gameId, 12345, randomWords);
        
        // Try to end game as non-owner/non-CRE
        vm.prank(bettor);
        vm.expectRevert("ONLY_CRE_OR_OWNER");
        game.endGame(gameId, 1);
    }

    function testGetAIPlayer() public {
        // Start and activate a game
        vm.prank(bettor);
        uint256 gameId = game.startGame{value: game.MIN_DEPOSIT()}(0);
        
        uint256[] memory randomWords = new uint256[](7);
        randomWords[0] = 1; // Exclude GOOGLE
        randomWords[1] = 1; // Model for player 0
        randomWords[2] = 0;
        randomWords[3] = 1;
        randomWords[4] = 0;
        randomWords[5] = 42;
        randomWords[6] = 123;
        
        vm.prank(address(vrf));
        game.receiveRandomWords(gameId, 12345, randomWords);
        
        // Get AI player info
        (, uint8 modelIndex, uint8 playOrder, string memory modelName) = 
            game.getAIPlayer(gameId, 0);
        
        assertTrue(modelIndex < 10, "Model index should be valid");
        assertTrue(playOrder >= 1 && playOrder <= 4, "Play order should be 1-4");
        assertTrue(bytes(modelName).length > 0, "Model name should not be empty");
    }

    function testSetCREWorkflow() public {
        address newCRE = address(0x9999);
        game.setCREWorkflow(newCRE);
        assertEq(game.creWorkflow(), newCRE, "CRE workflow should be updated");
    }

    function testSetCREWorkflowOnlyOwner() public {
        address newCRE = address(0x9999);
        vm.prank(bettor);
        vm.expectRevert("NOT_OWNER");
        game.setCREWorkflow(newCRE);
    }
}
