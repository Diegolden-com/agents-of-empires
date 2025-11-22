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
    // ENUMS & CONSTANTS
    // ----------------------
    enum GameStatus {
        PENDING_RANDOMNESS,  // Waiting for VRF
        ACTIVE,              // Game is being played
        FINISHED,            // Game completed
        CANCELLED            // Game was cancelled
    }

    enum Company {
        ANTHROPIC,
        GOOGLE,
        OPENAI,
        XAI,
        DEEPSEEK
    }

    enum Resource {
        MADERA,      // Wood - Verde Oscuro
        OVEJA,       // Sheep - Verde Claro
        TRIGO,       // Wheat - Amarillo
        LADRILLO,    // Brick - Rojo/Marrón
        MINERAL,     // Ore - Gris
        DESIERTO     // Desert - Arena (no produce)
    }

    uint256 constant TOTAL_COMPANIES = 5;
    uint256 constant PLAYERS_PER_GAME = 4;
    uint256 constant TOTAL_HEXAGONS = 19;

    // Model indices grouped by company
    // ANTHROPIC: 0-1, GOOGLE: 2-3, OPENAI: 4-5, XAI: 6-7, DEEPSEEK: 8-9
    string[] public MODEL_NAMES = [
        "anthropic/claude-haiku-4.5",        // 0
        "anthropic/claude-sonnet-4.5",       // 1
        "google/gemini-2.5-flash-lite",      // 2
        "google/gemini-2.5-flash",           // 3
        "openai/gpt-5",                      // 4
        "openai/gpt-5-codex",                // 5
        "xai/grok-4",                        // 6
        "xai/grok-4-fast-reasoning",         // 7
        "deepseek/deepseek-v3.2-exp-thinking", // 8
        "deepseek/deepseek-v3.2-exp"         // 9
    ];

    uint256 constant MODELS_PER_COMPANY = 2;

    // ----------------------
    // CATAN BOARD STRUCTS
    // ----------------------
    struct Hexagon {
        Resource resource;
        uint8 diceNumber;    // 2-12 (0 for desert)
    }

    // ----------------------
    // AI PLAYER STRUCT
    // ----------------------
    struct AIPlayer {
        Company company;
        uint8 modelIndex;    // Index in MODEL_NAMES array
        uint8 playOrder;     // 1-4, play order in Catan
    }

    // ----------------------
    // GAME STRUCT
    // ----------------------
    struct Game {
        address bettor;      // Human player who places the bet
        uint256 deposit;
        GameStatus status;

        bool randomReady;

        // 4 AI players
        AIPlayer[4] aiPlayers;

        // Catan board - 19 hexagons
        Hexagon[19] board;

        // Which AI player the bettor chose (0-3)
        uint8 bettorChoice;

        uint256 requestId;

        // Game results
        uint256 startTime;
        uint256 endTime;
        uint8 winner;        // 0 = no winner yet, 1-4 = AI player index who won

        // TODO: Add reward distribution fields
        // uint256 rewardAmount;
        // bool rewardClaimed;
        // uint256 houseRewardPool; // Pool for house wins
    }

    mapping(uint256 => Game) public games;

    event GameStarted(uint256 indexed gameId, address indexed bettor, uint8 bettorChoice, uint256 requestId);
    event GameRandomAssigned(
        uint256 indexed gameId,
        Company[4] companies,
        uint8[4] modelIndices,
        uint8[4] playOrder
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
     * @notice Start a new Catan game with 4 AI players
     * @param bettorChoice Which AI player the bettor bets on (0-3)
     * @param useNativePayment Whether to use native payment for VRF
     * @return gameId The ID of the newly created game
     */
    function startGame(uint8 bettorChoice, bool useNativePayment)
        external
        payable
        returns (uint256 gameId)
    {
        require(msg.value >= MIN_DEPOSIT, "NOT_ENOUGH_ETH");
        require(bettorChoice < PLAYERS_PER_GAME, "INVALID_BETTOR_CHOICE");

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

        // Create game in storage
        Game storage g = games[gameId];
        g.bettor = msg.sender;
        g.deposit = msg.value;
        g.status = GameStatus.PENDING_RANDOMNESS;
        g.randomReady = false;
        g.bettorChoice = bettorChoice;
        g.requestId = requestId;
        g.startTime = block.timestamp;
        g.endTime = 0;
        g.winner = 0;

        // Initialize AI players (already default initialized to 0)

        // Track active game for player
        playerActiveGame[msg.sender] = gameId;

        emit GameStarted(gameId, msg.sender, bettorChoice, requestId);
    }

    // ----------------------------------------------------------
    // CALLBACK FROM VRF (via GameVRFConsumer)
    // ----------------------------------------------------------
    /**
     * @notice Callback from GameVRFConsumer after VRF fulfills randomness
     * @param gameId The game ID
     * @param requestId The VRF request ID
     * @param randomWords Array of random words from VRF
     */
    function receiveRandomWords(
        uint256 gameId,
        uint256 requestId,
        uint256[] calldata randomWords
    ) external {
        require(msg.sender == address(vrf), "ONLY_VRF");

        Game storage g = games[gameId];
        require(g.requestId == requestId, "REQUEST_MISMATCH");
        require(g.status == GameStatus.PENDING_RANDOMNESS, "INVALID_STATUS");
        require(randomWords.length >= 7, "INSUFFICIENT_RANDOM_WORDS");

        // Step 1: Determine which company to exclude (0-4)
        uint8 excludedCompany = uint8(randomWords[0] % TOTAL_COMPANIES);

        // Step 2: Get 4 selected companies
        Company[4] memory selectedCompanies = _selectCompanies(excludedCompany);

        // Step 3: Assign models to each AI player
        uint8[4] memory modelIndices;
        for (uint8 i = 0; i < PLAYERS_PER_GAME; i++) {
            // Get base index for this company (each company has 2 models)
            uint8 companyBaseIndex = uint8(uint8(selectedCompanies[i]) * uint8(MODELS_PER_COMPANY));
            // Select one of the 2 models from this company
            uint8 modelOffset = uint8(randomWords[i + 1] % MODELS_PER_COMPANY);
            modelIndices[i] = companyBaseIndex + modelOffset;

            g.aiPlayers[i].company = selectedCompanies[i];
            g.aiPlayers[i].modelIndex = modelIndices[i];
        }

        // Step 4: Generate random play order (Fisher-Yates shuffle)
        uint8[4] memory playOrder = _generatePlayOrder(randomWords[5]);
        for (uint8 i = 0; i < PLAYERS_PER_GAME; i++) {
            g.aiPlayers[i].playOrder = playOrder[i];
        }

        // Step 5: Generate random Catan board
        _generateCatanBoard(gameId, randomWords[6]);

        g.randomReady = true;
        g.status = GameStatus.ACTIVE;

        emit GameRandomAssigned(gameId, selectedCompanies, modelIndices, playOrder);
        emit GameActivated(gameId);
    }

    /**
     * @notice Select 4 companies from 5, excluding one
     * @param excludedCompany The company to exclude (0-4)
     * @return selectedCompanies Array of 4 selected companies
     */
    function _selectCompanies(uint8 excludedCompany)
        internal
        pure
        returns (Company[4] memory selectedCompanies)
    {
        uint8 index = 0;
        for (uint8 i = 0; i < TOTAL_COMPANIES; i++) {
            if (i != excludedCompany) {
                selectedCompanies[index] = Company(i);
                index++;
            }
        }
    }

    /**
     * @notice Generate random play order using Fisher-Yates shuffle
     * @param seed Random seed for shuffle
     * @return playOrder Array where each position contains the play order (1-4)
     */
    function _generatePlayOrder(uint256 seed)
        internal
        pure
        returns (uint8[4] memory playOrder)
    {
        // Initialize array with values 1, 2, 3, 4
        for (uint8 i = 0; i < PLAYERS_PER_GAME; i++) {
            playOrder[i] = i + 1;
        }

        // Fisher-Yates shuffle
        for (uint8 i = uint8(PLAYERS_PER_GAME) - 1; i > 0; i--) {
            // Generate random index from 0 to i
            uint8 j = uint8(uint256(keccak256(abi.encodePacked(seed, i))) % (i + 1));
            // Swap
            (playOrder[i], playOrder[j]) = (playOrder[j], playOrder[i]);
        }
    }

    /**
     * @notice Generate randomized Catan board with 19 hexagons
     * @param gameId The game ID
     * @param seed Random seed for shuffle
     *
     * Board composition:
     * - 4 Madera (Wood)
     * - 4 Oveja (Sheep)
     * - 4 Trigo (Wheat)
     * - 3 Ladrillo (Brick)
     * - 3 Mineral (Ore)
     * - 1 Desierto (Desert)
     *
     * Dice numbers (18 total, desert gets 0):
     * 2, 3, 3, 4, 4, 5, 5, 6, 6, 8, 8, 9, 9, 10, 10, 11, 11, 12
     */
    function _generateCatanBoard(uint256 gameId, uint256 seed) internal {
        Game storage g = games[gameId];

        // Create base resource array
        Resource[19] memory resources;
        uint8 idx = 0;

        // 4 Madera
        for (uint8 i = 0; i < 4; i++) { resources[idx++] = Resource.MADERA; }
        // 4 Oveja
        for (uint8 i = 0; i < 4; i++) { resources[idx++] = Resource.OVEJA; }
        // 4 Trigo
        for (uint8 i = 0; i < 4; i++) { resources[idx++] = Resource.TRIGO; }
        // 3 Ladrillo
        for (uint8 i = 0; i < 3; i++) { resources[idx++] = Resource.LADRILLO; }
        // 3 Mineral
        for (uint8 i = 0; i < 3; i++) { resources[idx++] = Resource.MINERAL; }
        // 1 Desierto
        resources[idx] = Resource.DESIERTO;

        // Create dice numbers array (standard Catan distribution)
        uint8[18] memory diceNumbers = [
            2, 3, 3, 4, 4, 5, 5, 6, 6, 8, 8, 9, 9, 10, 10, 11, 11, 12
        ];

        // Shuffle resources using Fisher-Yates
        for (uint8 i = 18; i > 0; i--) {
            uint8 j = uint8(uint256(keccak256(abi.encodePacked(seed, "resource", i))) % (i + 1));
            (resources[i], resources[j]) = (resources[j], resources[i]);
        }

        // Shuffle dice numbers
        for (uint8 i = 17; i > 0; i--) {
            uint8 j = uint8(uint256(keccak256(abi.encodePacked(seed, "dice", i))) % (i + 1));
            (diceNumbers[i], diceNumbers[j]) = (diceNumbers[j], diceNumbers[i]);
        }

        // Assign to board
        uint8 diceIdx = 0;
        for (uint8 i = 0; i < TOTAL_HEXAGONS; i++) {
            g.board[i].resource = resources[i];

            // Desert gets no dice number
            if (resources[i] == Resource.DESIERTO) {
                g.board[i].diceNumber = 0;
            } else {
                g.board[i].diceNumber = diceNumbers[diceIdx++];
            }
        }
    }

    // ----------------------------------------------------------
    // END GAME
    // ----------------------------------------------------------
    /**
     * @notice Ends an active Catan game and records the winner
     * @param gameId The ID of the game to end
     * @param _winner Winner indicator: 0 = no winner/cancelled, 1-4 = AI player index who won
     */
    function endGame(uint256 gameId, uint8 _winner) external {
        Game storage g = games[gameId];

        // Only the bettor or owner can end the game
        // TODO: In production, MUST add oracle/backend signature verification
        // to ensure the winner is determined by the actual Catan game outcome
        require(
            msg.sender == g.bettor || msg.sender == owner,
            "NOT_AUTHORIZED"
        );
        require(g.status == GameStatus.ACTIVE, "GAME_NOT_ACTIVE");
        require(_winner <= PLAYERS_PER_GAME, "INVALID_WINNER");

        g.status = GameStatus.FINISHED;
        g.endTime = block.timestamp;
        g.winner = _winner;

        uint256 duration = g.endTime - g.startTime;

        emit GameEnded(gameId, _winner, duration);

        // TODO: Implement reward distribution logic
        // This should handle:
        // 1. Check if bettor's choice matches the winner
        // 2. Calculate rewards based on winner, odds, and game duration
        // 3. Handle prize pool distribution
        // 4. Update player stats/rankings
        // 5. Emit reward events
        //
        // Potential reward logic:
        // if (_winner > 0 && _winner <= PLAYERS_PER_GAME) {
        //     // Game finished with a winner
        //     uint8 winnerIndex = _winner - 1; // Convert to 0-based index
        //     if (g.bettorChoice == winnerIndex) {
        //         // Bettor won!
        //         uint256 rewardAmount = calculateReward(gameId);
        //         g.rewardAmount = g.deposit + rewardAmount;
        //         // payable(g.bettor).transfer(g.rewardAmount);
        //     } else {
        //         // Bettor lost, house keeps deposit
        //         // g.houseRewardPool += g.deposit;
        //     }
        // } else {
        //     // Game cancelled or no winner, refund deposit
        //     // payable(g.bettor).transfer(g.deposit);
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
     * @notice Get the AI players for a game
     * @param gameId The ID of the game
     * @return aiPlayers Array of 4 AI players with their assignments
     */
    function getAIPlayers(uint256 gameId)
        external
        view
        returns (AIPlayer[4] memory aiPlayers)
    {
        return games[gameId].aiPlayers;
    }

    /**
     * @notice Get a specific AI player's information
     * @param gameId The ID of the game
     * @param playerIndex The index of the AI player (0-3)
     * @return company The company of the AI player
     * @return modelIndex The model index in MODEL_NAMES array
     * @return playOrder The play order (1-4)
     * @return modelName The full model name string
     */
    function getAIPlayer(uint256 gameId, uint8 playerIndex)
        external
        view
        returns (
            Company company,
            uint8 modelIndex,
            uint8 playOrder,
            string memory modelName
        )
    {
        require(playerIndex < PLAYERS_PER_GAME, "INVALID_PLAYER_INDEX");
        AIPlayer memory player = games[gameId].aiPlayers[playerIndex];
        return (
            player.company,
            player.modelIndex,
            player.playOrder,
            MODEL_NAMES[player.modelIndex]
        );
    }

    /**
     * @notice Get bettor's choice for a game
     * @param gameId The ID of the game
     * @return bettorChoice The AI player index the bettor chose (0-3)
     */
    function getBettorChoice(uint256 gameId)
        external
        view
        returns (uint8)
    {
        return games[gameId].bettorChoice;
    }

    /**
     * @notice Get the complete Catan board for a game
     * @param gameId The ID of the game
     * @return board Array of 19 hexagons with resources and dice numbers
     */
    function getBoard(uint256 gameId)
        external
        view
        returns (Hexagon[19] memory board)
    {
        return games[gameId].board;
    }

    /**
     * @notice Get a specific hexagon from the board
     * @param gameId The ID of the game
     * @param hexIndex The index of the hexagon (0-18)
     * @return resource The resource type of the hexagon
     * @return diceNumber The dice number (2-12, or 0 for desert)
     */
    function getHexagon(uint256 gameId, uint8 hexIndex)
        external
        view
        returns (Resource resource, uint8 diceNumber)
    {
        require(hexIndex < TOTAL_HEXAGONS, "INVALID_HEX_INDEX");
        Hexagon memory hexagon = games[gameId].board[hexIndex];
        return (hexagon.resource, hexagon.diceNumber);
    }

    /**
     * @notice Get resource name as string
     * @param resource The resource enum value
     * @return name The resource name
     */
    function getResourceName(Resource resource)
        external
        pure
        returns (string memory name)
    {
        if (resource == Resource.MADERA) return "Madera (Wood)";
        if (resource == Resource.OVEJA) return "Oveja (Sheep)";
        if (resource == Resource.TRIGO) return "Trigo (Wheat)";
        if (resource == Resource.LADRILLO) return "Ladrillo (Brick)";
        if (resource == Resource.MINERAL) return "Mineral (Ore)";
        return "Desierto (Desert)";
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
