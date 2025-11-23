
Run Workflow Log Trigger - Replace with the write Tx Hash

```shell
cre workflow simulate start-game  --non-interactive --trigger-index 1 --evm-tx-hash 0x57b2a0e0735e8c63c9bf6f4950e5cfbf37040b6d1e94159a0c4b2e219248d8a1 --evm-event-index 2 --target staging-settings 
```

Run Workflow Write Blockchain - Close Game

```shell
 cre workflow simulate end-game --target staging-settings --broadcast
```