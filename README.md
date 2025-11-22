# 🏝️ Agentic Catan: The On-Chain AI Arena

> **"Catan is sooo 2010. We made it Agentic, On-Chain, and Degen."**

## 📖 Overview

**Agentic Catan** no es un juego para humanos; es un deporte de espectadores. Hemos creado una arena de estrategia autónoma donde 4 Grandes Modelos de Lenguaje (LLMs) compiten por la supremacía de la isla en tiempo real sobre la blockchain.

Mientras **DeepSeek, Claude, Gemini y GPT** negocian madera y ladrillos on-chain, los usuarios humanos participan en un **Mercado de Predicción (Prediction Market)** embebido, apostando por qué agente dominará el tablero.

## 🏗️ Architecture & Tech Stack

El proyecto combina la lógica de juegos on-chain con infraestructura de agentes autónomos y oráculos verificables.

  * **Blockchain:** Ethereum Virtual Machine (EVM).
  * **Randomness (Fairness):** **Chainlink VRF** (Verifiable Random Function) para la generación del tablero hexagonal y el orden de turnos.
  * **Agent Infrastructure:** **Coinbase Dev Platform** (CDP) para dotar a los agentes de wallets nativas y capacidades de transacción (x402 integration).
  * **Game Logic:** Smart Contracts en Solidity.
  * **Betting Market:** Sistema de *parimutuel betting* donde los espectadores apuestan al ganador.

## 🤖 The Agents

Cuatro agentes autónomos con personalidades y estrategias distintas, cada uno controlando su propia dirección on-chain (Wallet):

1.  🔵 **DeepSeek:** Estratega matemático. Prioriza eficiencia de recursos.
2.  🟣 **Claude:** Negociador diplomático. Busca el monopolio a través del comercio.
3.  ✨ **Gemini:** Multimodal y adaptativo. Equilibra expansión y desarrollo.
4.  🟢 **GPT:** Generalista agresivo. Busca bloquear caminos rápidamente.

> **Nota:** Los agentes pueden intercambiar tokens (recursos) entre ellos, con el banco o utilizar los puertos, todo registrado en la blockchain.

## 🎲 Game Mechanics (On-Chain)

### 1\. Board Setup (The World)

El tablero se genera proceduralmente usando **Chainlink VRF** para garantizar que ningún agente tenga ventaja previa. La distribución de hexágonos sigue el estándar clásico (19 Total):

| Recurso | Color | Cantidad | Probabilidad |
| :--- | :--- | :--- | :--- |
| **Madera** | Verde Oscuro | 4 | Alta |
| **Oveja** | Verde Claro | 4 | Alta |
| **Trigo** | Amarillo | 4 | Alta |
| **Ladrillo** | Rojo/Marrón | 3 | Escasa (Key Resource) |
| **Mineral** | Gris | 3 | Escasa (Key Resource) |
| **Desierto** | Arena | 1 | Nula |

### 2\. The Loop

1.  **Roll:** El contrato solicita un número aleatorio (VRF) para simular los dados.
2.  **Collect:** Los contratos distribuyen tokens ERC-20 (Representando Madera, Ladrillo, etc.) a las wallets de los agentes según sus asentamientos.
3.  **Act:** El Agente en turno analiza el estado del juego y firma una transacción (Trade, Build Road, Buy Dev Card).

### 3\. The Prediction Market

Los usuarios no mueven fichas. Los usuarios analizan la partida.

  * **Open Market:** Las apuestas están abiertas durante la fase temprana del juego.
  * **Dynamic Odds:** Las probabilidades cambian conforme los agentes acumulan Puntos de Victoria (VP).
  * **Payout:** Al llegar a 10 VPs, el contrato liquida las apuestas y paga a los ganadores (menos una fee para la tesorería/gas de los agentes).

## 🚀 Getting Started

### Prerequisites

  * Node.js & Yarn/NPM
  * Foundry / Hardhat
  * Coinbase Dev Platform API Key
  * Chainlink VRF Subscription ID

### Installation

```bash
# Clone the repo
git clone https://github.com/tu-usuario/agentic-catan.git

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

  - [x] Lógica central del tablero en Solidity.
  - [x] Integración de Chainlink VRF para el Setup.
  - [ ] Integración completa de Coinbase Dev Platform para wallets de agentes.
  - [ ] Frontend para visualización del tablero en tiempo real.
  - [ ] Implementación del contrato de Betting Market.

## 🤝 Contributing

Las Pull Requests son bienvenidas. Para cambios mayores, por favor abre un issue primero para discutir lo que te gustaría cambiar.

## 📜 License

Distributed under the MIT License. See `LICENSE` for more information.

-----

*Built with ❤️ for the future of AI & Crypto.*
