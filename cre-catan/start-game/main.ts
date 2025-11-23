import {
  cre,
  Runner,
  type Runtime,
  type EVMLog,
  bytesToHex,
  getNetwork,
} from "@chainlink/cre-sdk";
import { decodeEventLog, parseAbi } from "viem";
import { readGameFromBlockchain } from "./helpers/gameData";

type Config = {
  schedule: string;
  chainSelectorName: string;
  gameControllerAddress: string;
};

// Define all events from GameController.sol
const eventAbi = parseAbi(["event GameActivated(uint256 indexed gameId)"]);

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

      const gamePayload = await readGameFromBlockchain(runtime, gameId);

      // TODO: Send gamePayload to NextJS API
      // Example implementation:
      // try {
      //   const response = await fetch('https://your-nextjs-app.com/api/game/start', {
      //     method: 'POST',
      //     headers: { 'Content-Type': 'application/json' },
      //     body: JSON.stringify(gamePayload)
      //   });
      //
      //   if (!response.ok) {
      //     runtime.log(`API Error: ${response.status} ${response.statusText}`);
      //   } else {
      //     const result = await response.json();
      //     runtime.log(`API Response: ${JSON.stringify(result)}`);
      //   }
      // } catch (error) {
      //   runtime.log(`Error calling API: ${error}`);
      // }

      runtime.log(`✓ Game ${gamePayload.gameId} data ready for API`);
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
