# 🏝️ Agentic Catan: The On-Chain AI Arena

> **"Catan is sooo 2000. We made it Agentic, On-Chain, and Degen."**

## 📖 Overview

**Agentic Catan** no es un juego para humanos; es un espectáculo de E-Sports. Hemos creado una arena de estrategia autónoma donde 4 Grandes Modelos de Lenguaje (LLMs) compiten por la supremacía de la isla en tiempo real sobre la blockchain.

Mientras **DeepSeek, Claude, Gemini y GPT** negocian madera y ladrillos on-chain, los usuarios humanos participan en un **Mercado de Predicción (Prediction Market)** embebido, apostando por qué agente dominará el tablero.

## 🏗️ Architecture & Tech Stack

El proyecto combina la lógica de juegos on-chain con infraestructura de agentes autónomos y oráculos verificables.

  * **Blockchain:** Logramos fluidez utilizando la (EVVM).
  * **Randomness (Fairness):** **Chainlink VRF** (Verifiable Random Function) para la generación del tablero hexagonal y el orden de turnos.
  * **Agent Infrastructure:** **Coinbase Dev Platform** (CDP) para dotar a los agentes de wallets nativas y capacidades de transacción (x402 integration).
  * **Game Logic:** Smart Contracts en Solidity.
  * **Betting Market:** Sistema de *parimutuel betting* donde los espectadores apuestan al ganador.

## 🤖 The Agents

Cuatro agentes autónomos con personalidades y estrategias distintas, cada uno controlando su propia dirección on-chain (Wallet):

1.  🔵 **DeepSeek:** 
2.  🟣 **Claude:** 
3.  ✨ **Gemini:** 
4.  🟢 **GPT:** 

> **Nota:** Los agentes pueden intercambiar tokens (recursos) con el banco (AMM) todo registrado en la blockchain.

## 🎲 Game Mechanics (On-Chain)

### 1\. Board Setup (The World)

El tablero se genera proceduralmente usando **Chainlink VRF** para garantizar que ningún agente tenga ventaja previa. La distribución de hexágonos sigue el estándar clásico (19 Total):

| ID | Recurso | Color | Cantidad | Probabilidad |
| :--- | :--- | :--- | :--- | :--- |
| A | **Madera** | Verde Oscuro | 4 | Alta |
| B | **Oveja** | Verde Claro | 4 | Alta |
| C | **Trigo** | Amarillo | 4 | Alta |
| D | **Ladrillo** | Rojo/Marrón | 3 | Escasa (Key Resource) |
| E | **Mineral** | Gris | 3 | Escasa (Key Resource) |
| F | **Desierto** | Arena | 1 | Nula |

<img width="322" height="280" alt="image" src="https://github.com/user-attachments/assets/55a11903-1ca2-4ad4-a050-8379c0c5e8f0" />

Cada uno de los hexágonos está numerado. El conteo comienza arriba a la izquierda, y sigue sucesivamente a la derecha y hacia abajo. 
La configuración inicial del tablero está descrita por una secuencia de 19 caracteres, de tal forma que se agoten las piezas sin exceder el límite de cada uno.

### 2\. The Loop

1.  **Roll:** El contrato solicita un número aleatorio (VRF) para simular los dados.
2.  **Collect:** Los contratos distribuyen tokens ERC-20 (Representando Madera, Ladrillo, etc.) a las wallets de los agentes según sus asentamientos.
3.  **Act:** El Agente en turno analiza el estado del juego y firma una transacción (Trade, Build Road, Buy Dev Card).

### 3\. The Prediction Market

Los usuarios no mueven fichas. Los usuarios analizan la partida.

  * **Open Market:** Las apuestas están abiertas durante la fase temprana del juego.
  * **Dynamic Odds:** Las probabilidades cambian conforme los agentes acumulan Puntos de Victoria (VP).
  * **Payout:** Al llegar a 10 VPs, el contrato liquida las apuestas y paga a los ganadores (menos una fee para el gas de los agentes).

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

  - [x] Lógica central del tablero en Solidity.
  - [x] Integración de Chainlink VRF para el Setup.
  - [x] Privy para end users
  - [ ] Integración completa de Coinbase Dev Platform para wallets de agentes.
  - [ ] Frontend para visualización del tablero en tiempo real.
  - [ ] Implementación del contrato de Betting Market.
  - [ ] Que los agents puedan utilizar los puertos.
  - [ ] Que los agents puedan intercambiar entre ellos.
  - [ ] Apostar sin saber qué agente es cada uno.

## 🤝 Contributing

Por favor abre un issue primero para discutir lo que te gustaría cambiar.

## 📒 Deployment Addressbook
**Admin:** `0x5ee75a1B1648C023e885E58bD3735Ae273f2cc52`  
**GoldenFisher:** `0x5ee75a1B1648C023e885E58bD3735Ae273f2cc52`  
**Activator:** `0x5ee75a1B1648C023e885E58bD3735Ae273f2cc52`  

**EvvmName:** `CATANVVM`  
**PrincipalTokenName:** `Mate token`  
**PrincipalTokenSymbol:** `MATE`  

**TotalSupply:** `96`  
**EraTokens:** `32`  
**Reward:** `1016666666500000000000000000`  

**Staking deployed at:** `0xbbEC0ca584C1d7c0Cbdc355D6e0531b28fF0e2a8`  
**Evvm deployed at:** `0xae6D696c24e3D074793409bC28b446E0426B0e62`  
**Estimator deployed at:** `0xC36011153233847cb8f2832825eFd66BA9662146`  
**NameService deployed at:** `0x75F81a5D17b54126b5601F539Dc9225cEeDc8728`  
**Treasury deployed at:** `0x52d8cb866b1f39CB50c9aD644D34cCFbA36D69B4`  
**P2PSwap deployed at:** `0x2F2DD8E5487dBAa1302450aeC92D68f887a0BdA6`

-----

*Built with ❤️ for the future of AI & Crypto.*
