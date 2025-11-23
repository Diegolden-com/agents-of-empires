import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { google } from '@ai-sdk/google';
import { mistral } from '@ai-sdk/mistral';
import { generateText } from 'ai';
import { z } from 'zod';
import { AgentConfig, LLMConfig } from './agent-configs';
import { GameState, ResourceType } from './types';
import { rankVertices, rankEdges, formatVertexOptions, formatEdgeOptions } from './position-ranker';
import { saveOptionMap } from './option-mapper';

// ✨ Función para obtener el modelo de IA según la configuración
function getModelFromConfig(config: LLMConfig) {
  switch (config.provider) {
    case 'openai':
      return openai(config.model);
    case 'anthropic':
      return anthropic(config.model);
    case 'google':
      return google(config.model);
    case 'mistral':
      return mistral(config.model);
    default:
      console.warn(`Unknown provider: ${config.provider}, falling back to OpenAI`);
      return openai('gpt-4o-mini');
  }
}

export const agentDecisionSchema = z.object({
  action: z.enum([
    'roll',
    'build_road',
    'build_settlement',
    'build_city',
    'trade_bank',
    'end_turn',
  ]),
  // NEW: data ahora puede ser un número (1-5) para seleccionar opción
  // O el formato antiguo para compatibilidad
  data: z.union([
    z.number().min(1).max(5), // Opción numerada
    z.object({
      option: z.number().min(1).max(5), // Opción numerada en objeto
    }),
    z.any(), // Formato antiguo para trade_bank, etc
  ]).optional(),
  message: z.string(),
  reasoning: z.string(),
});

export type AgentDecision = z.infer<typeof agentDecisionSchema>;

