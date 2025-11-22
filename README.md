# ⚔️ Agents of Empires

**Real-time strategy gaming meets blockchain: Provably fair battles with real rewards.**

Built with: **EVVM** • **Chainlink** • **Coinbase Developer Platform**

---

## 🎯 WHY — The Tech Stack Thesis

We are building Agents of Empires to prove a specific hypothesis: **Real-Time Strategy (RTS) games can finally run fully on-chain by combining three breakthrough technologies.**

While we are still iterating on the exact implementation details, our architectural foundation is built on three core pillars that solve the "Impossible Trinity" of blockchain gaming (Speed, Trust, and Usability):

### 1. Compute: EVVM
Traditional blockchains are too slow for RTS games (15s block times). We are using **EVVM** to provide a high-performance virtual chain environment that can handle the high frequency of actions required by an RTS, while maintaining settlement on Ethereum.

### 2. Trust: Chainlink
An RTS requires complex, verifiable logic (fog of war, combat rolls, critical hits) that cannot be trusted to a centralized server. We are leveraging **Chainlink** services (VRF and Automation) to ensure that every critical game mechanic is provably fair and every payout is executed trustlessly.

### 3. Usability: Coinbase Developer Platform (CDP)
The biggest barrier to entry is the wallet. We are utilizing **CDP** to provide invisible embedded wallets for players (email login) and programmable server wallets for AI agents, making the blockchain invisible to the end user.

**Agents of Empires is the playground where these three technologies converge.**

---

## ⚔️ THE EXPERIENCE

**Age of Empires meets DeFi. No wallets required.**

We stripped away the friction of blockchain gaming to reveal the fun.

### 🎮 Play Instantly
Login with email. No seed phrases. No gas. Just launch and play.
*(Powered by CDP Embedded Wallets)*

### 🤖 Battle Autonomous Agents
Practice against AI opponents that actually live on the blockchain. They sign transactions, they hold assets, and they play to win.
*(Powered by CDP Server Wallets)*

### 💰 Win USDC
Destroy the enemy Town Hall. Get paid automatically. The blockchain acts as the referee and the bank.
*(Powered by Chainlink Automation)*

---

## 🏗️ THE ENGINE

How do you put a high-frequency RTS on-chain without it sucking? **You cheat time.**

We use **Optimistic Execution** on the frontend for instant feedback, while a **Virtual Chain (EVVM)** settles the state asynchronously.

### System Architecture

```mermaid
graph TB
    subgraph Player["👤 PLAYER LAYER"]
        User[Player - Email/Wallet]
        AI[AI Bot - CDP Server Wallet]
    end

    subgraph Frontend["🎯 FRONTEND - Next.js + PixiJS"]
        UI[Game UI - RTS Canvas]
        CDP_Embedded[CDP Embedded Wallets]
        WalletConnect[RainbowKit/MetaMask]
        IntentSigner[EIP-191 Intent Signing]
    end

    subgraph Backend["🔧 BACKEND API - Node.js"]
        API[REST API]
        IntentQueue[(Intent Queue - PostgreSQL)]
        Batcher[Intent Batcher - 10s intervals]
        CDP_Server[CDP Server Wallets - AI Logic]
        FisherEndpoint[Public Fisher Endpoint]
    end

    subgraph EVVM["⚡ EVVM VIRTUAL CHAIN - Sepolia"]
        Fisher[Decentralized Fishers]
        GameFactory[GameFactory.sol]
        GameState[GameState.sol]
        ActionProcessor[ActionProcessor.sol]
        RandomOracle[RandomnessOracle.sol]
    end

    subgraph Chainlink["🔗 CHAINLINK SERVICES"]
        VRF[Chainlink VRF - Randomness]
        Automation[Chainlink Automation - Keepers]
    end

    subgraph Base["💰 BASE CHAIN - Base Sepolia"]
        Rewards[GameRewards.sol]
        USDC[USDC Prize Pool]
    end

    User -->|Email Login| CDP_Embedded
    User -->|Wallet Connect| WalletConnect
    CDP_Embedded --> UI
    WalletConnect --> UI

    UI -->|Player Actions| IntentSigner
    IntentSigner -->|Signed Intents| API

    AI -->|Bot Actions| CDP_Server
    CDP_Server -->|Signed Intents| API

    API --> IntentQueue
    IntentQueue --> Batcher
    Batcher --> FisherEndpoint

    FisherEndpoint -->|Batched Txs| Fisher
    Fisher -->|Submit| ActionProcessor

    ActionProcessor --> GameState
    ActionProcessor -->|Request Random| RandomOracle
    RandomOracle <-->|VRF Request/Response| VRF

    GameFactory -->|Create Game| GameState
    GameState -->|Victory Event| Automation

    Automation -->|Trigger Payout| Rewards
    Rewards -->|Transfer| USDC
    USDC -->|Winner Payment| CDP_Embedded

    style EVVM fill:#e1f5ff
    style Chainlink fill:#375bd2,color:#fff
    style Base fill:#0052ff,color:#fff
    style Frontend fill:#f0f0f0
    style Backend fill:#f9f9f9
```

