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



    struct MoveData {
        uint256 gameId;
        address agent;
        string moveType;
        bytes data;
        uint256 nonce;
        bytes signature;
        uint256 priorityFee_EVVM;
        uint256 nonce_EVVM;
        bool priorityFlag_EVVM;
        bytes signature_EVVM;
    }

    function moveMultiple(MoveData[] calldata moves) external returns (uint256 successful, uint256 failed, bool[] memory results) {
        results = new bool[](moves.length);
        for (uint256 i = 0; i < moves.length; i++) {
            try this.recordMoveInternal(moves[i], msg.sender) {
                successful++;
                results[i] = true;
            } catch {
                failed++;
                results[i] = false;
            }
        }
    }

    function recordMoveInternal(MoveData calldata move, address fisher) external {
        require(msg.sender == address(this), "Only self");
        _recordMove(move, fisher);
    }

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
        MoveData memory move = MoveData({
            gameId: gameId,
            agent: agent,
            moveType: moveType,
            data: data,
            nonce: nonce,
            signature: signature,
            priorityFee_EVVM: priorityFee_EVVM,
            nonce_EVVM: nonce_EVVM,
            priorityFlag_EVVM: priorityFlag_EVVM,
            signature_EVVM: signature_EVVM
        });
        _recordMove(move, msg.sender);
    }

    function _recordMove(MoveData memory move, address fisher) internal {
        // 1. Verify Signature
        string memory dataHash = Strings.toHexString(uint256(keccak256(move.data)));
        string memory message = string.concat(
            Strings.toString(move.gameId),
            ",",
            move.moveType,
            ",",
            dataHash,
            ",",
            Strings.toString(move.nonce)
        );

        if (
            !SignatureRecover.signatureVerification(
                Strings.toString(IEvvm(evvmHookAddress).getEvvmID()),
                "recordMove",
                message,
                move.signature,
                move.agent
            )
        ) revert InvalidSignature();

        // 2. Check Nonce
        if (checkAsyncNonce[move.agent][move.nonce]) revert NonceAlreadyUsed();

        // 3. EVVM Payment (Agent pays Fisher/Service)
        IEvvm(evvmHookAddress).pay(
            move.agent,
            address(this),
            "", // metadata
            ETHER_ADDRESS,
            0, // amount
            move.priorityFee_EVVM,
            move.nonce_EVVM,
            move.priorityFlag_EVVM,
            address(this), // fisher (msg.sender is fisher) -> Wait, fisher arg?
            // The original code passed `address(this)` as fisher to `pay`.
            // "address(this), // fisher (msg.sender is fisher)"
            // If `GameMoveService` is the fisher in the eyes of EVVM (because it calls `pay`), then `address(this)` is correct.
            // But the *real* fisher is `msg.sender` (the one calling recordMove).
            // If `GameMoveService` calls `pay`, `msg.sender` in `Evvm.pay` will be `GameMoveService`.
            // So `fisher` arg in `pay` should be `address(this)`?
            // The original code used `address(this)`. I will stick to that.
            move.signature_EVVM
        );

        // 4. Fisher Rewards (if Service is Staker)
        if (IEvvm(evvmHookAddress).isAddressStaker(address(this))) {
            // Pay priority fee to fisher
            IEvvm(evvmHookAddress).caPay(
                fisher,
                ETHER_ADDRESS,
                move.priorityFee_EVVM
            );

            // Pay reward tokens to fisher (50% of reward)
            IEvvm(evvmHookAddress).caPay(
                fisher,
                PRINCIPAL_TOKEN_ADDRESS,
                IEvvm(evvmHookAddress).getRewardAmount() / 2
            );
        }

        // 5. Mark Nonce
        checkAsyncNonce[move.agent][move.nonce] = true;

        // 6. Validate Move Data
        if (keccak256(bytes(move.moveType)) == keccak256(bytes("BUILD_ROAD"))) {
            uint8 edgeId = abi.decode(move.data, (uint8));
            require(edgeId < BoardUtils.MAX_EDGES, "INVALID_EDGE_ID");
        } else if (keccak256(bytes(move.moveType)) == keccak256(bytes("BUILD_SETTLEMENT")) || 
                   keccak256(bytes(move.moveType)) == keccak256(bytes("BUILD_CITY"))) {
            uint8 vertexId = abi.decode(move.data, (uint8));
            require(vertexId < BoardUtils.MAX_VERTICES, "INVALID_VERTEX_ID");
        } else if (keccak256(bytes(move.moveType)) == keccak256(bytes("MOVE_ROBBER"))) {
            (uint8 hexId, ) = abi.decode(move.data, (uint8, address));
            require(hexId < BoardUtils.MAX_HEXAGONS, "INVALID_HEX_ID");
        }

        // 7. Record Move
        gameMoves[move.gameId].push(Move({
            gameId: move.gameId,
            agent: move.agent,
            moveType: move.moveType,
            data: move.data,
            timestamp: block.timestamp
        }));

        emit MoveRecorded(move.gameId, move.agent, move.moveType);
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
