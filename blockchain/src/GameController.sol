// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./GameVRFConsumer.sol";
import "@evvm/testnet-contracts/interfaces/IEvvm.sol";
import "@evvm/testnet-contracts/library/SignatureRecover.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract GameController {
    address public owner;
    GameVRFConsumer public vrf;

    uint256 public constant MIN_DEPOSIT = 0.0001 ether;
    uint256 public gameCounter;

    // ----------------------
    // ENUMS
    // ----------------------
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
        address player;
        uint256 deposit;

        bool randomReady;

        LLMModel model1;
        LLMModel model2;

        Civilization civ1;
        Civilization civ2;

        uint256 requestId;
    }

    mapping(uint256 => Game) public games;

    event GameStarted(uint256 indexed gameId, address indexed player, uint256 requestId);
    event GameRandomAssigned(
        uint256 indexed gameId,
        LLMModel model1,
        LLMModel model2,
        Civilization civ1,
        Civilization civ2
    );

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
    string public constant EVVM_ID = "1";

    // ----------------------------------------------------------
    // START GAME
    // ----------------------------------------------------------
    function startGame(bool useNativePayment)
        external
        payable
        returns (uint256 gameId)
    {
        return _startGame(msg.sender, useNativePayment, msg.value);
    }

    function startGameSigned(bool useNativePayment, bytes memory signature)
        external
        payable
        returns (uint256 gameId)
    {
        // Reconstruct the message that was signed: "{EVVM_ID},startGame,{useNativePayment}"
        string memory inputs = useNativePayment ? "true" : "false";
        
        // Verify signature and recover signer
        // Message format: "{evvmID},{functionName},{inputs}"
        address player = SignatureRecover.recoverSigner(
            string.concat(EVVM_ID, ",startGame,", inputs),
            signature
        );
        
        require(player != address(0), "INVALID_SIGNATURE");
        
        return _startGame(player, useNativePayment, msg.value);
    }

    function _startGame(address player, bool useNativePayment, uint256 depositAmount)
        internal
        returns (uint256 gameId)
    {
        require(depositAmount >= MIN_DEPOSIT, "NOT_ENOUGH_ETH");

        gameCounter++;
        gameId = gameCounter;

        uint256 requestId = vrf.requestRandomWords(gameId, useNativePayment);

        games[gameId] = Game({
            player: player,
            deposit: depositAmount,
            randomReady: false,
            model1: LLMModel(0),
            model2: LLMModel(0),
            civ1: Civilization(0),
            civ2: Civilization(0),
            requestId: requestId
        });

        emit GameStarted(gameId, player, requestId);
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

        g.model1 = LLMModel(randomWords[0] % TOTAL_MODELS);
        g.model2 = LLMModel(randomWords[1] % TOTAL_MODELS);

        g.civ1 = Civilization(randomWords[2] % TOTAL_CIVS);
        g.civ2 = Civilization(randomWords[3] % TOTAL_CIVS);

        g.randomReady = true;

        emit GameRandomAssigned(
            gameId,
            g.model1,
            g.model2,
            g.civ1,
            g.civ2
        );
    }

    // ----------------------
    // GAME STATE
    // ----------------------
    struct PlayerState {
        uint256 wood;
        uint256 brick;
        uint256 sheep;
        uint256 wheat;
        uint256 ore;
        uint256 victoryPoints;
        uint256 settlements;
        uint256 roads;
    }

    struct GameState {
        address currentPlayer;
        uint256 turnCount;
        mapping(address => PlayerState) players;
        // Simplified board: mapping location ID to owner
        mapping(uint256 => address) settlementOwners;
        mapping(uint256 => address) roadOwners;
    }

    mapping(uint256 => GameState) public gameStates;

    event DiceRolled(uint256 indexed gameId, address indexed player, uint256 roll);
    event SettlementPlaced(uint256 indexed gameId, address indexed player, uint256 location);
    event RoadBuilt(uint256 indexed gameId, address indexed player, uint256 location);
    event TurnEnded(uint256 indexed gameId, address indexed nextPlayer);

    // ----------------------------------------------------------
    // BASE ACTIONS
    // ----------------------------------------------------------
    function rollDice(uint256 gameId) external {
        _rollDice(gameId, msg.sender);
    }

    function placeSettlement(uint256 gameId, uint256 location) external {
        _placeSettlement(gameId, msg.sender, location);
    }

    function buildRoad(uint256 gameId, uint256 location) external {
        _buildRoad(gameId, msg.sender, location);
    }

    function endTurn(uint256 gameId) external {
        _endTurn(gameId, msg.sender);
    }

    // ----------------------------------------------------------
    // SIGNED ACTIONS (Fisher Execution)
    // ----------------------------------------------------------
    function rollDiceSigned(uint256 gameId, bytes memory signature) external {
        address player = _verifySignature("rollDice", string.concat(Strings.toString(gameId)), signature);
        _rollDice(gameId, player);
    }

    function placeSettlementSigned(uint256 gameId, uint256 location, bytes memory signature) external {
        string memory inputs = string.concat(Strings.toString(gameId), ",", Strings.toString(location));
        address player = _verifySignature("placeSettlement", inputs, signature);
        _placeSettlement(gameId, player, location);
    }

    function buildRoadSigned(uint256 gameId, uint256 location, bytes memory signature) external {
        string memory inputs = string.concat(Strings.toString(gameId), ",", Strings.toString(location));
        address player = _verifySignature("buildRoad", inputs, signature);
        _buildRoad(gameId, player, location);
    }

    function endTurnSigned(uint256 gameId, bytes memory signature) external {
        address player = _verifySignature("endTurn", string.concat(Strings.toString(gameId)), signature);
        _endTurn(gameId, player);
    }

    // ----------------------------------------------------------
    // INTERNAL LOGIC
    // ----------------------------------------------------------
    function _verifySignature(string memory functionName, string memory inputs, bytes memory signature) internal pure returns (address) {
        address player = SignatureRecover.recoverSigner(
            string.concat(EVVM_ID, ",", functionName, ",", inputs),
            signature
        );
        require(player != address(0), "INVALID_SIGNATURE");
        return player;
    }

    function _rollDice(uint256 gameId, address player) internal {
        // In a real game, check turn and state
        // For simplicity, we just request randomness
        vrf.requestRandomWords(gameId, false); 
        emit DiceRolled(gameId, player, 0); // Actual roll comes in callback
    }

    function _placeSettlement(uint256 gameId, address player, uint256 location) internal {
        // Simplified cost: 1 Wood + 1 Brick
        // require(gameStates[gameId].players[player].wood >= 1, "NO_WOOD");
        // require(gameStates[gameId].players[player].brick >= 1, "NO_BRICK");
        
        // Deduct resources (commented out for easy testing without resource logic)
        // gameStates[gameId].players[player].wood--;
        // gameStates[gameId].players[player].brick--;
        
        gameStates[gameId].settlementOwners[location] = player;
        gameStates[gameId].players[player].settlements++;
        gameStates[gameId].players[player].victoryPoints++;
        
        emit SettlementPlaced(gameId, player, location);
    }

    function _buildRoad(uint256 gameId, address player, uint256 location) internal {
        gameStates[gameId].roadOwners[location] = player;
        gameStates[gameId].players[player].roads++;
        emit RoadBuilt(gameId, player, location);
    }

    function _endTurn(uint256 gameId, address player) internal {
        // Rotate turn logic here
        emit TurnEnded(gameId, player);
    }

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
    function getPlayerState(uint256 gameId, address player) external view returns (PlayerState memory) {
        return gameStates[gameId].players[player];
    }
}
