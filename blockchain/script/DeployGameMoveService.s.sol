// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/GameMoveService.sol";

contract DeployGameMoveService is Script {
    function run() external {
        // Read environment variables
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address stakingAddress = vm.envAddress("STAKING_ADDRESS");

        console.log("Deploying GameMoveService...");
        console.log("Deployer address:", vm.addr(deployerPrivateKey));
        console.log("Staking address:", stakingAddress);

        // Start broadcasting transactions
        vm.startBroadcast(deployerPrivateKey);

        // Deploy GameMoveService
        GameMoveService gameMoveService = new GameMoveService(stakingAddress);

        vm.stopBroadcast();

        // Log deployment info
        console.log("====================================");
        console.log("GameMoveService deployed at:", address(gameMoveService));
        console.log("====================================");
    }
}
