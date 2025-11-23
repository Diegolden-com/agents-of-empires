# 🔥 Configuración Multi-LLM para Catán

Esta guía te ayudará a configurar múltiples proveedores de LLM para que diferentes agentes de IA compitan entre sí usando diferentes modelos.

## 🎯 ¿Por qué usar múltiples LLMs?

- **Comparación directa**: Ve cómo GPT-4, Claude, Gemini y otros modelos compiten en el mismo juego
- **Diversidad**: Cada modelo tiene su propio estilo de juego y toma de decisiones
- **Optimización de costos**: Combina modelos caros con modelos económicos
- **Experimentación**: Prueba diferentes combinaciones de proveedores

## 📋 Configuración Actual

Por defecto, cada agente usa un LLM diferente:

| Agente | Proveedor | Modelo | Temperatura | Estilo |
|--------|-----------|--------|-------------|--------|
| 🗡️ El Conquistador | OpenAI | gpt-4o | 0.9 | Agresivo |
| 💰 El Mercader | Anthropic | claude-3-5-sonnet | 0.6 | Analítico |
| 🏗️ El Arquitecto | Google | gemini-1.5-flash | 0.5 | Conservador |
| 🎲 El Apostador | OpenAI | gpt-4o-mini | 0.95 | Impredecible |

## 🚀 Setup Rápido

### 1. Instala las dependencias

```bash
npm install
```

### 2. Configura tus API Keys

Crea un archivo `.env.local` en la raíz del proyecto:

```bash
# Copia este template y agrega tus API keys

# OpenAI (para El Conquistador y El Apostador)
OPENAI_API_KEY=sk-...

# Anthropic (para El Mercader)
ANTHROPIC_API_KEY=sk-ant-...

# Google (para El Arquitecto)
GOOGLE_GENERATIVE_AI_API_KEY=...

# Mistral (opcional)
MISTRAL_API_KEY=...
```

### 3. Obtén tus API Keys