### Complete User Flow - From Login to Reward

```mermaid
sequenceDiagram
    actor Player
    participant Frontend as 🎯 Frontend<br/>(PixiJS)
    participant CDP as 💰 CDP<br/>Embedded Wallets
    participant API as 🔧 Backend API
    participant Batcher as ⚡ Intent Batcher
    participant Fisher as 🎣 EVVM Fisher
    participant EVVM as ⚡ EVVM Chain<br/>ActionProcessor
    participant VRF as 🔗 Chainlink VRF
    participant GameState as ⚡ GameState.sol
    participant Automation as 🔗 Chainlink<br/>Automation
    participant Rewards as 💰 GameRewards.sol

    Note over Player,Rewards: 1️⃣ ONBOARDING
    Player->>Frontend: Visit game & click "Play with Email"
    Frontend->>CDP: Create embedded wallet
    CDP-->>Frontend: Wallet created (invisible to player)
    Frontend-->>Player: Ready to play!

    Note over Player,Rewards: 2️⃣ GAMEPLAY - Attack Action
    Player->>Frontend: Click "Attack Enemy Unit"
    Frontend->>Frontend: Create attack intent
    Frontend->>CDP: Sign intent (EIP-191)
    CDP-->>Frontend: Signature
    Frontend->>API: POST /api/actions {intent, signature}
    API->>API: Validate signature
    API->>API: Store in PostgreSQL
    API-->>Player: Optimistic UI update (instant feedback)

    Note over Player,Rewards: 3️⃣ BATCHING (Every 10 seconds)
    loop Every 10 seconds
        Batcher->>API: Fetch pending intents
        Batcher->>Batcher: Create batch transaction
        Batcher->>API: Expose via /api/fishers/pending
    end

    Note over Player,Rewards: 4️⃣ DECENTRALIZED EXECUTION
    Fisher->>API: GET /api/fishers/pending
    API-->>Fisher: Batched transactions
    Fisher->>EVVM: Submit batch to virtual chain

    Note over Player,Rewards: 5️⃣ ON-CHAIN PROCESSING
    EVVM->>EVVM: Validate signatures
    EVVM->>EVVM: Check game rules
    EVVM->>VRF: Request critical hit random (20% chance)
    VRF-->>EVVM: Verifiable random number
    EVVM->>EVVM: Calculate damage (base ± variance + crit)
    EVVM->>GameState: Update unit health
    GameState-->>EVVM: State updated

    Note over Player,Rewards: 6️⃣ VICTORY DETECTION
    alt Town Hall Destroyed
        GameState->>GameState: Emit VictoryDetected event
        Automation->>GameState: checkUpkeep() - scan for victories
        GameState-->>Automation: Victory found: Player won!
        Automation->>Rewards: performUpkeep() - trigger payout
    end

    Note over Player,Rewards: 7️⃣ AUTOMATIC REWARD
    Rewards->>Rewards: Verify game proof from EVVM
    Rewards->>CDP: Transfer 10 USDC to winner
    CDP-->>Player: 🎉 You won 10 USDC!

    Note over Player,Rewards: ✅ COMPLETE - 60 seconds from victory to payout
```