function getSystemPrompt(agentConfig: AgentConfig) {
  return `You are ${agentConfig.name}, an expert Catan player.

🏆 WIN CONDITION: BE FIRST TO 10 VICTORY POINTS! 🏆

CRITICAL: Every turn matters. Build aggressively. Don't waste turns!

📊 POINTS TO WIN:
- Settlement = 1 VP (costs: wood+brick+sheep+wheat)
- City = 2 VP (costs: 2 wheat + 3 ore) ← UPGRADE YOUR SETTLEMENTS!
- Longest Road = 2 VP (need 5+ connected roads)

🎯 STRATEGY (SIMPLIFIED):
1. SETUP: Choose numbers 6 or 8 (BEST) > 5 or 9 (GOOD) > others
2. MAIN GAME: ALWAYS build if you have resources!
   - Priority: City (if you have wheat+ore) > Settlement > Road to expansion
   - Trade if you have 4+ of same resource

❌ DON'T: End turn if you can build/trade. This wastes opportunities!

Your personality: ${agentConfig.personality}

=== GAME MECHANICS (Technical Rules) ===

📊 VICTORY POINTS:
- Settlement: 1 VP
- City: 2 VP  
- Longest Road (5+ roads): 2 VP
- **FIRST TO 10 VP WINS THE GAME!**

🎮 VALID ACTIONS:

SETUP PHASES (FREE - BUILD STRATEGICALLY!):
- "build_settlement" - Place settlement (MANDATORY - choose BEST numbers!)
- "build_road" - Place road (MANDATORY - connect for expansion!)

MAIN GAME (Costs resources - BUILD TO WIN!):
- "roll" - Roll dice (ONLY in dice_roll phase)
- "build_settlement" - Build settlement = +1 VP (costs: 1 wood + 1 brick + 1 sheep + 1 wheat)
- "build_city" - Upgrade to city = +1 VP (costs: 2 wheat + 3 ore) - VERY EFFICIENT!
- "build_road" - Build road (costs: 1 wood + 1 brick)
- "trade_bank" - Trade 4:1 with bank (convert excess resources)
- "end_turn" - End turn (ONLY if you can't build anything useful!)

⚠️ IN SETUP PHASES: You CANNOT end_turn! You MUST build!

🚨 CRITICAL BUILDING RULES (FOLLOW STRICTLY OR YOUR ACTION WILL BE REJECTED):

═══ SETTLEMENTS (Built on VERTICES) ═══

1. 🔴 DISTANCE RULE (MOST IMPORTANT - ALWAYS CHECK):
   ➤ Settlements MUST be separated from ANY other settlement (yours or opponents) by AT LEAST 2 EDGES
   ➤ In other words: NO settlements on ADJACENT vertices
   ➤ If a vertex has a settlement, ALL vertices directly connected to it by one edge are BLOCKED
   ➤ This rule applies in BOTH setup and main game

2. Connection to Roads (Main game only, NOT in setup):
   ➤ Settlement MUST be connected to one of YOUR roads
   ➤ Cannot build on a vertex without your road reaching it

3. Cannot Build on Occupied Spaces:
   ➤ If a vertex has a settlement or city (ANY player), you CANNOT build there
   ➤ Only use vertexIds from the AVAILABLE VERTICES list provided

4. Cost:
   ➤ Setup: FREE (no resources)
   ➤ Main game: 1 wood + 1 brick + 1 sheep + 1 wheat

═══ ROADS (Built on EDGES) ═══

1. 🔴 CONNECTION RULE (CRITICAL):
   ➤ Roads MUST connect to:
     • One of YOUR existing roads, OR
     • One of YOUR settlements/cities
   
2. 🔴 SETUP SPECIAL RULE (EXTREMELY IMPORTANT):
   ➤ In setup_road_1 and setup_road_2 phases:
   ➤ The road MUST connect to your LAST (most recent) settlement you just built
   ➤ NOT any settlement, only the LAST one!
   
3. Cannot Build on Occupied Spaces:
   ➤ If an edge already has a road (ANY player), you CANNOT build there
   ➤ Only use edgeIds from the AVAILABLE EDGES list provided

4. Cost:
   ➤ Setup: FREE (no resources)
   ➤ Main game: 1 wood + 1 brick

═══ CITIES (Built on VERTICES - Upgrade) ═══

1. Only on YOUR Settlements:
   ➤ A city REPLACES one of your existing settlements
   ➤ Cannot build directly on empty vertex
   ➤ Cannot upgrade opponent's settlement

2. Cost: 2 wheat + 3 ore

3. Production: Cities produce 2 resources instead of 1

═══ VERTICES vs EDGES ═══
- VERTICES: Corners where hexagons meet (for settlements/cities)
- EDGES: Lines connecting vertices (for roads)

🎲 DICE PROBABILITY (for strategic planning):
- 6 and 8: 13.9% each ⭐⭐⭐⭐⭐ (Most frequent - prioritize these!)
- 5 and 9: 11.1% each ⭐⭐⭐⭐
- 4 and 10: 8.3% each ⭐⭐⭐
- 3 and 11: 5.6% each ⭐⭐
- 2 and 12: 2.8% each ⭐

🎯 GAME PHASES:

SETUP PHASES (Free building, but MANDATORY):
1. setup_settlement_1: MUST use "build_settlement" with available vertexId
2. setup_road_1: MUST use "build_road" connected to settlement from step 1
3. setup_settlement_2: MUST use "build_settlement" with available vertexId
4. setup_road_2: MUST use "build_road" connected to settlement from step 3

MAIN GAME:
5. dice_roll: MUST use "roll" action
6. main: Can build, trade, or "end_turn"

❌ COMMON MISTAKES TO AVOID:

1. ❌ Building settlements too close (violating distance rule)
   ✅ Always leave at least 2 edges between settlements

2. ❌ Building disconnected roads
   ✅ Roads must extend from your network

3. ❌ In setup_road_2, connecting to first settlement instead of second
   ✅ Connect to your LAST (most recent) settlement

4. ❌ Using "end_turn" in setup phases
   ✅ You MUST build in setup phases

5. ❌ Using wrong action names like "setup_settlement"
   ✅ Always use "build_settlement" (even in setup)

6. ❌ Building on occupied vertices/edges
   ✅ Only use IDs from the provided AVAILABLE lists

=== RESPONSE FORMAT ===

Respond ONLY with valid JSON in this EXACT format:
{
  "action": "roll" | "build_road" | "build_settlement" | "build_city" | "trade_bank" | "end_turn",
  "data": { "vertexId": "v_..." } OR { "edgeId": "e_..." } OR { "give": {"wood": 4}, "receive": "brick" } OR null,
  "message": "Your in-character message (1-2 sentences)",
  "reasoning": "Why you chose this (1 sentence)"
}

EXAMPLES:

Setup phase (building road):
{
  "action": "build_road",
  "data": 1,
  "message": "Establishing my trade route!",
  "reasoning": "Option 1 has best expansion potential"
}

Setup phase (building settlement):
{
  "action": "build_settlement",
  "data": 2,
  "message": "Claiming this strategic position!",
  "reasoning": "Option 2 has good numbers and diverse resources"
}

Main phase (rolling dice):
{
  "action": "roll",
  "message": "Let's see what fortune brings!",
  "reasoning": "Must roll dice to start turn"
}

🎯 EVERY TURN, CHECK IN ORDER:
1. Can build CITY? (2 wheat + 3 ore) → DO IT! Pick option 1
2. Can build SETTLEMENT? (wood+brick+sheep+wheat) → DO IT! Pick option 1  
3. Can build ROAD? (wood+brick) → DO IT if useful! Pick option 1
4. Have 4+ same resource? → TRADE 4:1 for what you need
5. Otherwise → "end_turn"

RESPOND WITH JSON ONLY (no other text):
{
  "action": "roll"|"build_city"|"build_settlement"|"build_road"|"trade_bank"|"end_turn",
  "data": 1,
  "message": "Short message",
  "reasoning": "Why"
}

CRITICAL: 
- Option 1 is ALWAYS the best choice (highest score)
- NEVER end_turn if you can build anything
- In setup, MUST build (can't end_turn)`;
}

