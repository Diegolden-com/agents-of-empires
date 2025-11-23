// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {StakingServiceHooks} from "@evvm/testnet-contracts/library/StakingServiceHooks.sol";
import {BoardUtils} from "./BoardUtils.sol";
import {IEvvm} from "@evvm/testnet-contracts/interfaces/IEvvm.sol";
import {SignatureRecover} from "@evvm/testnet-contracts/library/SignatureRecover.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

contract GameMoveService is StakingServiceHooks {
    struct Move {
        uint256 gameId;
        address agent;
        string moveType;
        // Data encoding:
        // BUILD_ROAD: abi.encode(uint8 edgeId)
        // BUILD_SETTLEMENT: abi.encode(uint8 vertexId)
        // BUILD_CITY: abi.encode(uint8 vertexId)
        // TRADE: abi.encode(int8[] resourceDeltas)
        // MOVE_ROBBER: abi.encode(uint8 hexId, address victim)
        bytes data;
        uint256 timestamp;
    }

    mapping(uint256 => Move[]) public gameMoves;

    event MoveRecorded(uint256 indexed gameId, address indexed agent, string moveType);

    constructor(address _stakingAddress) StakingServiceHooks(_stakingAddress) {}

    error InvalidSignature();
    error NonceAlreadyUsed();

    address constant ETHER_ADDRESS = address(0);
    address constant PRINCIPAL_TOKEN_ADDRESS = address(1);

    mapping(address => mapping(uint256 => bool)) public checkAsyncNonce;



    function recordMove(
        uint256 gameId,
        address agent,
        string memory moveType,
        bytes memory data,
        uint256 nonce,
        bytes memory signature,
        uint256 priorityFee_EVVM,
        uint256 nonce_EVVM,
        bool priorityFlag_EVVM,
        bytes memory signature_EVVM
    ) external {
        // 1. Verify Signature
        string memory dataHash = Strings.toHexString(uint256(keccak256(data)));
        string memory message = string.concat(
            Strings.toString(gameId),
            ",",
            moveType,
            ",",
            dataHash,
            ",",
            Strings.toString(nonce)
        );

        if (
            !SignatureRecover.signatureVerification(
                Strings.toString(IEvvm(evvmHookAddress).getEvvmID()),
                "recordMove",
                message,
                signature,
                agent
            )
        ) revert InvalidSignature();

        // 2. Check Nonce
        if (checkAsyncNonce[agent][nonce]) revert NonceAlreadyUsed();

        // 3. EVVM Payment (Agent pays Fisher/Service)
        // We calculate a "price" for the move? Or just priority fee?
        // The example had a totalPrice. Let's assume moves are free but pay gas/priority.
        // So amount is 0, but priorityFee is paid.
        IEvvm(evvmHookAddress).pay(
            agent,
            address(this),
            "", // metadata
            ETHER_ADDRESS,
            0, // amount
            priorityFee_EVVM,
            nonce_EVVM,
            priorityFlag_EVVM,
            address(this), // fisher (msg.sender is fisher)
            signature_EVVM
        );

        // 4. Fisher Rewards (if Service is Staker)
        if (IEvvm(evvmHookAddress).isAddressStaker(address(this))) {
            // Pay priority fee to fisher
            IEvvm(evvmHookAddress).caPay(
                msg.sender,
                ETHER_ADDRESS,
                priorityFee_EVVM
            );

            // Pay reward tokens to fisher (50% of reward)
            IEvvm(evvmHookAddress).caPay(
                msg.sender,
                PRINCIPAL_TOKEN_ADDRESS,
                IEvvm(evvmHookAddress).getRewardAmount() / 2
            );
        }

        // 5. Mark Nonce
        checkAsyncNonce[agent][nonce] = true;

        // 6. Validate Move Data
        if (keccak256(bytes(moveType)) == keccak256(bytes("BUILD_ROAD"))) {
            uint8 edgeId = abi.decode(data, (uint8));
            require(edgeId < BoardUtils.MAX_EDGES, "INVALID_EDGE_ID");
        } else if (keccak256(bytes(moveType)) == keccak256(bytes("BUILD_SETTLEMENT")) || 
                   keccak256(bytes(moveType)) == keccak256(bytes("BUILD_CITY"))) {
            uint8 vertexId = abi.decode(data, (uint8));
            require(vertexId < BoardUtils.MAX_VERTICES, "INVALID_VERTEX_ID");
        } else if (keccak256(bytes(moveType)) == keccak256(bytes("MOVE_ROBBER"))) {
            (uint8 hexId, ) = abi.decode(data, (uint8, address));
            require(hexId < BoardUtils.MAX_HEXAGONS, "INVALID_HEX_ID");
        }

        // 7. Record Move
        gameMoves[gameId].push(Move({
            gameId: gameId,
            agent: agent,
            moveType: moveType,
            data: data,
            timestamp: block.timestamp
        }));

        emit MoveRecorded(gameId, agent, moveType);
    }
    function getMoves(uint256 gameId) external view returns (Move[] memory) {
        return gameMoves[gameId];
    }

    function stake(uint256 amount) external {
        _makeStakeService(amount);
    }

    function unstake(uint256 amount) external {
        _makeUnstakeService(amount);
    }
}
