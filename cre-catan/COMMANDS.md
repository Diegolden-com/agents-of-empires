
Run Workflow Log Trigger - Replace with the write Tx Hash

```shell
cre workflow simulate start-game  --non-interactive --trigger-index 1 --evm-tx-hash 0x1e1f5952166efd7fe1084c14d03372d850b3bdbf93d1c534151ed0a209968bcf --evm-event-index 2 --target staging-settings 
```

Run Workflow Write Blockchain - Close Game

```shell
 cre workflow simulate end-game --target staging-settings --broadcast
```