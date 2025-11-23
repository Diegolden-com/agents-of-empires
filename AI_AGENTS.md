# 🤖 AI Agents con Múltiples LLMs

Sistema de agentes donde **cada jugador usa un LLM diferente** para competir en Catán. Soporta OpenAI (GPT-4), Anthropic (Claude), Google (Gemini) y Mistral.

## 🚀 Setup

### 1. Instalar Dependencias

```bash
npm install
```

### 2. Configurar API Keys para Múltiples LLMs

Crea un archivo `.env.local` con las API keys de los proveedores que quieras usar:

```bash
# OpenAI (GPT-4, GPT-4o, GPT-3.5-turbo)
OPENAI_API_KEY=sk-...

# Anthropic (Claude)
ANTHROPIC_API_KEY=sk-ant-...

# Google (Gemini)
GOOGLE_GENERATIVE_AI_API_KEY=...

# Mistral AI
MISTRAL_API_KEY=...

# AI Gateway (opcional - para usar a través de un gateway unificado)
AI_GATEWAY_API_KEY=...
AI_GATEWAY_URL=https://your-gateway.com/v1
```

**Nota:** Solo necesitas configurar las API keys de los proveedores que uses. Por ejemplo, si solo quieres competir con OpenAI vs Anthropic, solo configura esas dos.

### 3. Ejecutar el Proyecto

```bash
npm run dev
```

