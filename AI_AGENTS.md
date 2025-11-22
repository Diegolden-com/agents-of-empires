# 🤖 AI Agents con Vercel AI SDK

Sistema de agentes LLM que juegan Catán usando GPT-4 con personalidades únicas.

## 🚀 Setup

### 1. Instalar Dependencias

```bash
npm install
```

### 2. Configurar OpenAI API Key

Crea un archivo `.env.local`:

```bash
OPENAI_API_KEY=sk-...
```

### 3. Ejecutar el Proyecto

```bash
npm run dev
```

Ve a [http://localhost:3000/ai-battle](http://localhost:3000/ai-battle)

## 🎭 Agentes Disponibles

### 1. El Conquistador 🗡️

**Estrategia:** Expansión Agresiva

**Personalidad:**
- Agresivo y expansionista
- Cree que quien controla más territorio, controla el juego
- Prioriza caminos y asentamientos sobre ciudades

**Objetivos:**
- Construir asentamientos y caminos rápidamente
- Bloquear las mejores posiciones antes que los oponentes
- Conseguir el Camino Más Largo (Longest Road)
- Expandirse hacia hexágonos con números 6 y 8

**Tono:** Confiado, dominante, competitivo

### 2. El Mercader 💰

**Estrategia:** Comercio Balanceado

**Personalidad:**
- Calculador y comerciante
- Ve el valor en cada recurso
- Optimiza cada intercambio

**Objetivos:**
- Diversificar fuentes de recursos
- Comerciar estratégicamente con el banco
- Construir ciudades para maximizar producción
- Mantener balance saludable de recursos

**Tono:** Analítico, prudente, estratégico

### 3. El Arquitecto 🏗️

**Estrategia:** Constructor Defensivo

**Personalidad:**
- Metódico y defensivo
- Construye un imperio sólido desde la base
- Prioriza calidad sobre cantidad

**Objetivos:**
- Asegurar posiciones en hexágonos de alta probabilidad
- Construir ciudades lo antes posible
- Maximizar puntos de victoria por construcciones
- Evitar conflictos innecesarios

**Tono:** Reflexivo, cauteloso, profesional

### 4. El Apostador 🎲

**Estrategia:** Oportunista

**Personalidad:**
- Arriesgado y oportunista
- Toma decisiones audaces basadas en intuición
- Impredecible y adaptable

**Objetivos:**
- Tomar riesgos calculados
- Aprovechar errores de oponentes
- Construir en lugares inesperados
- Adaptarse rápidamente a la situación

**Tono:** Despreocupado, bromista, impredecible

## 🎮 Cómo Funciona

### Arquitectura

```typescript
// 1. Configuración del agente (lib/agent-configs.ts)
interface AgentConfig {
  id: string;
  name: string;
  personality: string;
  strategyStyle: string;
  goals: string[];
  behaviorRules: string[];
  // ...
}

// 2. Sistema de decisión (lib/agent-decision.ts)
async function getAgentDecision(
  agentConfig: AgentConfig,
  gameState: GameState,
  playerId: string
): Promise<AgentDecision> {
  // Construye prompt con:
  // - Personalidad del agente
  // - Estado actual del juego
  // - Recursos disponibles
  // - Acciones posibles
  
  const result = await streamText({
    model: openai('gpt-4o'),
    system: getSystemPrompt(agentConfig),
    prompt: buildGamePrompt(gameState),
    temperature: 0.8,
  });
  
  return parseDecision(result);
}

// 3. Endpoint de streaming (app/api/game/play-ai/route.ts)
export async function POST(req: Request) {
  // Crea juego
  // Loop de turnos
  // Stream eventos en tiempo real
  // Ejecuta decisiones de agentes
}
```

### Flujo del Juego

1. **Selección de Agentes** → Usuario elige 2-4 agentes
2. **Inicio del Juego** → Se crea partida de Catán
3. **Loop de Turnos:**
   - Agente analiza estado del juego
   - GPT-4 genera decisión en character
   - Se ejecuta acción
   - Se actualiza estado
   - Stream de evento al frontend
4. **Victoria** → Primer jugador en 10 VP gana

### Formato de Decisión

```typescript
interface AgentDecision {
  action: 'roll' | 'build_road' | 'build_settlement' | 'build_city' | 'trade_bank' | 'end_turn';
  data?: {
    vertexId?: string;
    edgeId?: string;
    give?: Partial<Resources>;
    receive?: ResourceType;
  };
  message: string;      // Mensaje in-character
  reasoning: string;    // Explicación de la decisión
}
```

## 📊 System Prompt Structure

Cada agente recibe un system prompt detallado:

```
You are [Agent Name], a player in Settlers of Catan.

PERSONALITY: [Descripción]
STRATEGY STYLE: [Estilo]

YOUR GOALS:
1. [Goal 1]
2. [Goal 2]
...

BEHAVIOR RULES (FOLLOW STRICTLY):
1. [Rule 1]
2. [Rule 2]
...

GAME RULES:
- Building Costs: ...
- Victory Points: ...
- Dice Probability: ...

Respond ONLY with valid JSON:
{
  "action": "...",
  "data": {...},
  "message": "...",
  "reasoning": "..."
}
```

## 🎯 Prompt Engineering Tips

### 1. Personalidad Consistente

```typescript
// ✅ Bueno
personality: 'Agresivo y expansionista. Cree que quien controla más territorio, controla el juego.'

// ❌ Malo
personality: 'Juega bien'
```

### 2. Reglas de Comportamiento Específicas

```typescript
// ✅ Bueno
behaviorRules: [
  'SIEMPRE construye caminos cuando tienes recursos',
  'NUNCA dejes un espacio libre cerca de hexágonos 6 u 8',
]

// ❌ Malo
behaviorRules: [
  'Juega inteligentemente',
]
```

### 3. Temperatura Óptima

```typescript
// Para decisiones estratégicas
temperature: 0.8  // ✅ Balance entre creatividad y consistencia

// Demasiado determinístico
temperature: 0.2  // ❌ Muy predecible

// Demasiado aleatorio
temperature: 1.5  // ❌ Muy errático
```

## 🔧 Personalizar Agentes

### Crear un Nuevo Agente

```typescript
// lib/agent-configs.ts

export const CATAN_AGENTS: AgentConfig[] = [
  // ... agentes existentes
  {
    id: 'diplomat',
    name: 'El Diplomático',
    personality: 'Cooperativo y negociador. Prefiere alianzas temporales.',
    strategyStyle: 'BALANCED_TRADER',
    goals: [
      'Negociar intercambios beneficiosos',
      'Formar alianzas temporales',
      'Evitar confrontaciones directas',
    ],
    behaviorRules: [
      'Ofrece tratos justos primero',
      'Busca win-win situations',
      'Mantén buenas relaciones',
    ],
    interactionRules: [
      'Siempre es cortés',
      'Ofrece ayuda cuando puedes',
      'Celebra victorias de forma humilde',
    ],
    toneOfVoice: 'Amigable, colaborativo, carismático',
    preferredResources: ['wheat', 'sheep'],
  },
];
```

### Modificar Comportamiento

```typescript
// Más agresivo
temperature: 0.9

// Más conservador  
temperature: 0.6

// Cambiar modelo
model: openai('gpt-4o')        // Más inteligente
model: openai('gpt-3.5-turbo') // Más rápido
```

## 🎬 Eventos de Stream

El servidor envía eventos SSE (Server-Sent Events):

```typescript
// Inicio del juego
{ type: 'game_start', gameId, players }

// Saludo inicial
{ type: 'greeting', playerId, message }

// Pensando
{ type: 'thinking', playerId }

// Decisión tomada
{ type: 'decision', playerId, action, message, reasoning }

// Resultado de acción
{ type: 'action_result', success, message, gameState }

// Victoria
{ type: 'victory', winner, message }

// Error
{ type: 'error', message }
```

## 📈 Métricas y Analytics

### Tracking de Agentes

```typescript
// Futuro: Agregar analytics
interface AgentStats {
  gamesPlayed: number;
  wins: number;
  avgVictoryPoints: number;
  avgTurnsToWin: number;
  preferredActions: Record<string, number>;
  strategyEffectiveness: number;
}
```

## 🚀 Mejoras Futuras

- [ ] Trading entre jugadores (actualmente solo con banco)
- [ ] Desarrollo de cartas (knights, etc.)
- [ ] Negociación verbal entre agentes
- [ ] Memoria de juegos anteriores
- [ ] Aprendizaje adaptativo
- [ ] Torneos automatizados
- [ ] Ranking de agentes
- [ ] Replay de partidas

## 💡 Tips de Desarrollo

### Testing Rápido

```typescript
// Reducir delays para testing
await new Promise(resolve => setTimeout(resolve, 100)); // En vez de 1000
```

### Debug de Prompts

```typescript
// Agregar logging
console.log('PROMPT:', prompt);
console.log('RESPONSE:', fullText);
```

### Fallback Mejorado

```typescript
// Si GPT falla, usar lógica básica
function getFallbackDecision(...) {
  // Lógica simple pero efectiva
  return smartDefaultDecision;
}
```

## 📝 Costos Estimados

Con GPT-4o:
- ~300-500 tokens por decisión
- ~50-100 decisiones por juego
- ~$0.01-0.03 por juego

Para reducir costos:
- Usa `gpt-3.5-turbo` para testing
- Reduce `maxTokens` a 200
- Cachea decisiones similares

## 🎓 Recursos

- [Vercel AI SDK Docs](https://sdk.vercel.ai/docs)
- [OpenAI API](https://platform.openai.com/docs/api-reference)
- [Catan Strategy Guide](https://www.catan.com/game/catan)

---

¡Disfruta viendo a los agentes competir! 🤖🎲

