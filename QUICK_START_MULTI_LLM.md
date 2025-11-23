# 🚀 Quick Start: Multi-LLM Catán

## ¿Qué es esto?

Cada jugador de Catán usa un **LLM diferente** para competir:
- 🗡️ El Conquistador → **GPT-4o** (OpenAI)
- 💰 El Mercader → **Claude 3.5 Sonnet** (Anthropic)
- 🏗️ El Arquitecto → **Gemini 1.5 Flash** (Google)
- 🎲 El Apostador → **GPT-4o-mini** (OpenAI)

## Setup en 3 Pasos

### 1. Instalar
```bash
npm install
```

### 2. Configurar API Keys
Crea `.env.local`:
```bash
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_GENERATIVE_AI_API_KEY=...
```

**¿Dónde obtener las keys?**
- OpenAI: https://platform.openai.com/api-keys
- Anthropic: https://console.anthropic.com/
- Google: https://makersuite.google.com/app/apikey

### 3. Ejecutar
```bash
npm run dev
```

Ve a: **http://localhost:3000/ai-battle**

## 🎮 ¡Eso es todo!

Selecciona 2-4 agentes y observa cómo diferentes LLMs compiten.

## 🔧 Personalizar (opcional)

Edita `lib/agent-configs.ts`:

```typescript
llmConfig: {
  provider: 'anthropic', // o 'openai', 'google', 'mistral'
  model: 'claude-3-5-sonnet-20241022',
  temperature: 0.8, // 0.3 = conservador, 0.9 = arriesgado
}
```

## 📚 Más Información

- **Setup Completo**: `MULTI_LLM_SETUP.md`
- **Resumen Técnico**: `IMPLEMENTACION_MULTI_LLM.md`
- **Variables de Entorno**: `ENV_TEMPLATE.txt`

## ✅ Verificar que Funciona

La consola del servidor debería mostrar:
```
[El Conquistador] Using openai/gpt-4o (temp: 0.9)
[El Mercader] Using anthropic/claude-3-5-sonnet-20241022 (temp: 0.6)
[El Arquitecto] Using google/gemini-1.5-flash (temp: 0.5)
[El Apostador] Using openai/gpt-4o-mini (temp: 0.95)
```

¡Disfruta viendo diferentes LLMs competir! 🤖🎲

