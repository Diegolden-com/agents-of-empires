// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./GameVRFConsumer.sol";

// ADDRESS DEPLOYED: 0xCE21A1Ee76726Bb487684330BB216E5f233A47fb
contract GameController {
    address public owner;
    GameVRFConsumer public vrf;
    address public creWorkflow;

    uint256 public constant MIN_DEPOSIT = 0.0001 ether;
    uint256 public gameCounter;

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
        WOOD,        // Wood
        SHEEP,       // Sheep
        WHEAT,       // Wheat
        BRICK,       // Brick
        ORE,         // Ore
        DESERT       // Desert (no produce)
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
    event CREWorkflowUpdated(address indexed oldWorkflow, address indexed newWorkflow);

    // TODO: Add reward events
    // event RewardDistributed(uint256 indexed gameId, address indexed winner, uint256 amount);
    // event RewardClaimed(uint256 indexed gameId, address indexed player, uint256 amount);

    modifier onlyOwner() {
        _onlyOwner();
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
     * @return gameId The ID of the newly created game
     */
    function startGame(uint8 bettorChoice)
        external
        payable
        returns (uint256 gameId)
    {
        require(msg.value >= MIN_DEPOSIT, "NOT_ENOUGH_ETH");
        require(bettorChoice < PLAYERS_PER_GAME, "INVALID_BETTOR_CHOICE");

        gameCounter++;
        gameId = gameCounter;

        uint256 requestId = vrf.requestRandomWords(gameId, true);

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

        emit GameStarted(gameId, msg.sender, bettorChoice, requestId);
    }

    // ----------------------------------------------------------
    // CALLBACK FROM VRF (via GameVRFConsumer)
    // ----------------------------------------------------------
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
     * Resources: 4 Wood, 4 Sheep, 4 Wheat, 3 Brick, 3 Ore, 1 Desert
     */
    function _generateCatanBoard(uint256 gameId, uint256 seed) internal {
        Game storage g = games[gameId];

        // Create base resource array
        Resource[19] memory resources;
        uint8 idx = 0;

        // 4 Wood
        for (uint8 i = 0; i < 4; i++) { resources[idx++] = Resource.WOOD; }
        // 4 Sheep
        for (uint8 i = 0; i < 4; i++) { resources[idx++] = Resource.SHEEP; }
        // 4 Wheat
        for (uint8 i = 0; i < 4; i++) { resources[idx++] = Resource.WHEAT; }
        // 3 Brick
        for (uint8 i = 0; i < 3; i++) { resources[idx++] = Resource.BRICK; }
        // 3 Ore
        for (uint8 i = 0; i < 3; i++) { resources[idx++] = Resource.ORE; }
        // 1 Desert
        resources[idx] = Resource.DESERT;

        // Shuffle resources using Fisher-Yates
        for (uint8 i = 18; i > 0; i--) {
            uint8 j = uint8(uint256(keccak256(abi.encodePacked(seed, i))) % (i + 1));
            (resources[i], resources[j]) = (resources[j], resources[i]);
        }

        // Assign to board
        for (uint8 i = 0; i < TOTAL_HEXAGONS; i++) {
            g.board[i].resource = resources[i];
        }
    }

    // ----------------------------------------------------------
    // END GAME
    // ----------------------------------------------------------
    /**
     * @notice Ends an active Catan game and records the winner
     * @dev Only callable by Chainlink CRE workflow or owner
     * @param gameId The ID of the game to end
     * @param _winner Winner indicator: 0 = no winner/cancelled, 1-4 = AI player index who won
     */
    function endGame(uint256 gameId, uint8 _winner) external {
        require(
            msg.sender == creWorkflow || msg.sender == owner,
            "ONLY_CRE_OR_OWNER"
        );

        Game storage g = games[gameId];
        require(g.status == GameStatus.ACTIVE, "GAME_NOT_ACTIVE");
        require(_winner <= PLAYERS_PER_GAME, "INVALID_WINNER");

        g.status = GameStatus.FINISHED;
        g.endTime = block.timestamp;
        g.winner = _winner;

        emit GameEnded(gameId, _winner, g.endTime - g.startTime);

        // TODO: Implement reward distribution based on bettor's choice vs winner
    }

    // TODO: Implement reward system (calculateReward, claimReward, etc.)

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

    function getGameStatus(uint256 gameId) external view returns (GameStatus) {
        return games[gameId].status;
    }

    function getGameResult(uint256 gameId) external view returns (uint8 winner, uint256 duration) {
        Game storage g = games[gameId];
        winner = g.winner;
        duration = g.endTime > 0 ? g.endTime - g.startTime : 0;
    }

    function getAIPlayers(uint256 gameId) external view returns (AIPlayer[4] memory) {
        return games[gameId].aiPlayers;
    }

    function getAIPlayer(uint256 gameId, uint8 playerIndex)
        external
        view
        returns (Company company, uint8 modelIndex, uint8 playOrder, string memory modelName)
    {
        require(playerIndex < PLAYERS_PER_GAME, "INVALID_PLAYER_INDEX");
        AIPlayer memory player = games[gameId].aiPlayers[playerIndex];
        return (player.company, player.modelIndex, player.playOrder, MODEL_NAMES[player.modelIndex]);
    }

    function getBettorChoice(uint256 gameId) external view returns (uint8) {
        return games[gameId].bettorChoice;
    }

    function getBoard(uint256 gameId) external view returns (Hexagon[19] memory) {
        return games[gameId].board;
    }

    function getHexagon(uint256 gameId, uint8 hexIndex)
        external
        view
        returns (Resource resource)
    {
        require(hexIndex < TOTAL_HEXAGONS, "INVALID_HEX_INDEX");
        return games[gameId].board[hexIndex].resource;
    }

    function getResourceName(Resource resource) external pure returns (string memory) {
        if (resource == Resource.WOOD) return "Wood";
        if (resource == Resource.SHEEP) return "Sheep";
        if (resource == Resource.WHEAT) return "Wheat";
        if (resource == Resource.BRICK) return "Brick";
        if (resource == Resource.ORE) return "Ore";
        return "Desert";
    }

    // ----------------------------------------------------------
    // ADMIN
    // ----------------------------------------------------------
    function setCREWorkflow(address _creWorkflow) external onlyOwner {
        require(_creWorkflow != address(0), "ZERO_ADDRESS");
        address oldWorkflow = creWorkflow;
        creWorkflow = _creWorkflow;
        emit CREWorkflowUpdated(oldWorkflow, _creWorkflow);
    }
}