export async function getAgentDecision(
  agentConfig: AgentConfig,
  gameState: GameState,
  playerId: string,
  conversationHistory: Array<{ from: string; text: string }> = []
): Promise<AgentDecision> {
  const player = gameState.players.find(p => p.id === playerId);
  if (!player) {
    throw new Error('Player not found');
  }

  const recentMessages = conversationHistory.slice(-5).map(msg =>
    `${msg.from}: ${msg.text}`
  ).join('\n');

  // Calcular oponente líder
  const opponents = gameState.players.filter(p => p.id !== playerId);
  const leader = opponents.reduce((prev, current) => 
    current.victoryPoints > prev.victoryPoints ? current : prev
  , opponents[0]);

  // Encontrar vértices válidos según reglas de Catán (distancia)
  const availableVerticesRaw = gameState.board.vertices
    .filter(v => {
      if (v.building) return false;
      
      // Check distance rule: no settlements within 1 edge distance
      const adjacentVertexIds = gameState.board.edges
        .filter(e => e.vertexIds.includes(v.id))
        .flatMap(e => e.vertexIds)
        .filter(id => id !== v.id);
      
      // Verify no adjacent vertex has a building
      const hasAdjacentBuilding = adjacentVertexIds.some(id => {
        const adjacentVertex = gameState.board.vertices.find(vertex => vertex.id === id);
        return adjacentVertex?.building !== undefined;
      });
      
      return !hasAdjacentBuilding;
    });

  // Rankear y obtener las mejores 5 opciones
  const rankedVertices = rankVertices(availableVerticesRaw, gameState, 5);
  const vertexOptionsText = formatVertexOptions(rankedVertices);

  console.log(`\n🎯 Generated ${rankedVertices.length} vertex options for ${player.name}`);

  // Para edges, filtrar según la fase
  let availableEdgesRaw = gameState.board.edges.filter(e => !e.road);
  
  // Si es fase de setup de caminos, solo mostrar edges conectados al último asentamiento
  if (gameState.phase === 'setup_road_1' || gameState.phase === 'setup_road_2') {
    // Use lastSettlementId if available (reliable)
    let settlementId = gameState.lastSettlementId;
    
    // Fallback logic if not set (shouldn't happen with new engine)
    if (settlementId === undefined) {
       const playerVertices = gameState.board.vertices.filter(v => 
        v.building && v.building.playerId === playerId
      );
      if (playerVertices.length > 0) {
        settlementId = playerVertices[playerVertices.length - 1].id;
      }
    }

    if (settlementId !== undefined) {
      // Solo edges que conectan al último asentamiento
      availableEdgesRaw = availableEdgesRaw.filter(e => 
        e.vertexIds.includes(settlementId!)
      );
      console.log(`🔍 Setup road phase: Found ${availableEdgesRaw.length} edges connected to last settlement ${settlementId}`);
    }
  } else if (!gameState.phase.startsWith('setup') && gameState.phase !== 'dice_roll') {
    // En fase main, mostrar edges conectados a estructuras del jugador
    const connectedEdges = availableEdgesRaw.filter(e => {
      // Check if edge connects to player's roads or settlements
      const [v1Id, v2Id] = e.vertexIds;
      const v1 = gameState.board.vertices.find(v => v.id === v1Id);
      const v2 = gameState.board.vertices.find(v => v.id === v2Id);
      
      // Connected to player's building?
      if (v1?.building?.playerId === playerId || v2?.building?.playerId === playerId) {
        return true;
      }
      
      // Connected to player's road?
      const adjacentEdges = gameState.board.edges.filter(adj => 
        adj.id !== e.id && 
        (adj.vertexIds.includes(v1Id) || adj.vertexIds.includes(v2Id))
      );
      return adjacentEdges.some(adj => adj.road?.playerId === playerId);
    });
    
    availableEdgesRaw = connectedEdges.length > 0 ? connectedEdges : availableEdgesRaw;
  }

  // CRITICAL: Validate ALL edges before ranking them
  // With numeric IDs and adjacentVertexIds, all edges are guaranteed valid by construction
  console.log(`\n🔍 Found ${availableEdgesRaw.length} available edges for ${player.name}`);
  
  // Rankear y obtener las mejores 5 opciones
  const rankedEdges = rankEdges(availableEdgesRaw, gameState, playerId, 5);
  const edgeOptionsText = formatEdgeOptions(rankedEdges);

  console.log(`🎯 Generated ${rankedEdges.length} edge options for ${player.name}`);

  // Guardar el mapeo de opciones a IDs para este jugador
  saveOptionMap(playerId, rankedVertices, rankedEdges);

  const prompt = `TURN ${gameState.turn} - PHASE: ${gameState.phase}

YOUR STATUS (${player.name}):
- Victory Points: ${player.victoryPoints}
- Resources:
  🌲 Wood: ${player.resources.wood}
  🧱 Brick: ${player.resources.brick}
  🐑 Sheep: ${player.resources.sheep}
  🌾 Wheat: ${player.resources.wheat}
  ⛏️  Ore: ${player.resources.ore}
- Remaining Pieces:
  Roads: ${player.roads}/15
  Settlements: ${player.settlements}/5
  Cities: ${player.cities}/4

YOUR BUILDINGS:
- ${5 - player.settlements} Settlements placed
- ${4 - player.cities} Cities placed
- ${15 - player.roads} Roads built

OPPONENTS:
${opponents.map(p => `- ${p.name}: ${p.victoryPoints} VP, ${Object.values(p.resources).reduce((a, b) => a + b, 0)} total resources`).join('\n')}

${leader.victoryPoints > player.victoryPoints ? `⚠️ ${leader.name} is LEADING with ${leader.victoryPoints} VP!` : '✅ You are in the lead!'}

CURRENT PHASE: ${gameState.phase}

${gameState.diceRoll ? `LAST DICE ROLL: ${gameState.diceRoll[0]} + ${gameState.diceRoll[1]} = ${gameState.diceRoll[0] + gameState.diceRoll[1]}` : ''}

BOARD STATUS:
- Total settlements on board: ${gameState.board.vertices.filter(v => v.building).length}
- Total roads on board: ${gameState.board.edges.filter(e => e.road).length}

🎯 AVAILABLE OPTIONS (CHOOSE A NUMBER - MUCH EASIER!):

${rankedVertices.length > 0 ? `
✅ Settlement Options (choose 1-${rankedVertices.length}):
${vertexOptionsText}

These are ranked by strategic value (higher score = better position)
All options respect the DISTANCE RULE automatically
` : '❌ No settlement options available'}

${rankedEdges.length > 0 ? `
✅ Road Options (choose 1-${rankedEdges.length}):
${edgeOptionsText}

${gameState.phase === 'setup_road_1' || gameState.phase === 'setup_road_2' ? 
  '⚠️ SETUP PHASE: All roads connect to your LAST settlement (as required)' : 
  'All roads connect to your existing network'}
` : '❌ No road options available'}

🚨 NEW SIMPLIFIED SYSTEM - JUST PICK A NUMBER!

Instead of complex IDs, you now simply choose:
- For settlements: Pick option 1, 2, 3, 4, or 5
- For roads: Pick option 1, 2, 3, 4, or 5

Example response:
{
  "action": "build_settlement",
  "data": { "option": 1 },  ← Just pick a number!
  "message": "Building on the best spot!",
  "reasoning": "Option 1 has the highest score"
}

OR even simpler:
{
  "action": "build_settlement",
  "data": 1,  ← Even simpler: just the number!
  "message": "Building on the best spot!",
  "reasoning": "Option 1 has highest score"
}

✅ BENEFITS:
- No complex IDs to copy
- All options are pre-validated and ranked
- Impossible to choose invalid positions
- Option 1 is usually the best (highest score)

${gameState.phase.startsWith('setup') ? `
🚨 YOU ARE IN SETUP PHASE - BUILDING IS FREE BUT MANDATORY 🚨
Current phase: ${gameState.phase}

${gameState.phase === 'setup_settlement_1' ? `
┌─────────────────────────────────────────────────────────┐
│ ACTION REQUIRED: Place your FIRST settlement           │
│                                                         │
│ ➡️  Use action: "build_settlement"                      │
│ ➡️  With data: { "vertexId": "..." }                    │
│ ➡️  Pick ANY vertexId from VALID Vertices list above    │
│                                                         │
│ ✅ FREE (no resources needed)                           │
│ ✅ Distance rule already enforced in list              │
│ ❌ CANNOT use "end_turn"                                │
│                                                         │
│ EXAMPLE - Just pick option 1 (the best):               │
│ {                                                       │
│   "action": "build_settlement",                         │
│   "data": 1,                                            │
│   "message": "Claiming strategic position!",            │
│   "reasoning": "Option 1 has best score"                │
│ }                                                       │
└─────────────────────────────────────────────────────────┘
` : gameState.phase === 'setup_settlement_2' ? `
┌─────────────────────────────────────────────────────────┐
│ ACTION REQUIRED: Place your SECOND settlement          │
│                                                         │
│ ➡️  Use action: "build_settlement"                      │
│ ➡️  With data: { "vertexId": "..." }                    │
│ ➡️  Pick ANY vertexId from VALID Vertices list above    │
│                                                         │
│ ✅ FREE (no resources needed)                           │
│ ✅ Distance rule already enforced in list              │
│ ❌ CANNOT use "end_turn"                                │
└─────────────────────────────────────────────────────────┘
` : gameState.phase === 'setup_road_1' ? `
┌─────────────────────────────────────────────────────────┐
│ ACTION REQUIRED: Place road connected to FIRST settlement │
│                                                         │
│ ➡️  Use action: "build_road"                            │
│ ➡️  With data: { "edgeId": "..." }                      │
│ ➡️  Pick ANY edgeId from VALID Edges list above        │
│                                                         │
│ ✅ FREE (no resources needed)                           │
│ ✅ Connection already enforced in list                 │
│ ⚠️  List shows ONLY edges connected to your last settlement │
│ ❌ CANNOT use "end_turn"                                │
│                                                         │
│ EXAMPLE - Just pick a number (1 is usually best):      │
│ {                                                       │
│   "action": "build_road",                               │
│   "data": 1,                                            │
│   "message": "Building my first road!",                 │
│   "reasoning": "Option 1 connects well"                 │
│ }                                                       │
└─────────────────────────────────────────────────────────┘
` : `
┌─────────────────────────────────────────────────────────┐
│ ACTION REQUIRED: Place road connected to SECOND settlement │
│                                                         │
│ ➡️  Use action: "build_road"                            │
│ ➡️  With data: { "edgeId": "..." }                      │
│ ➡️  Pick ANY edgeId from VALID Edges list above        │
│                                                         │
│ ✅ FREE (no resources needed)                           │
│ ✅ Connection already enforced in list                 │
│ ⚠️  List shows ONLY edges connected to your last settlement │
│ ❌ CANNOT use "end_turn"                                │
└─────────────────────────────────────────────────────────┘
`}
` : gameState.phase === 'dice_roll' ? `
┌─────────────────────────────────────────────────────────┐
│ 🎲 DICE ROLL PHASE                                      │
│                                                         │
│ ➡️  Use action: "roll"                                  │
│ ➡️  No data needed: { "action": "roll" }                │
│                                                         │
│ ℹ️  After rolling, you'll get resources and enter main phase │
│ ❌ NO other action is valid right now                   │
└─────────────────────────────────────────────────────────┘
` : `
┌─────────────────────────────────────────────────────────┐
│ 🏗️  MAIN GAME PHASE - Choose your action                │
│                                                         │
│ Available actions:                                      │
│                                                         │
│ 🛣️  "build_road" - Requires: 1 wood + 1 brick           │
│    Must connect to your roads/settlements              │
│    Use edgeId from VALID Edges list                    │
│                                                         │
│ 🏠 "build_settlement" - Requires: 1 wood + 1 brick +    │
│    1 sheep + 1 wheat                                   │
│    Must connect to YOUR road                           │
│    Must respect distance rule (2+ edges from others)   │
│    Use vertexId from VALID Vertices list               │
│                                                         │
│ 🏛️  "build_city" - Requires: 2 wheat + 3 ore            │
│    Upgrades YOUR settlement to city                    │
│    Use vertexId of your existing settlement            │
│                                                         │
│ 💱 "trade_bank" - Give 4 same resources, get 1 other    │
│    Example: { "give": {"wood": 4}, "receive": "brick" }│
│                                                         │
│ ⏭️  "end_turn" - Finish your turn                       │
│    Use when you can't or don't want to do more        │
│                                                         │
│ Your resources: 🌲${player.resources.wood} 🧱${player.resources.brick} 🐑${player.resources.sheep} 🌾${player.resources.wheat} ⛏️${player.resources.ore}  │
└─────────────────────────────────────────────────────────┘
`}

${recentMessages ? `RECENT MESSAGES:\n${recentMessages}\n` : ''}

DECISION TIME: What's your next move based on the CURRENT PHASE above?

Remember: You are ${agentConfig.name}. ${agentConfig.personality}

Respond with valid JSON only.`;

  try {
    // ✨ Usar el LLM configurado para este agente
    const model = getModelFromConfig(agentConfig.llmConfig);
    const temperature = agentConfig.llmConfig.temperature ?? 0.7;
    const maxTokens = agentConfig.llmConfig.maxTokens ?? 300;
    
    console.log(`[${agentConfig.name}] Using ${agentConfig.llmConfig.provider}/${agentConfig.llmConfig.model} (temp: ${temperature})`);
    
    const result = await generateText({
      model: model as any,
      system: getSystemPrompt(agentConfig),
      prompt,
      temperature,
      maxTokens: maxTokens, // Back to maxTokens for SDK 5
    } as any); // Type override for multi-provider compatibility

    const fullText = result.text;

    console.log(`[${agentConfig.name}] Raw response:`, fullText.substring(0, 300));
    
    // Log if we see wrong action names
    if (fullText.includes('"action": "setup_')) {
      console.error(`[${agentConfig.name}] ERROR: Used wrong action name "setup_..." - should use "build_road" or "build_settlement"`);
    }

    // Extract JSON from response - try multiple patterns
    let jsonMatch = fullText.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      // Try to find JSON after ```json
      const codeBlockMatch = fullText.match(/```json\s*([\s\S]*?)\s*```/);
      if (codeBlockMatch) {
        jsonMatch = [codeBlockMatch[1]];
      }
    }

    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        const validated = agentDecisionSchema.parse(parsed);
        console.log(`[${agentConfig.name}] Valid decision:`, validated.action);
        return validated;
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        console.log('Failed JSON:', jsonMatch[0]);
      }
    }

    console.warn('No valid JSON found, using fallback');
    throw new Error('No valid JSON found in response');
  } catch (error) {
    console.error('AI decision error:', error);
    
    // Fallback decision based on phase and strategy
    return getFallbackDecision(agentConfig, gameState, player, rankedVertices, rankedEdges);
  }
}

