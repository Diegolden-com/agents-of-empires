import {
  cre,
  Runner,
  type Runtime,
  bytesToHex,
  getNetwork,
  hexToBase64,
  TxStatus,
  consensusIdenticalAggregation,
  type HTTPSendRequester,
  ok,
} from "@chainlink/cre-sdk";
import { encodeAbiParameters, parseAbiParameters } from "viem";
import { z } from "zod";

// Config schema
const configSchema = z.object({
  schedule: z.string(),
  chainSelectorName: z.string(),
  consumerAddress: z.string(),
  gasLimit: z.string(),
  gameId: z.string(),
  winner: z.number(),
});

type Config = z.infer<typeof configSchema>;

type PostResponse = {
  statusCode: number;
};

const endGameOnchain = (runtime: Runtime<Config>): string => {
  runtime.log("=".repeat(50));
  runtime.log("End Game Workflow");
  runtime.log("=".repeat(50));

  // Get network info
  const network = getNetwork({
    chainFamily: "evm",
    chainSelectorName: runtime.config.chainSelectorName,
    isTestnet: true,
  });

  if (!network) {
    throw new Error(`Network not found: ${runtime.config.chainSelectorName}`);
  }

  // Create EVM client
  const evmClient = new cre.capabilities.EVMClient(
    network.chainSelector.selector
  );

  // 1. Encode report data (gameId, winner)
  const reportData = encodeAbiParameters(
    parseAbiParameters("uint256 gameId, uint8 winner"),
    [BigInt(runtime.config.gameId), runtime.config.winner]
  );

  runtime.log(
    `Encoded data for Game ${runtime.config.gameId}, Winner: ${runtime.config.winner}`
  );

  // 2. Generate signed report
  const reportResponse = runtime
    .report({
      encodedPayload: hexToBase64(reportData),
      encoderName: "evm",
      signingAlgo: "ecdsa",
      hashingAlgo: "keccak256",
    })
    .result();

  runtime.log(`Generated signed report`);

  // 3. Submit to blockchain via EndGameConsumer
  const writeResult = evmClient
    .writeReport(runtime, {
      receiver: runtime.config.consumerAddress,
      report: reportResponse,
      gasConfig: {
        gasLimit: runtime.config.gasLimit,
      },
    })
    .result();

  // 4. Check status and return
  if (writeResult.txStatus === TxStatus.SUCCESS) {
    const txHash = bytesToHex(writeResult.txHash || new Uint8Array(32));
    runtime.log(`Transaction successful: ${txHash}`);
    runtime.log(
      `Game ${runtime.config.gameId} ended. Winner: Player ${runtime.config.winner}`
    );
    runtime.log("=".repeat(50));
    return txHash;
  }

  throw new Error(`Transaction failed with status: ${writeResult.txStatus}`);
};

const callFisher = async (
  runtime: Runtime<Config>,
  gameId: number,
  apiUrl: string,
  gamePayload: any
) => {
  const httpClient = new cre.capabilities.HTTPClient();
  const result = httpClient
    .sendRequest(
      runtime,
      httpRequest(gamePayload, apiUrl),
      consensusIdenticalAggregation<PostResponse>()
    )(runtime.config)
    .result();

  runtime.log(
    `✓ Game ${gamePayload.gameId} data sent to API with status: ${result.statusCode}`
  );
  return `Game ${gameId.toString()} ended successfully`;
};

export const httpRequest = (gamePayload: any, apiUrl: string) => {
  return (sendRequester: HTTPSendRequester, config: Config) => {
    const bodyBytes = new TextEncoder().encode(JSON.stringify(gamePayload));
    const body = Buffer.from(bodyBytes).toString("base64");

    const req = {
      url: apiUrl,
      method: "POST" as const,
      body: body,
      headers: {
        "Content-Type": "application/json",
      },
      cacheSettings: {
        readFromCache: true,
        maxAgeMs: 60000,
      },
    };

    const response = sendRequester.sendRequest(req).result();

    if (!ok(response)) {
      throw new Error(`Failed to send request: ${response.statusCode}`);
    }

    return { statusCode: response.statusCode };
  };
};

const initWorkflow = (config: Config) => {
  return [
    cre.handler(
      new cre.capabilities.CronCapability().trigger({
        schedule: config.schedule,
      }),
      endGameOnchain
    ),
  ];
};

export async function main() {
  const runner = await Runner.newRunner<Config>();
  await runner.run(initWorkflow);
}

main();
