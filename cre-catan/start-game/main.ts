import { cre, Runner, type Runtime, type EVMLog, bytesToHex, getNetwork } from "@chainlink/cre-sdk";
import { decodeEventLog, parseAbi } from "viem";

type Config = {
  schedule: string;
  chainSelectorName: string;
  gameControllerAddress: string;
};

// Define all events from GameController.sol
const eventAbi = parseAbi([
  "event GameActivated(uint256 indexed gameId)"
]);

const onLogTrigger = (runtime: Runtime<Config>, log: EVMLog): string => {
  runtime.log(`Log detected from ${log.address}`);

  try {
    const topics = log.topics.map((topic) => bytesToHex(topic)) as [`0x${string}`, ...`0x${string}`[]];
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

const initWorkflow = (config: Config,) => {
  const cron = new cre.capabilities.CronCapability();
  const network = getNetwork({
    chainFamily: "evm",
    chainSelectorName: config.chainSelectorName,
    isTestnet: true,
  })

  if(!network) {
    throw new Error(`Network ${config.chainSelectorName} not found`);
  }

  console.log(`Network found: ${network.chainSelector.name}`);

  const evmClient = new cre.capabilities.EVMClient(network.chainSelector.selector);

  return [
    cre.handler(
      cron.trigger(
        { schedule: config.schedule }
      ), 
      onCronTrigger
    ),
    cre.handler(
      evmClient.logTrigger(
        { addresses: [config.gameControllerAddress] }
      ),
      onLogTrigger
    ),
  ];
};

export async function main() {
  const runner = await Runner.newRunner<Config>();
  await runner.run(initWorkflow);
}

main();
