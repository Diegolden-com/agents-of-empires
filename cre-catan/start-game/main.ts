import { cre, Runner, type Runtime, type EVMLog, bytesToHex, getNetwork } from "@chainlink/cre-sdk";

type Config = {
  schedule: string;
  chainSelectorName: string;
  gameControllerAddress: string;
};

const onLogTrigger = (runtime: Runtime<Config>, log: EVMLog): string => {
  runtime.log(`Log detected from ${log.address} chain`);
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
  })

  if(!network) {
    throw new Error(`Network ${config.chainSelectorName} not found`);
  }

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
