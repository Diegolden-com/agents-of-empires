
Run Workflow Log Trigger - Replace with the write Tx Hash

```shell
cre workflow simulate start-game  --non-interactive --trigger-index 1 --evm-tx-hash 0xa6431bf40e6c11d28ddc0ca713d35ff97b82c483e923862735305e2617707e21 --evm-event-index 2 --target staging-settings 
```

Run Workflow Write Blockchain - Close Game

```shell
 cre workflow simulate end-game --target staging-settings --broadcast
```