### Technology Integration Map

```mermaid
graph LR
    subgraph Problems["❌ PROBLEMS"]
        P1[Slow Blockchain<br/>15s blocks]
        P2[Expensive Gas<br/>$50/game]
        P3[Unfair Randomness<br/>Can be manipulated]
        P4[Manual Claiming<br/>Poor UX]
        P5[Wallet Barrier<br/>No mainstream adoption]
        P6[Centralized AI<br/>Not on-chain]
    end

    subgraph Solutions["✅ SOLUTIONS"]
        S1[EVVM<br/>Virtual Chain]
        S2[EVVM<br/>Fisher Batching]
        S3[Chainlink<br/>VRF]
        S4[Chainlink<br/>Automation]
        S5[CDP<br/>Embedded Wallets]
        S6[CDP<br/>Server Wallets]
    end

    subgraph Results["🎯 RESULTS"]
        R1[Real-time gameplay<br/>Optimistic execution]
        R2[~$2/game<br/>97% cost reduction]
        R3[Provably fair<br/>Cryptographic proof]
        R4[Instant payouts<br/>60s automated]
        R5[Email login<br/>Zero crypto knowledge]
        R6[AI on-chain<br/>Autonomous agents]
    end

    P1 --> S1 --> R1
    P2 --> S2 --> R2
    P3 --> S3 --> R3
    P4 --> S4 --> R4
    P5 --> S5 --> R5
    P6 --> S6 --> R6

    style Problems fill:#ffe0e0
    style Solutions fill:#e0f0ff
    style Results fill:#e0ffe0
```

---

### Three Technologies Working in Harmony

```
┌─────────────────────────────────────────────────────────────────┐
│                   👤 PLAYER EXPERIENCE                          │
│                                                                  │
│  Email Login (CDP)  →  Play Game  →  Win USDC (Chainlink)      │
│     or Wallet             ↓                                      │
│                    AI Practice (CDP)                             │
└─────────────────────────────────────────────────────────────────┘
                               ↓
┌─────────────────────────────────────────────────────────────────┐
│              🎯 FRONTEND (Next.js 14 + PixiJS)                  │
│                                                                  │
│  • Coinbase CDP Embedded Wallets (email/social login)     💰   │
│  • Traditional wallet support (MetaMask via RainbowKit)         │
│  • Real-time RTS rendering (PixiJS Canvas2D)                    │
│  • Intent signing (EIP-191)                                     │
└──────────────────────────────┬──────────────────────────────────┘
                               │ Signed Game Intents
                               ↓
┌─────────────────────────────────────────────────────────────────┐
│         🔧 BACKEND API (Node.js + PostgreSQL)                   │
│                                                                  │
│  • CDP Server Wallets → AI opponent bots             💰        │
│  • Intent batching (every ~10 seconds)                          │
│  • Public Fisher endpoint (EVVM integration)          ⚡        │
│  • Game state reconciliation                                    │
└──────────────────────────────┬──────────────────────────────────┘
                               │ Batched Transactions
                               ↓
┌─────────────────────────────────────────────────────────────────┐
│            🎣 EVVM FISHERS (Decentralized)           ⚡         │
│                                                                  │
│  • Process pending batches from public API                      │
│  • Submit to EVVM virtual chain                                 │
│  • Earn MATE token rewards                                      │
└──────────────────────────────┬──────────────────────────────────┘
                               │ Execute on Virtual Chain
                               ↓
┌─────────────────────────────────────────────────────────────────┐
│        ⚡ EVVM VIRTUAL CHAIN (Ethereum L1 - Sepolia)            │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  GameFactory.sol      - Create & manage games          │    │
│  │  GameState.sol        - Maintain verifiable game state │    │
│  │  ActionProcessor.sol  - Process batched player actions │    │
│  │  RandomnessOracle.sol - Chainlink VRF integration 🔗  │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
│  • Async nonces (players act independently)                     │
│  • Optimistic execution (smooth gameplay)                       │
│  • Verifiable state transitions                                 │
└──────────────────────────────┬──────────────────────────────────┘
                               │ Game Events (Victory/Timeout)
                               ↓
┌─────────────────────────────────────────────────────────────────┐
│       🔗 CHAINLINK AUTOMATION (Keeper Network)                  │
│                                                                  │
│  • Monitor game states (checkUpkeep)                            │
│  • Detect victories (Town Hall destroyed)                       │
│  • Handle timeouts (30 min max game duration)                   │
│  • Trigger reward distribution (performUpkeep)                  │
└──────────────────────────────┬──────────────────────────────────┘
                               │ Trigger Prize Claim
                               ↓
┌─────────────────────────────────────────────────────────────────┐
│          💰 BASE CHAIN (Sepolia / Base Sepolia)                 │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  GameRewards.sol                                        │    │
│  │  • Holds USDC prize pools                              │    │
│  │  • Receives proofs from EVVM                           │    │
│  │  • Automatic winner payouts (Chainlink triggered) 🔗  │    │
│  └────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘

Legend:
  💰 = Coinbase CDP Integration
  🔗 = Chainlink Integration
  ⚡ = EVVM Integration
```