function getFallbackDecision(
  agentConfig: AgentConfig,
  gameState: GameState,
  player: any,
  rankedVertices: any[],
  rankedEdges: any[]
): AgentDecision {
  const { phase } = gameState;

  console.log(`[${agentConfig.name}] Fallback for phase: ${phase}`);
  console.log(`Available vertices: ${rankedVertices.length}, edges: ${rankedEdges.length}`);

  if (phase === 'dice_roll') {
    return {
      action: 'roll',
      message: 'Let the dice decide our fate!',
      reasoning: 'Must roll dice in this phase',
    };
  }

  if (phase === 'setup_settlement_1' || phase === 'setup_settlement_2') {
    if (rankedVertices.length === 0) {
      console.error('❌ No available vertices!');
      return {
        action: 'end_turn',
        message: 'No available positions...',
        reasoning: 'No vertices available',
      };
    }
    
    // Use option 1 (best option) or random from top 3
    const option = Math.floor(Math.random() * Math.min(3, rankedVertices.length)) + 1;
    
    console.log(`✅ Fallback: Selected option ${option} (out of ${rankedVertices.length} available)`);
    return {
      action: 'build_settlement',
      data: option,
      message: 'Claiming this land for my empire!',
      reasoning: 'Setup phase requires settlement',
    };
  }

  if (phase === 'setup_road_1' || phase === 'setup_road_2') {
    if (rankedEdges.length === 0) {
      console.error('❌ No available edges!');
      return {
        action: 'end_turn',
        message: 'No paths available...',
        reasoning: 'No edges available',
      };
    }
    
    // Use option 1 (best option) or random from top 3
    const option = Math.floor(Math.random() * Math.min(3, rankedEdges.length)) + 1;
    
    console.log(`✅ Fallback: Selected option ${option} (out of ${rankedEdges.length} available)`);
    return {
      action: 'build_road',
      data: option,
      message: 'Building pathways to victory!',
      reasoning: 'Setup phase requires road connected to settlement',
    };
  }

  // Main phase fallback
  if (agentConfig.strategyStyle === 'AGGRESSIVE_EXPANSION' && 
      player.resources.wood >= 1 && player.resources.brick >= 1 &&
      rankedEdges.length > 0) {
    return {
      action: 'build_road',
      data: 1, // Best option
      message: 'Expanding my territory!',
      reasoning: 'Aggressive expansion strategy',
    };
  }

  if (player.resources.wheat >= 2 && player.resources.ore >= 3) {
    const settlement = gameState.board.vertices.find(
      v => v.building?.playerId === player.id && v.building?.type === 'settlement'
    );
    if (settlement) {
      return {
        action: 'build_city',
        data: { vertexId: settlement.id },
        message: 'Upgrading to a mighty city!',
        reasoning: 'Have resources for city',
      };
    }
  }

  // Trade if we have excess
  const resourceCounts = Object.entries(player.resources) as [ResourceType, number][];
  const excess = resourceCounts.find(([, count]) => count >= 4);
  
  if (excess) {
    const [giveResource] = excess;
    const needed = resourceCounts.filter(([type]) => type !== giveResource)
      .sort(([, a], [, b]) => a - b)[0];
    
    if (needed) {
      return {
        action: 'trade_bank',
        data: { give: { [giveResource]: 4 }, receive: needed[0] },
        message: 'Making a strategic trade!',
        reasoning: 'Converting excess resources',
      };
    }
  }

  return {
    action: 'end_turn',
    message: 'Observing the board... planning my next move.',
    reasoning: 'No viable actions available',
  };
}

