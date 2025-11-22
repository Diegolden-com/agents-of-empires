// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {VRFConsumerBaseV2Plus} from "@chainlink/contracts/src/v0.8/vrf/dev/VRFConsumerBaseV2Plus.sol";
import {VRFV2PlusClient} from "@chainlink/contracts/src/v0.8/vrf/dev/libraries/VRFV2PlusClient.sol";

interface IGameController {
    function receiveRandomWords(
        uint256 gameId,
        uint256 requestId,
        uint256[] calldata randomWords
    ) external;
}

contract GameVRFConsumer is VRFConsumerBaseV2Plus {
    address public gameController;

    uint256 public s_subscriptionId;

    // Base Sepolia coordinator + keyhash - hardcoded
    bytes32 public keyHash =
        0x9e1344a1247c8a1785d0a4681a27152bffdb43666ae5bf7d14d24a5efd44bf71;
    address public constant VRF_COORD = 0x5C210eF41CD1a72de73bF76eC39637bB0d3d7BEE;

    uint32 public callbackGasLimit = 300_000;
    uint16 public requestConfirmations = 0;
    uint32 public numWords = 4; 
    mapping(uint256 => uint256) public gameRequest;

    event RandomRequested(uint256 requestId, uint256 gameId);
    event RandomFulfilled(uint256 requestId, uint256 gameId);

    modifier onlyGameController() {
        require(msg.sender == gameController, "NOT_GAME_CONTROLLER");
        _;
    }

    constructor(uint256 _subId) VRFConsumerBaseV2Plus(VRF_COORD) {
        s_subscriptionId = _subId;
    }

    function setGameController(address _gc) external onlyOwner {
        require(_gc != address(0), "ZERO_ADDR");
        gameController = _gc;
    }

    // -----------------------------------------------------
    // REQUEST RANDOMNESS
    // -----------------------------------------------------
    function requestRandomWords(
        uint256 gameId,
        bool enableNativePayment
    ) external onlyGameController returns (uint256 requestId) {
        requestId = s_vrfCoordinator.requestRandomWords(
            VRFV2PlusClient.RandomWordsRequest({
                keyHash: keyHash,
                subId: s_subscriptionId,
                requestConfirmations: requestConfirmations,
                callbackGasLimit: callbackGasLimit,
                numWords: numWords,
                extraArgs: VRFV2PlusClient._argsToBytes(
                    VRFV2PlusClient.ExtraArgsV1({
                        nativePayment: enableNativePayment
                    })
                )
            })
        );

        gameRequest[requestId] = gameId;
        emit RandomRequested(requestId, gameId);
        return requestId;
    }

    // -----------------------------------------------------
    // FULFILL VRF CALLBACK
    // -----------------------------------------------------
    function fulfillRandomWords(
        uint256 requestId,
        uint256[] calldata randomWords
    ) internal override {
        uint256 gameId = gameRequest[requestId];
        require(gameId != 0, "INVALID_GAMEID");

        emit RandomFulfilled(requestId, gameId);

        IGameController(gameController).receiveRandomWords(
            gameId,
            requestId,
            randomWords
        );
    }

    // Admin setters
    function setCallbackGasLimit(uint32 v) external onlyOwner {
        callbackGasLimit = v;
    }
    function setRequestConfirmations(uint16 v) external onlyOwner {
        requestConfirmations = v;
    }
    function setNumWords(uint32 v) external onlyOwner {
        numWords = v;
    }
}
