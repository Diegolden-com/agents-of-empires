
Run Workflow Log Trigger - Replace with the write Tx Hash

```shell
cre workflow simulate start-game  --non-interactive --trigger-index 1 --evm-tx-hash 0x8
```

Run Workflow Write Blockchain - Close Game

```shell
 cre workflow simulate end-game --target staging-settings --broadcast
```