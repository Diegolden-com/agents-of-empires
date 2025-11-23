# Agent Examples

This directory contains example agents that demonstrate how to connect to the Catan API.

## Simple Agent

A basic agent that makes simple decisions to play the game.

### Running the Example

1. Start the API server in one terminal:
```bash
npm run server
```

2. In another terminal, run the simple agent:
```bash
npx tsx examples/simple-agent.ts
```

The simple agent will:
- Create a new game with 3 agents
- Each agent takes turns making decisions
- Agents make basic choices (build settlements, roads, etc.)
- Game continues until someone wins or max turns reached

## Building Your Own Agent

To build your own LLM agent, you can:

1. **Use the HTTP API** (recommended for external agents)
   - See `API.md` for full documentation
   - Make HTTP requests to interact with the game
   - Get game state as JSON
   - Send actions as JSON

2. **Use the TypeScript API directly** (if building in this repo)
   - Import from `src/agent-interface.ts`
   - Call `getGameStateForAgent()` to get state
   - Call `executeAgentAction()` to take actions

### Example: LLM Integration

```typescript
// Pseudo-code for an LLM agent

async function llmAgentTurn(gameState) {
  // 1. Get current game state
  const state = await getGameState();
  
  // 2. Format state for LLM prompt
  const prompt = `
    You are playing Settlers of Catan.
    Current Phase: ${state.gameInfo.phase}
    Your Resources: ${JSON.stringify(state.yourInfo.resources)}
    Your Victory Points: ${state.yourInfo.victoryPoints}
    Possible Actions: ${state.possibleActions.join(', ')}
    
    Board State: ${JSON.stringify(state.boardState)}
    
    What action should you take? Respond with JSON in this format:
    {"type": "action_type", "data": {...}}
  `;
  
  // 3. Call LLM API (OpenAI, Anthropic, etc.)
  const llmResponse = await callLLM(prompt);
  
  // 4. Parse LLM response
  const action = JSON.parse(llmResponse);
  
  // 5. Execute action
  const result = await executeAction(action);
  
  return result;
}
```

### Tips for LLM Agents

1. **Provide clear context**: Include victory points, resources, and board state
2. **Limit choices**: Filter possible actions based on current phase
3. **Use structured output**: Request JSON responses from the LLM
4. **Handle errors gracefully**: LLMs may suggest invalid actions
5. **Add reasoning**: Ask the LLM to explain its decisions
6. **Strategy hints**: Prime the LLM with Catan strategy tips

### Advanced Features to Implement

- **Multi-turn planning**: Have LLM plan ahead for multiple turns
- **Opponent modeling**: Track opponent strategies
- **Resource optimization**: Calculate best trades and builds
- **Position evaluation**: Score different board positions
- **Negotiation**: Implement player-to-player trading (future feature)

