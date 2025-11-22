// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./GameVRFConsumer.sol";

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
    function startGame(bool useNativePayment)
        external
        payable
        returns (uint256 gameId)
    {
        require(msg.value >= MIN_DEPOSIT, "NOT_ENOUGH_ETH");

        gameCounter++;
        gameId = gameCounter;

        uint256 requestId = vrf.requestRandomWords(gameId, useNativePayment);

        games[gameId] = Game({
            player: msg.sender,
            deposit: msg.value,
            randomReady: false,
            model1: LLMModel(0),
            model2: LLMModel(0),
            civ1: Civilization(0),
            civ2: Civilization(0),
            requestId: requestId
        });

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
}
