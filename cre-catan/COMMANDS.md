
Run Workflow Log Trigger - Replace with the write Tx Hash

```shell
cre workflow simulate start-game  --non-interactive --trigger-index 1 --evm-tx-hash 0x3a9e6b404ce0ba7a1ea46aee159259447bbf495e5607bebaf8762720ea55bbc0 --evm-event-index 2 --target staging-settings 
```

Run Workflow Write Blockchain - Close Game

```shell
 cre workflow simulate end-game --target staging-settings --broadcast
```