---

## 🔌 UNDER THE HOOD

### ⚡ The Speed Layer: EVVM
**Problem:** Blockchains tick every 12 seconds. RTS games tick every 16 milliseconds.
**Solution:** A virtual chain that batches actions and settles them optimistically. It's the difference between turn-based chess and real-time war.

### 🔗 The Truth Layer: Chainlink
**Problem:** Who decides if that arrow hit? Who decides if you won?
**Solution:**
- **VRF:** Cryptographically verifiable critical hits.
- **Automation:** A decentralized referee that watches the game state and pays the winner instantly.

### 💰 The Access Layer: CDP
**Problem:** "Download MetaMask" is where 99% of players quit.
**Solution:** Invisible wallets. We spin up a secure MPC wallet for every user in the background. They own the keys, but they never have to see them.

---

## 🎯 HOW — Complete User Flow

### Scenario: New Player Joins and Plays

**1. ONBOARDING (CDP)**
```
Player visits agents-of-empires.com
→ Clicks "Play with Email" 📧
→ CDP Embedded Wallet created automatically
→ No MetaMask, no seed phrases needed!
```

**2. GAME MODE SELECTION**
```
Player chooses:
Option A: "Practice vs AI" 🤖 (CDP Server Wallet bot)
Option B: "PvP Match" ⚔️ (matchmaking with real player)
```

**3. GAMEPLAY (EVVM)**
```
Player performs actions:
- Click "Build Villager" → Intent signed (EIP-191) → Sent to API
- Click "Attack Enemy Unit" → Intent signed → Batched with other actions

Every 10 seconds:
→ API creates batch of pending intents
→ EVVM Fisher picks up batch
→ Fisher submits to EVVM virtual chain
→ ActionProcessor.sol validates and executes
```

**4. RANDOMNESS (Chainlink VRF)**
```
When soldier attacks:
→ ActionProcessor requests VRF randomness
→ Chainlink oracle returns verifiable random number
→ 20% chance: Critical hit! (2x damage)
→ Unit health updated on-chain
```

**5. VICTORY (Chainlink Automation)**
```
Player destroys enemy Town Hall:
→ GameState.sol emits VictoryDetected event
→ Chainlink Keeper detects event in checkUpkeep()
→ Keeper calls performUpkeep()
→ GameRewards.sol transfers 10 USDC to winner
```

