export const GAME_CONTROLLER_ABI = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "vrfAddress",
        "type": "address"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "gameId",
        "type": "uint256"
      }
    ],
    "name": "GameActivated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "gameId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint8",
        "name": "winner",
        "type": "uint8"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "duration",
        "type": "uint256"
      }
    ],
    "name": "GameEnded",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "gameId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "enum GameController.Company[4]",
        "name": "companies",
        "type": "uint8[4]"
      },
      {
        "indexed": false,
        "internalType": "uint8[4]",
        "name": "modelIndices",
        "type": "uint8[4]"
      },
      {
        "indexed": false,
        "internalType": "uint8[4]",
        "name": "playOrder",
        "type": "uint8[4]"
      }
    ],
    "name": "GameRandomAssigned",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "gameId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "bettor",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint8",
        "name": "bettorChoice",
        "type": "uint8"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "requestId",
        "type": "uint256"
      }
    ],
    "name": "GameStarted",
    "type": "event"
  },
  {
    "inputs": [
      {
        "internalType": "uint8",
        "name": "bettorChoice",
        "type": "uint8"
      },
      {
        "internalType": "bool",
        "name": "useNativePayment",
        "type": "bool"
      }
    ],
    "name": "startGame",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "gameId",
        "type": "uint256"
      }
    ],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "gameId",
        "type": "uint256"
      },
      {
        "internalType": "uint8",
        "name": "_winner",
        "type": "uint8"
      }
    ],
    "name": "endGame",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "gameId",
        "type": "uint256"
      }
    ],
    "name": "getGameStatus",
    "outputs": [
      {
        "internalType": "enum GameController.GameStatus",
        "name": "",
        "type": "uint8"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "gameId",
        "type": "uint256"
      }
    ],
    "name": "getGame",
    "outputs": [
      {
        "components": [
          {
            "internalType": "address",
            "name": "bettor",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "deposit",
            "type": "uint256"
          },
          {
            "internalType": "enum GameController.GameStatus",
            "name": "status",
            "type": "uint8"
          },
          {
            "internalType": "bool",
            "name": "randomReady",
            "type": "bool"
          },
          {
            "components": [
              {
                "internalType": "enum GameController.Company",
                "name": "company",
                "type": "uint8"
              },
              {
                "internalType": "uint8",
                "name": "modelIndex",
                "type": "uint8"
              },
              {
                "internalType": "uint8",
                "name": "playOrder",
                "type": "uint8"
              }
            ],
            "internalType": "struct GameController.AIPlayer[4]",
            "name": "aiPlayers",
            "type": "tuple[4]"
          },
          {
            "components": [
              {
                "internalType": "enum GameController.Resource",
                "name": "resource",
                "type": "uint8"
              }
            ],
            "internalType": "struct GameController.Hexagon[19]",
            "name": "board",
            "type": "tuple[19]"
          },
          {
            "internalType": "uint8",
            "name": "bettorChoice",
            "type": "uint8"
          },
          {
            "internalType": "uint256",
            "name": "requestId",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "startTime",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "endTime",
            "type": "uint256"
          },
          {
            "internalType": "uint8",
            "name": "winner",
            "type": "uint8"
          }
        ],
        "internalType": "struct GameController.Game",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "gameCounter",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "MIN_DEPOSIT",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

export const GAME_CONTROLLER_ADDRESS = "0xCE21A1Ee76726Bb487684330BB216E5f233A47fb";
