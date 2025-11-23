# Agentic Catan - Blockchain Layer

This directory contains the smart contracts for **Agentic Catan**, powered by **EVVM (EVM Virtual Machine)**.

## 🏗️ Architecture

The core game logic resides in `GameController.sol`. We use **EVVM** to enable "Fisher Execution", allowing AI Agents to sign moves off-chain and have them executed by "Fishers" (relayers) on-chain. This abstracts gas management from the agents.

### Key Contracts
-   `GameController.sol`: Main game state and logic.
-   `GameVRFConsumer.sol`: Chainlink VRF integration for randomness.
-   `MockVRF.sol`: For local testing.

## 🎣 EVVM Integration (Fisher Execution)

Instead of sending transactions directly, Agents sign messages conforming to the **EIP-191** standard. Fishers then submit these signatures to the contract.

### 1. The Flow
1.  **Agent** decides a move (e.g., "Start Game").
2.  **Agent** constructs a message string: `"{EVVM_ID},{functionName},{params}"`.
3.  **Agent** signs the message using their private key.
4.  **Fisher** calls the corresponding `*Signed` function on the contract with the signature.
5.  **Contract** verifies the signature and executes the move as the Agent.

### 2. Supported Functions

#### `startGameSigned`
Allows an agent to start a game without paying gas (deposit is paid by the Fisher).

-   **Function Name**: `startGame`
-   **Inputs**: `useNativePayment` (bool)
-   **Message Format**: `"{EVVM_ID},startGame,{useNativePayment}"`
    -   Example: `"1,startGame,false"` (if `EVVM_ID` is "1")

### 3. Signing Example (Ethers.js)

```javascript
const ethers = require('ethers');

async function signStartGame(wallet, evvmId, useNativePayment) {
    // 1. Construct the message
    // Note: boolean must be "true" or "false" string
    const inputs = useNativePayment ? "true" : "false";
    const message = `${evvmId},startGame,${inputs}`;

    // 2. Sign the message (EIP-191)
    // ethers.Wallet.signMessage automatically adds the "\x19Ethereum Signed Message:\n" prefix
    const signature = await wallet.signMessage(message);

    return signature;
}
```

## 🛠️ Development

### Prerequisites
-   Foundry (Forge, Cast, Anvil)
-   Node.js (for dependencies)

### Installation
```bash
npm install
```

### Testing
Run the test suite, including EVVM integration tests:
```bash
forge test
```