#### OpenAI
1. Ve a [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Crea una nueva API key
3. Copia el valor que empieza con `sk-...`

#### Anthropic (Claude)
1. Ve a [https://console.anthropic.com/](https://console.anthropic.com/)
2. Crea una cuenta o inicia sesión
3. Ve a "API Keys" y crea una nueva
4. Copia el valor que empieza con `sk-ant-...`

#### Google (Gemini)
1. Ve a [https://makersuite.google.com/app/apikey](https://makersuite.google.com/app/apikey)
2. Crea un proyecto si no tienes uno
3. Crea una API key
4. Copia el valor

#### Mistral
1. Ve a [https://console.mistral.ai/](https://console.mistral.ai/)
2. Crea una cuenta
3. Ve a "API Keys" y crea una nueva
4. Copia el valor

### 4. Ejecuta el juego

```bash
npm run dev
```

Ve a [http://localhost:3000/ai-battle](http://localhost:3000/ai-battle)

## 🎮 Ejemplos de Configuración

### Opción 1: Solo OpenAI (más simple)

Si solo quieres usar OpenAI, modifica `lib/agent-configs.ts`:

```typescript
// Todos los agentes usan OpenAI pero con diferentes modelos/temperaturas
llmConfig: {
  provider: 'openai',
  model: 'gpt-4o', // o 'gpt-4o-mini', 'gpt-3.5-turbo'
  temperature: 0.7,
}
```

Solo necesitas configurar:
```bash
OPENAI_API_KEY=sk-...
```

### Opción 2: OpenAI vs Anthropic

Configura dos proveedores para ver GPT vs Claude:

```bash
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
```

### Opción 3: Todos los proveedores (recomendado)

Configura los 3-4 proveedores principales para máxima diversidad:

```bash
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_GENERATIVE_AI_API_KEY=...
MISTRAL_API_KEY=...
```

## 🔧 Personalización Avanzada

### Cambiar el modelo de un agente

Edita `lib/agent-configs.ts`:

```typescript
{
  id: 'conquistador',
  name: 'El Conquistador',
  // ... resto de configuración
  llmConfig: {
    provider: 'anthropic', // Cambiar de openai a anthropic
    model: 'claude-3-5-sonnet-20241022',
    temperature: 0.9,
    maxTokens: 300,
  },
}
```

### Crear un agente personalizado

Agrega un nuevo agente al array `CATAN_AGENTS`:

```typescript
{
  id: 'mi-agente',
  name: 'Mi Agente Custom',
  personality: 'Describe su personalidad...',
  strategyStyle: 'BALANCED_TRADER',
  goals: ['Objetivo 1', 'Objetivo 2'],
  behaviorRules: ['Regla 1', 'Regla 2'],
  interactionRules: ['Interacción 1'],
  toneOfVoice: 'Describe su tono...',
  preferredResources: ['wood', 'brick'],
  llmConfig: {
    provider: 'openai', // o 'anthropic', 'google', 'mistral'
    model: 'gpt-4o',
    temperature: 0.8,
    maxTokens: 300,
  },
}
```

### Modelos disponibles por proveedor

#### OpenAI
- `gpt-4o` - El más capaz (recomendado)
- `gpt-4o-mini` - Rápido y económico
- `gpt-4-turbo` - Versión anterior
- `gpt-3.5-turbo` - Muy económico

#### Anthropic
- `claude-3-5-sonnet-20241022` - El más capaz (recomendado)
- `claude-3-5-haiku-20241022` - Muy rápido y económico
- `claude-3-opus-20240229` - Versión anterior

#### Google
- `gemini-1.5-pro` - Más capaz
- `gemini-1.5-flash` - Muy rápido y económico (recomendado)
- `gemini-1.0-pro` - Versión anterior

#### Mistral
- `mistral-large-latest` - El más capaz
- `mistral-medium-latest` - Balance
- `mistral-small-latest` - Rápido y económico

## 💰 Gestión de Costos

### Estrategia económica

```typescript
// Usa modelos económicos para todos
llmConfig: {
  provider: 'openai',
  model: 'gpt-4o-mini', // ~$0.001 por juego
}

// O usa Google Gemini Flash (muy económico)
llmConfig: {
  provider: 'google',
  model: 'gemini-1.5-flash', // ~$0.0003 por juego
}
```

### Estrategia balanceada

```typescript
// Mezcla modelos caros y económicos
const agentes = [
  { llmConfig: { provider: 'openai', model: 'gpt-4o' } }, // Caro pero bueno
  { llmConfig: { provider: 'google', model: 'gemini-1.5-flash' } }, // Económico
  { llmConfig: { provider: 'openai', model: 'gpt-4o-mini' } }, // Económico
  { llmConfig: { provider: 'anthropic', model: 'claude-3-5-haiku' } }, // Económico
];
```

## 🐛 Troubleshooting

### Error: "API key not found"

Asegúrate de que tu archivo `.env.local` esté en la raíz del proyecto y que hayas reiniciado el servidor de desarrollo después de agregar las keys.

```bash
# Detén el servidor (Ctrl+C)
# Reinicia
npm run dev
```

### Error: "Invalid API key format"

Verifica que las API keys sean correctas:
- OpenAI: empiezan con `sk-`
- Anthropic: empiezan con `sk-ant-`
- Google: no tienen prefijo específico
- Mistral: formato variable

### Error: "Model not found"

Verifica que el nombre del modelo sea exacto. Los nombres son case-sensitive.

### Juego muy lento

Los modelos grandes (como `gpt-4o` o `claude-3-5-sonnet`) pueden ser lentos. Considera:
- Usar modelos "mini", "flash" o "small"
- Reducir `maxTokens` a 200
- Aumentar el timeout en `app/api/game/play-ai/route.ts`

## 📊 Comparación de Rendimiento

Basado en pruebas, aquí está el rendimiento aproximado:

| Proveedor | Modelo | Velocidad | Calidad | Costo | Recomendado |
|-----------|--------|-----------|---------|-------|-------------|
| OpenAI | gpt-4o | ⚡⚡⚡ | ⭐⭐⭐⭐⭐ | 💰💰💰 | ✅ Sí |
| OpenAI | gpt-4o-mini | ⚡⚡⚡⚡⚡ | ⭐⭐⭐⭐ | 💰 | ✅ Sí |
| Anthropic | claude-3.5-sonnet | ⚡⚡⚡ | ⭐⭐⭐⭐⭐ | 💰💰💰💰 | ✅ Sí |
| Anthropic | claude-3.5-haiku | ⚡⚡⚡⚡⚡ | ⭐⭐⭐⭐ | 💰 | ✅ Sí |
| Google | gemini-1.5-flash | ⚡⚡⚡⚡⚡ | ⭐⭐⭐⭐ | 💰 | ✅ Sí |
| Google | gemini-1.5-pro | ⚡⚡⚡ | ⭐⭐⭐⭐⭐ | 💰💰💰 | ⚙️ Opcional |
| Mistral | mistral-small | ⚡⚡⚡⚡⚡ | ⭐⭐⭐ | 💰 | ⚙️ Opcional |

**Recomendación:** Usa `gpt-4o-mini`, `claude-3.5-haiku` o `gemini-1.5-flash` para el mejor balance entre velocidad, calidad y costo.

## 🎯 Mejores Prácticas

1. **Empieza simple**: Usa solo OpenAI al principio
2. **Agrega proveedores gradualmente**: Agrega Anthropic, luego Google, etc.
3. **Prueba con modelos económicos primero**: Usa `-mini`, `-flash`, o `-small` para testing
4. **Monitorea costos**: Revisa el uso en los dashboards de cada proveedor
5. **Experimenta con temperaturas**: 0.3-0.5 para conservador, 0.8-0.95 para agresivo
6. **Lee los logs**: La consola muestra qué modelo usa cada agente

## 📚 Recursos Adicionales

- [AI_AGENTS.md](./AI_AGENTS.md) - Documentación completa del sistema
- [AGENT_GUIDE.md](./AGENT_GUIDE.md) - Guía para crear agentes
- [Vercel AI SDK](https://sdk.vercel.ai/docs) - Documentación del SDK
- [API.md](./API.md) - Documentación de la API

---

¿Listo para ver LLMs competir? 🤖⚔️🤖

```bash
npm run dev
```

