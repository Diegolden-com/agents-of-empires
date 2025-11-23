import {
  type Runtime,
  bytesToHex,
  getNetwork,
  encodeCallMsg,
  LATEST_BLOCK_NUMBER,
  cre,
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
    modelIndex: number;
    playOrder: number;
  }>;
  board: Array<{
    index: number;
    position: string;
    resource: number;
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
        modelIndex: player.modelIndex,
        playOrder: player.playOrder,
      })),
      board: result.board.map((hexagon, index) => ({
        index,
        position: BOARD_POSITIONS[index],
        resource: hexagon.resource,
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

const logGameData = (runtime: Runtime<Config>, gamePayload: GamePayload) => {
  runtime.log("=".repeat(50));
  runtime.log("COMPLETE GAME DATA:");
  runtime.log("=".repeat(50));

  // Log basic game info
  runtime.log(`Game ID: ${gamePayload.gameId}`);
  runtime.log(`Bettor: ${gamePayload.bettor}`);
  runtime.log(`Deposit: ${gamePayload.deposit}`);
  runtime.log(`Status: ${gamePayload.status}`);
  runtime.log(`Random Ready: ${gamePayload.randomReady}`);
  runtime.log(`Bettor Choice: ${gamePayload.bettorChoice}`);
  runtime.log(`Request ID: ${gamePayload.requestId}`);
  runtime.log(`Start Time: ${gamePayload.startTime}`);
  runtime.log(`End Time: ${gamePayload.endTime}`);
  runtime.log(`Winner: ${gamePayload.winner}`);

  // Log AI Players
  runtime.log("\n" + "-".repeat(50));
  runtime.log("AI PLAYERS:");
  runtime.log("-".repeat(50));
  gamePayload.aiPlayers.forEach((player) => {
    runtime.log(`Player ${player.index}:`);
    runtime.log(`  Company: ${player.company}`);
    runtime.log(`  Model Index: ${player.modelIndex}`);
    runtime.log(`  Play Order: ${player.playOrder}`);
  });

  // Log Board (all 19 hexagons) with positions
  runtime.log("\n" + "-".repeat(50));
  runtime.log("BOARD (19 Hexagons):");
  runtime.log("-".repeat(50));
  gamePayload.board.forEach((hexagon) => {
    runtime.log(
      `[${hexagon.index}] ${hexagon.position} - Resource: ${hexagon.resource}`
    );
  });

  runtime.log("\n" + "=".repeat(50));
  runtime.log("JSON PAYLOAD FOR API:");
  runtime.log("=".repeat(50));
  runtime.log(JSON.stringify(gamePayload, null, 2));
  runtime.log("=".repeat(50));
};
