import {
  cre,
  Runner,
  type Runtime,
  type EVMLog,
  bytesToHex,
  getNetwork,
  LAST_FINALIZED_BLOCK_NUMBER,
  encodeCallMsg,
  LATEST_BLOCK_NUMBER,
} from "@chainlink/cre-sdk";
import {
  Address,
  decodeEventLog,
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

// Define all events from GameController.sol
const eventAbi = parseAbi(["event GameActivated(uint256 indexed gameId)"]);

// Helper function to convert BigInt to string for JSON serialization
const bigIntReplacer = (_key: string, value: unknown): unknown => {
  if (typeof value === "bigint") {
    return value.toString();
  }
  return value;
};

const readGameFromBlockchain = async (
  runtime: Runtime<Config>,
  gameId: bigint
) => {

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
    throw new Error(`Network ${runtime.config.chainSelectorName} not found`);
  }

  const evmClient = new cre.capabilities.EVMClient(
    network.chainSelector.selector
  );

  const gameControllerAbi = parseAbi([
    "struct AIPlayer { uint8 company; uint8 modelIndex; uint8 playOrder; }",
    "struct Hexagon { uint8 resource; }",
    "struct Game { address bettor; uint256 deposit; uint8 status; bool randomReady; AIPlayer[4] aiPlayers; Hexagon[19] board; uint8 bettorChoice; uint256 requestId; uint256 startTime; uint256 endTime; uint8 winner; }",
    "function getGame(uint256 gameId) view returns (Game)",
  ]);

  const callData = encodeFunctionData({
    abi: gameControllerAbi,
    functionName: "getGame",
    args: [gameId],
  });

  runtime.log("Call data:");
  runtime.log(callData);

  const contractCall = await evmClient.callContract(runtime, {
    call: encodeCallMsg({
      from: zeroAddress,
      to: runtime.config.gameControllerAddress as Address,
      data: callData,
    }),
    blockNumber: LATEST_BLOCK_NUMBER,
  }).result();

  runtime.log("Contract call result:");
  runtime.log(JSON.stringify(contractCall, bigIntReplacer));

  const result = decodeFunctionResult({
    abi: gameControllerAbi,
    functionName: "getGame",
    data: bytesToHex(contractCall.data),
  });

  runtime.log("Decoded result:");
  runtime.log(JSON.stringify(result, bigIntReplacer, 2));

  return result;
  } catch (error) {
    runtime.log(`Error reading game from blockchain: ${error}`);
    throw error;
  }
};

const onLogTrigger = async (runtime: Runtime<Config>, log: EVMLog): Promise<string> => {
  runtime.log(`Log detected from ${log.address}`);

  try {
    const topics = log.topics.map((topic) => bytesToHex(topic)) as [
      `0x${string}`,
      ...`0x${string}`[]
    ];
    const data = bytesToHex(log.data);

    // Decode the event
    const decodedLog = decodeEventLog({
      abi: eventAbi,
      data,
      topics,
    });

    runtime.log(`Event name: ${decodedLog.eventName}`);

    if (decodedLog.eventName === "GameActivated") {
      const { gameId } = decodedLog.args;

      runtime.log(`GameActivated Event Detected!`);
      runtime.log(`  Game ID: ${gameId.toString()}`);

      const gameData = await readGameFromBlockchain(runtime, gameId);

      // TODO: here we add our logic to start the game
      // For example: fetch game details, trigger AI players, etc.

      return `Game ${gameId.toString()} activated successfully`;
    }
  } catch (error) {
    runtime.log(`Error decoding log: ${error}`);
    return "Error processing log";
  }

  return "Log processed";
};

const onCronTrigger = (runtime: Runtime<Config>): string => {
  runtime.log("Hello world! Workflow triggered.");
  return "Hello world!";
};

const initWorkflow = (config: Config) => {
  const cron = new cre.capabilities.CronCapability();
  const network = getNetwork({
    chainFamily: "evm",
    chainSelectorName: config.chainSelectorName,
    isTestnet: true,
  });

  if (!network) {
    throw new Error(`Network ${config.chainSelectorName} not found`);
  }

  console.log(`Network found: ${network.chainSelector.name}`);

  const evmClient = new cre.capabilities.EVMClient(
    network.chainSelector.selector
  );

  return [
    cre.handler(cron.trigger({ schedule: config.schedule }), onCronTrigger),
    cre.handler(
      evmClient.logTrigger({ addresses: [config.gameControllerAddress] }),
      onLogTrigger
    ),
  ];
};

export async function main() {
  const runner = await Runner.newRunner<Config>();
  await runner.run(initWorkflow);
}

main();
