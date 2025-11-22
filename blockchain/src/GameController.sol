// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./GameVRFConsumer.sol";

contract GameController {
    address public owner;
    GameVRFConsumer public vrf;

    uint256 public constant MIN_DEPOSIT = 0.0001 ether;
    uint256 public gameCounter;

    // Demo mode: only one active game per player
    // TODO: Set to false in production to allow multiple concurrent games
    bool public demoMode = true;

    // Track active game for each player (for demo mode)
    mapping(address => uint256) public playerActiveGame;

    // ----------------------
    // ENUMS
    // ----------------------
    enum GameStatus {
        PENDING_RANDOMNESS,  // Waiting for VRF
        ACTIVE,              // Game is being played
        FINISHED,            // Game completed
        CANCELLED            // Game was cancelled
    }

    enum LLMModel {
        CLAUDE_HAIKU_4_5,
        CLAUDE_SONNET_4_5,
        GEMINI_25_FLASH_LITE,
        GEMINI_25_FLASH,
        GPT_5,
        GPT_5_CODEX,
        GROK_4,
        GROK_4_FAST_REASONING,
        DEEPSEEK_V32_EXP_THINKING,
        DEEPSEEK_V32_EXP
    }

    uint256 constant TOTAL_MODELS = 10;

    string[] public MODEL_NAMES = [
        "anthropic/claude-haiku-4.5",
        "anthropic/claude-sonnet-4.5",
        "google/gemini-2.5-flash-lite",
        "google/gemini-2.5-flash",
        "openai/gpt-5",
        "openai/gpt-5-codex",
        "xai/grok-4",
        "xai/grok-4-fast-reasoning",
        "deepseek/deepseek-v3.2-exp-thinking",
        "deepseek/deepseek-v3.2-exp"
    ];

    enum Civilization {
        BYZANTINES,
        CHINESE,
        BRITONS,
        FRANKS,
        MONGOLS,
        AZTECS,
        JAPANESE,
        VIKINGS,
        ARABIANS,
        MAYANS
    }

    uint256 constant TOTAL_CIVS = 10;

    // ----------------------
    // GAME STRUCT
    // ----------------------
    struct Game {
        address player;      // Player 1 (human player)
        uint256 deposit;
        GameStatus status;

        bool randomReady;

        // Player 1 (Human) assignments
        LLMModel playerModel;
        Civilization playerCiv;

        // Player 2 (House/AI) assignments
        LLMModel houseModel;
        Civilization houseCiv;

        uint256 requestId;

        // Game results
        uint256 startTime;
        uint256 endTime;
        uint8 winner; // 0 = draw, 1 = player wins, 2 = house wins

        // TODO: Add reward distribution fields
        // uint256 rewardAmount;
        // bool rewardClaimed;
        // uint256 houseRewardPool; // Pool for house wins
    }

    mapping(uint256 => Game) public games;

    event GameStarted(uint256 indexed gameId, address indexed player, uint256 requestId);
    event GameRandomAssigned(
        uint256 indexed gameId,
        LLMModel playerModel,
        LLMModel houseModel,
        Civilization playerCiv,
        Civilization houseCiv
    );
    event GameActivated(uint256 indexed gameId);
    event GameEnded(uint256 indexed gameId, uint8 winner, uint256 duration);

    // TODO: Add reward events
    // event RewardDistributed(uint256 indexed gameId, address indexed winner, uint256 amount);
    // event RewardClaimed(uint256 indexed gameId, address indexed player, uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "NOT_OWNER");
        _;
    }

    constructor(address vrfAddress) {
        owner = msg.sender;
        vrf = GameVRFConsumer(vrfAddress);
    }

    function setVRF(address vrfAddress) external onlyOwner {
        vrf = GameVRFConsumer(vrfAddress);
    }

    // ----------------------------------------------------------
    // START GAME
    // ----------------------------------------------------------
    /**
     * @notice Start a new game (Player vs House)
     * @param useNativePayment Whether to use native payment for VRF
     * @return gameId The ID of the newly created game
     */
    function startGame(bool useNativePayment)
        external
        payable
        returns (uint256 gameId)
    {
        require(msg.value >= MIN_DEPOSIT, "NOT_ENOUGH_ETH");

        // Demo mode: check if player already has an active game
        if (demoMode) {
            uint256 activeGameId = playerActiveGame[msg.sender];
            if (activeGameId > 0) {
                GameStatus status = games[activeGameId].status;
                require(
                    status == GameStatus.FINISHED || status == GameStatus.CANCELLED,
                    "PLAYER_HAS_ACTIVE_GAME"
                );
            }
        }

        gameCounter++;
        gameId = gameCounter;

        uint256 requestId = vrf.requestRandomWords(gameId, useNativePayment);

        games[gameId] = Game({
            player: msg.sender,
            deposit: msg.value,
            status: GameStatus.PENDING_RANDOMNESS,
            randomReady: false,
            playerModel: LLMModel(0),
            playerCiv: Civilization(0),
            houseModel: LLMModel(0),
            houseCiv: Civilization(0),
            requestId: requestId,
            startTime: block.timestamp,
            endTime: 0,
            winner: 0
        });

        // Track active game for player
        playerActiveGame[msg.sender] = gameId;

        emit GameStarted(gameId, msg.sender, requestId);
    }

    // ----------------------------------------------------------
    // CALLBACK FROM VRF
    // ----------------------------------------------------------
    function fulfillRandomWords(
        uint256 gameId,
        uint256 requestId,
        uint256[] calldata randomWords
    ) external {
        require(msg.sender == address(vrf), "ONLY_VRF");

        Game storage g = games[gameId];
        require(g.requestId == requestId, "REQUEST_MISMATCH");
        require(g.status == GameStatus.PENDING_RANDOMNESS, "INVALID_STATUS");

        // Assign random model and civilization to Player
        g.playerModel = LLMModel(randomWords[0] % TOTAL_MODELS);
        g.playerCiv = Civilization(randomWords[1] % TOTAL_CIVS);

        // Assign random model and civilization to House
        g.houseModel = LLMModel(randomWords[2] % TOTAL_MODELS);
        g.houseCiv = Civilization(randomWords[3] % TOTAL_CIVS);

        g.randomReady = true;
        g.status = GameStatus.ACTIVE;

        emit GameRandomAssigned(
            gameId,
            g.playerModel,
            g.houseModel,
            g.playerCiv,
            g.houseCiv
        );
        emit GameActivated(gameId);
    }

    // ----------------------------------------------------------
    // END GAME
    // ----------------------------------------------------------
    /**
     * @notice Ends an active game and records the winner (Player vs House)
     * @param gameId The ID of the game to end
     * @param _winner Winner indicator: 0 = draw, 1 = player wins, 2 = house wins
     */
    function endGame(uint256 gameId, uint8 _winner) external {
        Game storage g = games[gameId];

        // Only the player who started the game or owner can end it
        // TODO: In production, consider adding oracle/backend signature verification
        // to prevent players from always claiming victory
        require(
            msg.sender == g.player || msg.sender == owner,
            "NOT_AUTHORIZED"
        );
        require(g.status == GameStatus.ACTIVE, "GAME_NOT_ACTIVE");
        require(_winner <= 2, "INVALID_WINNER");

        g.status = GameStatus.FINISHED;
        g.endTime = block.timestamp;
        g.winner = _winner;

        uint256 duration = g.endTime - g.startTime;

        emit GameEnded(gameId, _winner, duration);

        // TODO: Implement reward distribution logic
        // This should handle:
        // 1. Calculate rewards based on winner and game duration
        // 2. Handle prize pool distribution (player win vs house win)
        // 3. Update player stats/rankings
        // 4. Emit reward events
        //
        // Potential reward logic:
        // if (_winner == 1) {
        //     // Player wins
        //     uint256 rewardAmount = calculatePlayerReward(gameId);
        //     g.rewardAmount = rewardAmount;
        //     // payable(g.player).transfer(g.deposit + rewardAmount);
        // } else if (_winner == 2) {
        //     // House wins
        //     // Keep deposit in contract
        //     // g.houseRewardPool += g.deposit;
        // } else {
        //     // Draw: refund deposit
        //     // payable(g.player).transfer(g.deposit);
        // }
    }

    // TODO: Implement reward calculation function
    // function calculateReward(uint256 gameId, uint8 winner) internal view returns (uint256) {
    //     Game storage g = games[gameId];
    //     uint256 baseReward = g.deposit;
    //     // Add bonus calculations based on:
    //     // - Game duration
    //     // - Difficulty (based on AI model)
    //     // - Streak bonuses
    //     // return calculatedAmount;
    // }

    // TODO: Implement reward claiming function
    // function claimReward(uint256 gameId) external {
    //     Game storage g = games[gameId];
    //     require(msg.sender == g.player, "NOT_GAME_OWNER");
    //     require(g.status == GameStatus.FINISHED, "GAME_NOT_FINISHED");
    //     require(!g.rewardClaimed, "ALREADY_CLAIMED");
    //     require(g.rewardAmount > 0, "NO_REWARD");
    //
    //     g.rewardClaimed = true;
    //     payable(msg.sender).transfer(g.rewardAmount);
    //     emit RewardClaimed(gameId, msg.sender, g.rewardAmount);
    // }

    // ----------------------------------------------------------
    // VIEW
    // ----------------------------------------------------------
    function getGame(uint256 gameId)
        external
        view
        returns (Game memory)
    {
        return games[gameId];
    }

    /**
     * @notice Get the status of a game
     * @param gameId The ID of the game
     * @return status The current status of the game
     */
    function getGameStatus(uint256 gameId)
        external
        view
        returns (GameStatus)
    {
        return games[gameId].status;
    }

    /**
     * @notice Get game result information
     * @param gameId The ID of the game
     * @return winner The winner indicator
     * @return duration The game duration in seconds (0 if not finished)
     */
    function getGameResult(uint256 gameId)
        external
        view
        returns (uint8 winner, uint256 duration)
    {
        Game storage g = games[gameId];
        winner = g.winner;
        duration = g.endTime > 0 ? g.endTime - g.startTime : 0;
    }

    /**
     * @notice Get the assigned models and civilizations for a game
     * @param gameId The ID of the game
     * @return playerModel The player's LLM model
     * @return houseModel The house's LLM model
     * @return playerCiv The player's civilization
     * @return houseCiv The house's civilization
     */
    function getGameAssignments(uint256 gameId)
        external
        view
        returns (
            LLMModel playerModel,
            LLMModel houseModel,
            Civilization playerCiv,
            Civilization houseCiv
        )
    {
        Game storage g = games[gameId];
        return (g.playerModel, g.houseModel, g.playerCiv, g.houseCiv);
    }

    /**
     * @notice Get the active game ID for a player (if any)
     * @param player The player address
     * @return gameId The active game ID (0 if no active game)
     */
    function getPlayerActiveGame(address player)
        external
        view
        returns (uint256)
    {
        return playerActiveGame[player];
    }

    // ----------------------------------------------------------
    // ADMIN FUNCTIONS
    // ----------------------------------------------------------
    /**
     * @notice Toggle demo mode (only owner)
     * @param _demoMode true to enable demo mode, false to disable
     */
    function setDemoMode(bool _demoMode) external onlyOwner {
        demoMode = _demoMode;
    }
}
