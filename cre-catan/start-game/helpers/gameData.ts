import {
  type Runtime,
  bytesToHex,
  getNetwork,
  encodeCallMsg,
  LATEST_BLOCK_NUMBER,
  cre,
  type HTTPSendRequester,
  ok,
} from "@chainlink/cre-sdk";
import {
  Address,
  decodeFunctionResult,
  encodeFunctionData,
  parseAbi,
  zeroAddress,
} from "viem";

type Config = {
  schedule: string;
  chainSelectorName: string;
  gameControllerAddress: string;
};

// Enums from GameController.sol
const COMPANY_NAMES = [
  "ANTHROPIC",  // 0
  "GOOGLE",     // 1
  "OPENAI",     // 2
  "XAI",        // 3
  "DEEPSEEK"    // 4
];

const RESOURCE_NAMES = [
  "WOOD",    // 0
  "SHEEP",   // 1
  "WHEAT",   // 2
  "BRICK",   // 3
  "ORE",     // 4
  "DESERT"   // 5
];

const MODEL_NAMES = [
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

// Catan board positions mapping (standard 19-hex layout)
const BOARD_POSITIONS = [
  "Row 1 - Position 1 (Top)",
  "Row 1 - Position 2",
  "Row 1 - Position 3",
  "Row 2 - Position 1",
  "Row 2 - Position 2",
  "Row 2 - Position 3",
  "Row 2 - Position 4",
  "Row 3 - Position 1",
  "Row 3 - Position 2",
  "Row 3 - Position 3",
  "Row 3 - Position 4",
  "Row 3 - Position 5 (Center)",
  "Row 4 - Position 1",
  "Row 4 - Position 2",
  "Row 4 - Position 3",
  "Row 4 - Position 4",
  "Row 5 - Position 1",
  "Row 5 - Position 2",
  "Row 5 - Position 3 (Bottom)",
];

// Game Controller ABI
const GAME_CONTROLLER_ABI = parseAbi([
  "struct AIPlayer { uint8 company; uint8 modelIndex; uint8 playOrder; }",
  "struct Hexagon { uint8 resource; }",
  "struct Game { address bettor; uint256 deposit; uint8 status; bool randomReady; AIPlayer[4] aiPlayers; Hexagon[19] board; uint8 bettorChoice; uint256 requestId; uint256 startTime; uint256 endTime; uint8 winner; }",
  "function getGame(uint256 gameId) view returns (Game)",
]);

// Helper function to convert BigInt to string for JSON serialization
const bigIntReplacer = (_key: string, value: unknown): unknown => {
  if (typeof value === "bigint") {
    return value.toString();
  }
  return value;
};

export type GamePayload = {
  gameId: string;
  bettor: string;
  deposit: string;
  status: number;
  randomReady: boolean;
  bettorChoice: number;
  requestId: string;
  startTime: string;
  endTime: string;
  winner: number;
  aiPlayers: Array<{
    index: number;
    company: number;
    companyName: string;
    modelIndex: number;
    modelName: string;
    playOrder: number;
  }>;
  board: Array<{
    index: number;
    position: string;
    resource: number;
    resourceName: string;
  }>;
};

export const readGameFromBlockchain = async (
  runtime: Runtime<Config>,
  gameId: bigint
): Promise<GamePayload> => {
  try {
    runtime.log("*********************");
    runtime.log("Reading game from blockchain");
    runtime.log(`Game ID: ${gameId}`);
    runtime.log("*********************");

    const network = getNetwork({
      chainFamily: "evm",
      chainSelectorName: runtime.config.chainSelectorName,
      isTestnet: true,
    });

    if (!network) {
      throw new Error(
        `Network ${runtime.config.chainSelectorName} not found`
      );
    }

    const evmClient = new cre.capabilities.EVMClient(
      network.chainSelector.selector
    );

    const callData = encodeFunctionData({
      abi: GAME_CONTROLLER_ABI,
      functionName: "getGame",
      args: [gameId],
    });

    runtime.log("Call data:");
    runtime.log(callData);

    const contractCall = evmClient
      .callContract(runtime, {
        call: encodeCallMsg({
          from: zeroAddress,
          to: runtime.config.gameControllerAddress as Address,
          data: callData,
        }),
        blockNumber: LATEST_BLOCK_NUMBER,
      })
      .result();

    runtime.log("Contract call result:");
    runtime.log(JSON.stringify(contractCall, bigIntReplacer));

    const result = decodeFunctionResult({
      abi: GAME_CONTROLLER_ABI,
      functionName: "getGame",
      data: bytesToHex(contractCall.data),
    });

    // Prepare JSON payload for API
    const gamePayload: GamePayload = {
      gameId: gameId.toString(),
      bettor: result.bettor,
      deposit: result.deposit.toString(),
      status: result.status,
      randomReady: result.randomReady,
      bettorChoice: result.bettorChoice,
      requestId: result.requestId.toString(),
      startTime: result.startTime.toString(),
      endTime: result.endTime.toString(),
      winner: result.winner,
      aiPlayers: result.aiPlayers.map((player, index) => ({
        index,
        company: player.company,
        companyName: COMPANY_NAMES[player.company] || "UNKNOWN",
        modelIndex: player.modelIndex,
        modelName: MODEL_NAMES[player.modelIndex] || "UNKNOWN",
        playOrder: player.playOrder,
      })),
      board: result.board.map((hexagon, index) => ({
        index,
        position: BOARD_POSITIONS[index],
        resource: hexagon.resource,
        resourceName: RESOURCE_NAMES[hexagon.resource] || "UNKNOWN",
      })),
    };

    // Log formatted game data
    logGameData(runtime, gamePayload);

    return gamePayload;
  } catch (error) {
    runtime.log(`Error reading game from blockchain: ${error}`);
    throw error;
  }
};

export const httpRequest = (gamePayload: GamePayload, apiUrl: string) => {
  return (sendRequester: HTTPSendRequester, config: Config) => {
    const bodyBytes = new TextEncoder().encode(JSON.stringify(gamePayload));
    const body = Buffer.from(bodyBytes).toString('base64');

    const req = {
      url: apiUrl,
      method: 'POST' as const,
      body: body,
      headers: {
        'Content-Type': 'application/json',
      },
      cacheSettings: {
        readFromCache: true,
        maxAgeMs: 60000,
      }
    };

    const response = sendRequester.sendRequest(req).result();

    if(!ok(response)) {
      throw new Error(`Failed to send request: ${response.statusCode}`);
    }

    return { statusCode: response.statusCode };
  };
};

const logGameData = (runtime: Runtime<Config>, gamePayload: GamePayload) => {


  // Log AI Players
  runtime.log("\n" + "-".repeat(50));
  runtime.log("AI PLAYERS:");
  runtime.log("-".repeat(50));
  gamePayload.aiPlayers.forEach((player) => {
    runtime.log(`Player ${player.index}:`);
    runtime.log(`  Company: ${player.companyName} (${player.company})`);
    runtime.log(`  Model: ${player.modelName} (Index: ${player.modelIndex})`);
    runtime.log(`  Play Order: ${player.playOrder}`);
  });

  // Log Board (all 19 hexagons) with positions
  runtime.log("\n" + "-".repeat(50));
  runtime.log("BOARD (19 Hexagons):");
  runtime.log("-".repeat(50));
  gamePayload.board.forEach((hexagon) => {
    runtime.log(
      `[${hexagon.index}] ${hexagon.position} - ${hexagon.resourceName} (${hexagon.resource})`
    );
  });

  runtime.log("\n" + "=".repeat(50));
  runtime.log("JSON PAYLOAD FOR API:");
  runtime.log("=".repeat(50));
  runtime.log(JSON.stringify(gamePayload, null, 2));
  runtime.log("=".repeat(50));
};