**6. REWARD CLAIM (CDP + Base Chain)**
```
Winner's CDP Embedded Wallet receives USDC
→ Notification: "You won 10 USDC! 🎉"
→ Funds available instantly
→ Player can withdraw to bank or reinvest in next game
```

---

## 🧩 HOW — Why These Technologies Work Together

| Challenge                   | Solution                   | Technology           |
|-----------------------------|----------------------------|----------------------|
| Real-time blockchain gaming | Virtual chain execution    | EVVM virtual chain   |
| Batch multiple actions      | Fisher-based processing    | EVVM batching        |
| Fair randomness             | Verifiable random function | Chainlink VRF        |
| Automatic payouts           | Decentralized automation   | Chainlink Keepers    |
| User onboarding             | Email/social login         | CDP Embedded Wallets |
| AI opponents                | Autonomous bot wallets     | CDP Server Wallets   |
| Entry fees & stakes         | Crypto micropayments       | CDP x402 (future)    |

### The Harmony

1. **EVVM handles game logic** — Fast, efficient, verifiable state management
2. **Chainlink adds trust** — VRF for randomness, Automation for payouts
3. **CDP enables adoption** — Embedded Wallets remove crypto friction, Server Wallets power AI

**Each technology solves a specific problem that the others can't address alone.**

---

## 📋 HOW — Technical Implementation

### Smart Contract Architecture

```
contracts/
├── src/
│   ├── core/              # EVVM Virtual Chain Contracts
│   │   ├── GameFactory.sol
│   │   ├── GameState.sol
│   │   └── ActionProcessor.sol
│   ├── oracle/            # Chainlink Integrations
│   │   ├── RandomnessOracle.sol     # VRF
│   │   └── GameAutomation.sol       # Automation
│   └── rewards/           # Base Chain Contracts
│       └── GameRewards.sol          # USDC distribution
```

### Game Intent Format (EIP-191)

Every player action is a signed message:

```typescript
interface GameIntent {
  gameId: string;       // UUID of the match
  player: string;       // Wallet address (0x...)
  action: ActionType;   // ATTACK | BUILD | COLLECT
  params: {
    unitId?: number;
    targetId?: number;
    resourceType?: 'wood' | 'gold' | 'food';
  };
  nonce: number;        // Player's async nonce
  timestamp: number;    // Unix timestamp
  signature: string;    // EIP-191 signature
}
```

**Flow:**
1. **Frontend:** Player clicks "Attack" → Intent created
2. **CDP/Wagmi:** Intent signed with player's wallet
3. **API:** Intent stored in PostgreSQL
4. **Batching:** Every 10 sec, intents grouped into batch
5. **Fisher:** Picks up batch from public endpoint
6. **EVVM:** ActionProcessor validates signature and executes
7. **Chainlink:** VRF called for critical hit check
8. **Result:** On-chain state updated, event emitted

### Backend Architecture

```
backend/
├── src/
│   ├── services/
│   │   ├── cdp-wallet.service.ts     # CDP integration
│   │   ├── ai-opponent.service.ts    # CDP Server Wallets
│   │   ├── batching.service.ts       # EVVM fisher support
│   │   ├── signature.service.ts      # EIP-191 validation
│   │   └── x402-payments.service.ts  # Entry fees (future)
│   ├── controllers/
│   │   ├── games.controller.ts
│   │   ├── actions.controller.ts
│   │   └── fishers.controller.ts     # Public endpoint
│   └── models/
│       ├── Game.ts
│       ├── GameIntent.ts
│       └── Batch.ts
```

### Frontend Integration

