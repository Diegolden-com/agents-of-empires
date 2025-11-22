# 🚀 Setup de Agentes AI

## Problemas Solucionados ✅

### 1. JSON Parsing Mejorado
- ✅ Detecta JSON en múltiples formatos (plain, code blocks)
- ✅ Logging detallado para debugging
- ✅ Fallback robusto con IDs válidos
- ✅ Validación con Zod antes de usar decisiones

### 2. Visualización del Tablero
- ✅ Botón "Open Live Board" para ver el juego en tiempo real
- ✅ Página `/ai-battle/live/[gameId]` con tablero completo
- ✅ Actualización automática cada segundo
- ✅ Muestra edificios, caminos, y ciudades

## 📝 Configuración de OpenAI API Key

### Paso 1: Obtener tu API Key

1. Ve a [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Inicia sesión o crea una cuenta
3. Click en "Create new secret key"
4. Copia la key (empieza con `sk-...`)

### Paso 2: Configurar en el Proyecto

Crea un archivo `.env.local` en la raíz del proyecto:

```bash
# En /Users/guty/Desktop/code/catan/.env.local

OPENAI_API_KEY=sk-tu-key-aqui
```

**⚠️ IMPORTANTE:**
- El archivo debe llamarse `.env.local` (NO `.env`)
- No compartas esta key públicamente
- Next.js carga automáticamente las variables de `.env.local`

### Paso 3: Verificar la Configuración

```bash
# Detén el servidor si está corriendo (Ctrl+C)

# Inicia de nuevo
npm run dev
```

La key debería cargarse automáticamente.

## 🎮 Cómo Usar

### Opción 1: Interfaz Web (Con Tablero Visual)

1. Ve a [http://localhost:3000/ai-battle](http://localhost:3000/ai-battle)
2. Selecciona 2-4 agentes
3. Click "Start Battle"
4. **Click "Open Live Board"** para ver el tablero
5. ¡Disfruta viendo a los agentes jugar!

### Opción 2: Ver el Tablero Directamente

Si ya tienes un `gameId`:

```
http://localhost:3000/ai-battle/live/GAME_ID
```

El tablero se actualiza automáticamente cada segundo.

## 🔍 Debugging

### Si ves "No valid JSON found in response"

**Causas comunes:**
1. API key no configurada o inválida
2. Sin créditos en OpenAI
3. Rate limit excedido

**Solución:**
- Verifica que `.env.local` existe y tiene la key correcta
- Reinicia el servidor: `npm run dev`
- Verifica los logs en la terminal

### Logs Útiles

El sistema ahora muestra logs detallados:

```bash
[El Conquistador] Raw response: {"action":"build_road"...
[El Conquistador] Valid decision: build_road
[El Conquistador] Fallback for phase: setup_road_1
Selected edge: e_v_0.5_-0.5_0_v_0.5_0_-0.5
```

### Si el fallback funciona pero GPT no

**Verifica:**

```bash
# En la terminal donde corre `npm run dev`, busca:

AI decision error: Error: No valid JSON found in response

# Si ves esto, GPT no está respondiendo correctamente
```

**Soluciones:**
1. Verifica la API key
2. Prueba con un modelo diferente (cambia en `lib/agent-decision.ts`):
   ```typescript
   model: openai('gpt-3.5-turbo'),  // Más barato para testing
   ```
3. Aumenta el timeout o maxTokens

## 🎯 Features Implementadas

### Mejoras en el Sistema de Decisión

```typescript
// lib/agent-decision.ts

// ✅ Múltiples patrones de extracción de JSON
// ✅ Logging detallado
// ✅ Fallback con IDs reales
// ✅ Validación con Zod

async function getAgentDecision(...) {
  // Intenta parsear JSON de múltiples formas
  // Si falla, usa fallback inteligente
  // Siempre valida con Zod antes de retornar
}
```

### Visualización en Tiempo Real

```typescript
// app/ai-battle/live/[gameId]/page.tsx

// ✅ Tablero con hexágonos SVG
// ✅ Edificios y caminos visibles
// ✅ Actualización automática (1s interval)
// ✅ Paneles de jugadores con recursos
```

## 📊 Flow del Sistema

```
1. Usuario selecciona agentes
   ↓
2. POST /api/game/play-ai
   ↓
3. Se crea juego → gameId
   ↓
4. En cada turno:
   - getAgentDecision() llama a GPT-4
   - Intenta parsear JSON
   - Si falla → usa fallback
   - Valida con Zod
   - Ejecuta acción
   - Stream evento al frontend
   ↓
5. Frontend muestra:
   - Feed de eventos
   - Botón "Open Live Board"
   ↓
6. Live Board:
   - Carga gameState cada 1s
   - Renderiza tablero actualizado
   - Muestra recursos y edificios
```

## 🛠️ Customización

### Cambiar el Modelo de OpenAI

```typescript
// lib/agent-decision.ts

const result = await streamText({
  model: openai('gpt-4o'),          // Más inteligente
  // model: openai('gpt-4-turbo'),   // Balance
  // model: openai('gpt-3.5-turbo'), // Más rápido/barato
  // ...
});
```

### Ajustar Velocidad del Juego

```typescript
// app/api/game/play-ai/route.ts

await new Promise(resolve => setTimeout(resolve, 1500)); // Delay entre acciones
```

Reduce a `500` para juegos más rápidos, aumenta a `3000` para más lento.

### Cambiar Frecuencia de Actualización del Tablero

```typescript
// app/ai-battle/live/[gameId]/page.tsx

const interval = setInterval(loadGameState, 1000); // 1 segundo
// Cambia a 2000 para 2 segundos, etc.
```

## 💰 Costos Estimados

Con GPT-4o:
- ~300-500 tokens por decisión
- ~50-100 decisiones por juego
- **~$0.01-0.03 USD por juego**

Para reducir costos en testing:
```typescript
model: openai('gpt-3.5-turbo'), // ~$0.001-0.003 por juego
```

## ✅ Checklist de Setup

- [ ] Archivo `.env.local` creado
- [ ] API key de OpenAI configurada
- [ ] Servidor reiniciado (`npm run dev`)
- [ ] Ve a `/ai-battle`
- [ ] Selecciona agentes
- [ ] Click "Start Battle"
- [ ] Click "Open Live Board"
- [ ] ¡Disfruta!

## 🐛 Troubleshooting Común

### Error: "Edge ID required"
**Causa:** Fallback no encuentra edges disponibles
**Solución:** Ya está arreglado con mejor validación

### Error: "No valid JSON"
**Causa:** GPT no responde o API key inválida
**Solución:** Verifica `.env.local` y reinicia servidor

### Tablero no se actualiza
**Causa:** gameId no se pasó correctamente
**Solución:** Ya está arreglado en la última versión

### Rate Limit Error
**Causa:** Demasiadas llamadas a OpenAI
**Solución:** Espera 1 minuto o usa gpt-3.5-turbo

## 📚 Recursos

- [OpenAI API Docs](https://platform.openai.com/docs/api-reference)
- [Vercel AI SDK](https://sdk.vercel.ai/docs)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)

---

¿Problemas? Verifica:
1. `.env.local` existe y tiene la key
2. Servidor reiniciado después de agregar la key
3. Logs en la terminal para debugging
4. API key tiene créditos en OpenAI

¡Disfruta viendo a los agentes competir! 🤖🎲

