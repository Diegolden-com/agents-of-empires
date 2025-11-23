# 🎮 ¡Sistema Multi-LLM Listo!

## ✅ ¿Qué se implementó?

Ahora puedes hacer que **cada jugador use un LLM diferente** para competir en Catán.

### Configuración Actual:
- **El Conquistador** 🗡️ → GPT-4o (OpenAI) - Agresivo
- **El Mercader** 💰 → Claude 3.5 Sonnet (Anthropic) - Analítico  
- **El Arquitecto** 🏗️ → Gemini 1.5 Flash (Google) - Conservador
- **El Apostador** 🎲 → GPT-4o-mini (OpenAI) - Impredecible

## 🚀 Cómo Usar (3 pasos)

### 1️⃣ Obtén tus API Keys

Necesitas al menos estas 3:

- **OpenAI**: https://platform.openai.com/api-keys
- **Anthropic**: https://console.anthropic.com/
- **Google**: https://makersuite.google.com/app/apikey

### 2️⃣ Crea `.env.local`

En la raíz del proyecto:

```bash
OPENAI_API_KEY=sk-tu-key-aqui
ANTHROPIC_API_KEY=sk-ant-tu-key-aqui
GOOGLE_GENERATIVE_AI_API_KEY=tu-key-aqui
```

💡 **Tip**: Usa `ENV_TEMPLATE.txt` como referencia

### 3️⃣ Ejecuta

```bash
npm run dev
```

Ve a: http://localhost:3000/ai-battle

## 🎯 ¿Qué verás?

En la consola del servidor verás:

```
[El Conquistador] Using openai/gpt-4o (temp: 0.9)
[El Mercader] Using anthropic/claude-3-5-sonnet-20241022 (temp: 0.6)
[El Arquitecto] Using google/gemini-1.5-flash (temp: 0.5)
[El Apostador] Using openai/gpt-4o-mini (temp: 0.95)
```

Esto confirma que cada agente usa su LLM configurado.

## 🔧 Personalizar (Opcional)

¿Quieres cambiar el LLM de un agente?

Edita `lib/agent-configs.ts`:

```typescript
{
  id: 'conquistador',
  name: 'El Conquistador',
  // ... resto
  llmConfig: {
    provider: 'anthropic', // Cambiar proveedor
    model: 'claude-3-5-sonnet-20241022',
    temperature: 0.8, // Ajustar comportamiento
  },
}
```

## 📚 Documentación

- **`QUICK_START_MULTI_LLM.md`** - Inicio rápido
- **`MULTI_LLM_SETUP.md`** - Guía completa (8KB)
- **`MULTI_LLM_README.md`** - Resumen técnico
- **`ENV_TEMPLATE.txt`** - Template de variables

## 💰 Costos

- **Config por defecto**: ~$0.01-0.03 por juego
- **Solo modelos mini/flash**: ~$0.001-0.003 por juego

## 💡 Ideas para Experimentar

1. **GPT-4 vs Claude**: ¿Quién juega mejor?
2. **Temperatura**: ¿Conservador (0.3) o arriesgado (0.9)?
3. **Torneo**: Los 4 proveedores compitiendo
4. **Costos**: Mezcla modelos caros con económicos

## 🐛 ¿Problemas?

### "API key not found"
→ Verifica que `.env.local` esté en la raíz y reinicia el servidor

### Solo quiero usar OpenAI
→ Cambia todos los `provider` a `'openai'` en `agent-configs.ts`

### Muy lento
→ Usa modelos "mini", "flash" o "small"

## 🎉 ¡Listo para Jugar!

```bash
npm run dev
```

¡Disfruta viendo diferentes LLMs competir! 🤖⚔️🤖