```typescript
// CDP Embedded Wallet (email login)
import { CoinbaseWalletSDK } from '@coinbase/wallet-sdk';

await sdk.createWallet({
  type: 'embedded',
  email: 'player@example.com'
});

// Sign game action
const intent = { gameId, player, action: 'ATTACK', ... };
const signature = await wallet.signMessage(JSON.stringify(intent));

// Send to API
await fetch('/api/actions', {
  method: 'POST',
  body: JSON.stringify({ ...intent, signature })
});
```

---

## 🎮 HOW — Game Mechanics

### Units

**Villagers** — Collect resources (wood/gold/food)
- Cost: 50 food
- Health: 25 HP

**Soldiers** — Attack enemies
- Cost: 60 food + 20 gold
- Health: 100 HP
- Damage: 10-20 (with variance and crit chance)

### Buildings

**Town Hall** — Main base (destroy to win)
- Health: 500 HP

### Resources

- **Wood** — Building construction
- **Gold** — Training soldiers
- **Food** — Creating all units

### Combat

- **Base Damage:** 10-20 depending on unit type
- **Damage Variance (Chainlink VRF):** ±10% random modifier
- **Critical Hit (Chainlink VRF):** 20% chance for 2x damage
- **Range:** Units must be within range to attack

### Victory Conditions

- ✅ Destroy enemy Town Hall
- ⏰ Timeout (30 min) → Winner by remaining Town Hall health

---

## 🚀 HOW — Getting Started

### Prerequisites

- Node.js ≥ 18.0
- Foundry (for smart contracts)
- PostgreSQL ≥ 14
- Accounts:
  - Coinbase CDP API key
  - Chainlink VRF subscription
  - Chainlink Automation registration

### Installation

```bash
# Clone repository
git clone https://github.com/your-org/agents-of-empires.git
cd agents-of-empires

# Install dependencies
yarn install

# Setup contracts
curl -L https://foundry.paradigm.xyz | bash
foundryup
cd contracts && forge install

# Setup backend
cd backend
npm install
npx prisma generate

# Configure environment
cp .env.example .env
# Edit .env with your API keys

# Start development
npm run dev          # Frontend (http://localhost:3000)
cd backend && npm run dev  # API (http://localhost:3001)
```

### Environment Variables

```bash
# Chainlink
CHAINLINK_VRF_COORDINATOR=0x... # Sepolia VRF Coordinator
CHAINLINK_SUBSCRIPTION_ID=123
CHAINLINK_KEY_HASH=0x...
CHAINLINK_AUTOMATION_REGISTRY=0x...

# Coinbase CDP
CDP_API_KEY_NAME=your-api-key
CDP_PRIVATE_KEY=your-private-key
CDP_PROJECT_ID=your-project-id

# EVVM
EVVM_RPC_URL=https://evvm-rpc.example.com
EVVM_CHAIN_ID=11155111
EVVM_STAKING_CONTRACT=0x8eB2525239781e06dBDbd95d83c957C431CF2321

# Contracts
GAME_FACTORY_ADDRESS=0x...
ACTION_PROCESSOR_ADDRESS=0x...
GAME_REWARDS_ADDRESS=0x...

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/agents_of_empires
```

---

## 📚 Resources

### Documentation

- EVVM: https://www.evvm.info/llms-full.txt
- Chainlink VRF: https://docs.chain.link/vrf
- Chainlink CRE: https://docs.chain.link/cre
- Foundry: https://book.getfoundry.sh/

### Smart Contracts (Deployed)

- **GameFactory (EVVM):** 0x... (Sepolia)
- **RandomnessOracle (EVVM):** 0x... (Sepolia)
- **GameAutomation (Chainlink):** 0x... (Sepolia)
- **GameRewards (Base):** 0x... (Base Sepolia)

### Live Demo

- **Game:** https://agents-of-empires.vercel.app
- **API:** https://api.agents-of-empires.com
- **Fisher Endpoint:** https://api.agents-of-empires.com/api/fishers/pending-transactions

----

**Built with ❤️ at ETHGlobal Buenos Aires 2025**