Ve a [http://localhost:3000/ai-battle](http://localhost:3000/ai-battle)

## ✨ ¿Cómo Funciona la Competencia Multi-LLM?

Cada agente tiene asignado un **proveedor LLM diferente**:

- 🗡️ **El Conquistador** → OpenAI GPT-4o (temperatura 0.9 - muy agresivo)
- 💰 **El Mercader** → Anthropic Claude 3.5 Sonnet (temperatura 0.6 - analítico)
- 🏗️ **El Arquitecto** → Google Gemini 1.5 Flash (temperatura 0.5 - conservador)
- 🎲 **El Apostador** → OpenAI GPT-4o-mini (temperatura 0.95 - impredecible)

Esto permite comparar diferentes modelos de IA compitiendo entre sí en el mismo juego.

## 🎭 Agentes Disponibles

### 1. El Conquistador 🗡️

**Estrategia:** Expansión Agresiva  
**LLM:** OpenAI GPT-4o (temp: 0.9)

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
**LLM:** Anthropic Claude 3.5 Sonnet (temp: 0.6)

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
**LLM:** Google Gemini 1.5 Flash (temp: 0.5)

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
**LLM:** OpenAI GPT-4o-mini (temp: 0.95)

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

### Arquitectura Multi-LLM

```typescript
// 1. Configuración del agente con LLM específico (lib/agent-configs.ts)
interface LLMConfig {
  provider: 'openai' | 'anthropic' | 'google' | 'mistral';
  model: string;
  temperature?: number;
  maxTokens?: number;
}

interface AgentConfig {
  id: string;
  name: string;
  personality: string;
  strategyStyle: string;
  goals: string[];
  behaviorRules: string[];
  llmConfig: LLMConfig; // ✨ Cada agente tiene su propio LLM
  // ...
}

// 2. Sistema de decisión con soporte multi-LLM (lib/agent-decision.ts)
function getModelFromConfig(config: LLMConfig) {
  switch (config.provider) {
    case 'openai': return openai(config.model);
    case 'anthropic': return anthropic(config.model);
    case 'google': return google(config.model);
    case 'mistral': return mistral(config.model);
  }
}

async function getAgentDecision(
  agentConfig: AgentConfig,
  gameState: GameState,
  playerId: string
): Promise<AgentDecision> {
  // ✨ Usa el LLM configurado para este agente
  const model = getModelFromConfig(agentConfig.llmConfig);
  
  const result = await generateText({
    model, // Cada agente usa su propio LLM
    system: getSystemPrompt(agentConfig),
    prompt: buildGamePrompt(gameState),
    temperature: agentConfig.llmConfig.temperature ?? 0.7,
  });
  
  return parseDecision(result);
}

// 3. Endpoint de streaming (app/api/game/play-ai/route.ts)
export async function POST(req: Request) {
  // Crea juego con agentes multi-LLM
  // Loop de turnos
  // Stream eventos en tiempo real
  // Cada agente usa su LLM configurado
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

### Crear un Nuevo Agente con LLM Personalizado

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
    // ✨ Configurar el LLM para este agente
    llmConfig: {
      provider: 'anthropic', // o 'openai', 'google', 'mistral'
      model: 'claude-3-5-sonnet-20241022',
      temperature: 0.7,
      maxTokens: 300,
    },
  },
];
```

### Modificar el LLM de un Agente

```typescript
// Para usar diferentes proveedores:

// OpenAI
llmConfig: {
  provider: 'openai',
  model: 'gpt-4o',        // Más inteligente
  // o model: 'gpt-4o-mini',  // Más rápido y económico
  // o model: 'gpt-4-turbo',
  temperature: 0.8,
}

// Anthropic Claude
llmConfig: {
  provider: 'anthropic',
  model: 'claude-3-5-sonnet-20241022', // Más capaz
  // o model: 'claude-3-5-haiku-20241022', // Más rápido
  temperature: 0.6,
}

// Google Gemini
llmConfig: {
  provider: 'google',
  model: 'gemini-1.5-pro', // Más capaz
  // o model: 'gemini-1.5-flash', // Más rápido
  temperature: 0.5,
}

// Mistral
llmConfig: {
  provider: 'mistral',
  model: 'mistral-large-latest', // Más capaz
  // o model: 'mistral-small-latest', // Más rápido
  temperature: 0.7,
}

// Modificar temperatura para cambiar comportamiento:
temperature: 0.9  // Más creativo y arriesgado
temperature: 0.5  // Más conservador y predecible
```

### Experimentar con Combinaciones

Puedes crear torneos interesantes comparando diferentes LLMs:

```typescript
// Batalla GPT-4 vs Claude
const battle1 = ['conquistador', 'merchant']; // GPT-4o vs Claude

// Batalla Multi-modelo
const battle2 = ['conquistador', 'merchant', 'architect', 'gambler']; 
// GPT-4o vs Claude vs Gemini vs GPT-4o-mini

// Batalla mismo modelo, diferentes temperaturas
llmConfig: {
  provider: 'openai',
  model: 'gpt-4o',
  temperature: 0.3, // Conservador
}
// vs
llmConfig: {
  provider: 'openai',
  model: 'gpt-4o',
  temperature: 0.95, // Muy arriesgado
}
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

## 📝 Costos Estimados por Proveedor

### OpenAI
- **GPT-4o**: ~$0.01-0.03 por juego (más inteligente)
- **GPT-4o-mini**: ~$0.001-0.003 por juego (más económico)
- **GPT-3.5-turbo**: ~$0.0005-0.001 por juego (muy económico)

### Anthropic
- **Claude 3.5 Sonnet**: ~$0.015-0.04 por juego (excelente calidad)
- **Claude 3.5 Haiku**: ~$0.0005-0.001 por juego (muy rápido)

### Google
- **Gemini 1.5 Pro**: ~$0.01-0.025 por juego
- **Gemini 1.5 Flash**: ~$0.0003-0.0008 por juego (muy económico)

### Mistral
- **Mistral Large**: ~$0.01-0.03 por juego
- **Mistral Small**: ~$0.001-0.003 por juego

**Nota:** Los costos son aproximados y dependen de la longitud de las partidas y la cantidad de tokens usados.

### Para Reducir Costos:
- Usa modelos "mini", "small" o "flash" para testing
- Reduce `maxTokens` a 200
- Mezcla modelos caros (para agentes importantes) con modelos económicos
- Usa `gpt-4o-mini` o `gemini-1.5-flash` que son muy económicos pero capaces

## 🌐 Usar AI Gateway (Opcional)

Si prefieres centralizar todas las llamadas a través de un AI Gateway, puedes configurar las siguientes variables de entorno:

```bash
AI_GATEWAY_API_KEY=your-gateway-key
AI_GATEWAY_URL=https://your-gateway.com/v1
```

Los gateways populares incluyen:
- **Vercel AI Gateway**: Para rate limiting y analytics
- **Portkey**: Para observabilidad multi-proveedor
- **LiteLLM**: Para estandarizar APIs

Con un gateway, puedes:
- Monitorear todas las llamadas en un solo lugar
- Implementar rate limiting y caching
- Cambiar de proveedor sin cambiar código
- Ver analytics y costos unificados

## 🧪 Ejemplos de Batallas

### Batalla 1: OpenAI vs Anthropic
```typescript
// El Conquistador (GPT-4o) vs El Mercader (Claude 3.5)
const battle = ['conquistador', 'merchant'];
```
Compara la agresividad de GPT-4o con la estrategia analítica de Claude.

### Batalla 2: Los 4 Proveedores
```typescript
// GPT-4o vs Claude vs Gemini vs GPT-4o-mini
const battle = ['conquistador', 'merchant', 'architect', 'gambler'];
```
Torneo completo con los 4 proveedores principales.

### Batalla 3: Mismo Modelo, Diferentes Temperaturas
Modifica dos agentes para usar el mismo modelo pero con diferentes temperaturas:
```typescript
llmConfig: { provider: 'openai', model: 'gpt-4o', temperature: 0.3 } // Conservador
llmConfig: { provider: 'openai', model: 'gpt-4o', temperature: 0.95 } // Arriesgado
```

## 🎓 Recursos

- [Vercel AI SDK Docs](https://sdk.vercel.ai/docs)
- [OpenAI API](https://platform.openai.com/docs/api-reference)
- [Anthropic API](https://docs.anthropic.com/)
- [Google AI Studio](https://ai.google.dev/)
- [Mistral AI Docs](https://docs.mistral.ai/)
- [Catan Strategy Guide](https://www.catan.com/game/catan)

## 🔥 Ventajas del Sistema Multi-LLM

1. **Comparación Directa**: Ve cómo diferentes modelos de IA compiten en las mismas condiciones
2. **Diversidad de Estilos**: Cada LLM tiene su propio "estilo" de juego
3. **Optimización de Costos**: Usa modelos caros para agentes clave y modelos económicos para otros
4. **Experimentación**: Prueba diferentes combinaciones de modelos y temperaturas
5. **Realismo**: Más parecido a jugar con humanos que tienen diferentes niveles de habilidad

---

¡Disfruta viendo a diferentes LLMs competir! 🤖🎲🔥

