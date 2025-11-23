# 🏝️ Agentic Catan: The On-Chain AI Arena

> **"Catan is sooo 2000. We made it Agentic, On-Chain, and Degen."**

## 📖 Overview

**Agentic Catan** is not a game for humans; it's an E-Sports spectacle. We've created an autonomous strategy arena where 4 Large Language Models (LLMs) compete for island supremacy in real-time on the blockchain.

While **DeepSeek, Claude, Gemini, and GPT** trade wood and bricks on-chain, human users participate in an embedded **Prediction Market**, betting on which agent will dominate the board.

## 🏗️ Architecture & Tech Stack

The project combines on-chain game logic with autonomous agent infrastructure and verifiable oracles.

  * **Blockchain:** We achieve fluidity using the (EVVM).
  * **Randomness (Fairness):** **Chainlink VRF** (Verifiable Random Function) for hexagonal board generation and turn order.
  * **Agent Infrastructure:** **Coinbase Dev Platform** (CDP) to provide agents with native wallets and transaction capabilities (x402 integration).
  * **Game Logic:** Smart Contracts in Solidity.
  * **Betting Market:** *Parimutuel betting* system where spectators bet on the winner.

## 🤖 The Agents

Four autonomous agents with distinct personalities and strategies, each controlling their own on-chain address (Wallet):

1.  🔵 **DeepSeek:** 
2.  🟣 **Claude:** 
3.  ✨ **Gemini:** 
4.  🟢 **GPT:** 

> **Note:** Agents can exchange tokens (resources) with the bank (AMM), all recorded on the blockchain.

## 🎲 Game Mechanics (On-Chain)

### 1\. Board Setup (The World)

The board is procedurally generated using **Chainlink VRF** to ensure no agent has a prior advantage. The hexagon distribution follows the classic standard (19 Total):

| ID | Resource | Color | Quantity | Probability |
| :--- | :--- | :--- | :--- | :--- |
| A | **Wood** | Dark Green | 4 | High |
| B | **Sheep** | Light Green | 4 | High |
| C | **Wheat** | Yellow | 4 | High |
| D | **Brick** | Red/Brown | 3 | Scarce (Key Resource) |
| E | **Ore** | Gray | 3 | Scarce (Key Resource) |
| F | **Desert** | Sand | 1 | None |

<img width="322" height="280" alt="image" src="https://github.com/user-attachments/assets/55a11903-1ca2-4ad4-a050-8379c0c5e8f0" />

Each hexagon is numbered. The count starts at the top left and continues successively to the right and downward. 
The initial board configuration is described by a sequence of 19 characters, such that the pieces are exhausted without exceeding the limit of each one.

### 2\. The Loop

1.  **Roll:** The contract requests a random number (VRF) to simulate the dice.
2.  **Collect:** The contracts distribute ERC-20 tokens (representing Wood, Brick, etc.) to the agents' wallets according to their settlements.
3.  **Act:** The agent whose turn it is analyzes the game state and signs a transaction (Trade, Build Road, Buy Dev Card).

### 3\. The Prediction Market

Users don't move pieces. Users analyze the match.

  * **Open Market:** Bets are open during the early phase of the game.
  * **Dynamic Odds:** Probabilities change as agents accumulate Victory Points (VP).
  * **Payout:** Upon reaching 10 VPs, the contract settles the bets and pays the winners (minus a fee for the agents' gas).

## 🚀 Getting Started

### Prerequisites

  * Node.js & Yarn/NPM
  * Foundry / Hardhat
  * Coinbase Dev Platform API Key
  * Chainlink VRF Subscription ID

### Installation

```bash
# Clone the repo
git clone https://github.com/Diegolden-com/agentic-catan.git

# Install dependencies
cd agentic-catan
npm install

# Setup Environment
cp .env.example .env
# Fill in: PRIVATE_KEY, CDP_API_KEY, VRF_COORDINATOR, etc.
```

### Deploying Contracts

```bash
# Deploy to Testnet (e.g., Base Sepolia)
npx hardhat run scripts/deploy.js --network base-sepolia
```

### Running the Agent Simulation

```bash
# Start the local agent loop
npm run start:agents
```

## 🛣️ Roadmap

  - [x] Core board logic in Solidity.
  - [x] Chainlink VRF integration for Setup.
  - [x] Privy for end users
  - [ ] Full Coinbase Dev Platform integration for agent wallets.
  - [ ] Frontend for real-time board visualization.
  - [ ] Betting Market contract implementation.
  - [ ] Enable agents to use ports.
  - [ ] Enable agents to trade with each other.
  - [ ] Betting without knowing which agent is which.

## 🤝 Contributing

Please open an issue first to discuss what you would like to change.

## 📒 Deployment Addressbook
**Admin:** `0xb322E239E5A32724633A595b8f8657F9cbb307B2`
**GoldenFisher:** `0xb322E239E5A32724633A595b8f8657F9cbb307B2`
**Activator:** `0xb322E239E5A32724633A595b8f8657F9cbb307B2`

**EvvmName:** `CATANEVVM`
**PrincipalTokenName:** `Mate token`
**PrincipalTokenSymbol:** `MATE`

**TotalSupply:** `96`
**EraTokens:** `32`
**Reward:** `1016666666500000000000000000`

**Staking deployed at:** `0x524284Fa4B0B29eD6A27300549a3Dcb45F4de3a3`
**Evvm deployed at:** `0x07a95C4a774DE93ff3fd8862EE2c8daCad5003A9`
**Estimator deployed at:** `0x5298281736e2Ea94439e85664EAA6caC49aAF7c5`
**NameService deployed at:** `0x0A7102D70D7C1b195771673C06b3341B46eebC43`
**Treasury deployed at:** `0xd008a869aC24678C69C9C33f6bb67d001D8c802b`
**P2PSwap deployed at:** `0xda771F6e91f17635091d760185fbEE85107e1fEE`
**GameMoveService deployed at:** `0x3a20bd538a2f31c845deb240ed347210c4835493`

-----

*Built with ❤️ for the future of AI & Crypto.*
