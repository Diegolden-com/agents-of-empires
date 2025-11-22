# ⚡ Quick Start - FIXED VERSION

## Los 2 Problemas que Tenías

### ❌ Problema 1: "No valid JSON found in response"
**Causa:** El parsing de JSON era muy estricto

**✅ ARREGLADO:**
- Ahora detecta JSON en múltiples formatos
- Logs detallados para debugging
- Fallback robusto si GPT falla

### ❌ Problema 2: "Edge ID required"
**Causa:** El fallback no pasaba IDs válidos

**✅ ARREGLADO:**
- Fallback ahora valida que existan vertices/edges
- Logging claro de qué IDs se seleccionan
- Manejo de errores mejorado

### ❌ Problema 3: No se veía el tablero
**Causa:** Faltaba visualización durante el juego

**✅ ARREGLADO:**
- Nuevo botón "Open Live Board"
- Página `/ai-battle/live/[gameId]` con tablero completo
- Actualización automática cada segundo

## 🚀 Setup en 3 Pasos

### 1. Configura OpenAI API Key

Crea `.env.local` en la raíz:

```bash
OPENAI_API_KEY=sk-tu-key-real-aqui
```

**⚠️ IMPORTANTE:** Reemplaza `sk-tu-key-real-aqui` con tu key real de OpenAI

### 2. Reinicia el Servidor

```bash
# Detén el servidor (Ctrl+C)
npm run dev
```

### 3. ¡Juega!

1. Ve a [http://localhost:3000/ai-battle](http://localhost:3000/ai-battle)
2. Selecciona 2-4 agentes
3. Click "Start Battle"
4. **Click "🎮 Open Live Board"** ← NUEVO!
5. ¡Ve el tablero actualiz arse en tiempo real!

## 🎮 Nueva Visualización

### Antes:
```
Solo veías texto:
"El Conquistador construyó un camino"
"El Mercader comerció recursos"
```

### Ahora:
```
✅ Feed de texto (izquierda)
✅ Botón "Open Live Board"
✅ Tablero completo con:
   - Hexágonos con recursos
   - Edificios de cada jugador
   - Caminos conectando
   - Recursos de cada jugador
   - Actualización cada segundo
```

## 📊 Ejemplo de Uso

```bash
# 1. Asegúrate de tener la API key
cat .env.local
# Debe mostrar: OPENAI_API_KEY=sk-...

# 2. Inicia el servidor
npm run dev

# 3. Abre el navegador
# http://localhost:3000/ai-battle

# 4. Selecciona agentes (ej: Conquistador + Mercader)

# 5. Click "Start Battle"

# 6. Verás en la terminal:
[El Conquistador] Raw response: {"action":"build_settlement"...
[El Conquistador] Valid decision: build_settlement
✅ build_settlement ejecutado

[El Mercader] Raw response: {"action":"build_road"...
[El Mercader] Valid decision: build_road
✅ build_road ejecutado

# 7. En el navegador:
# Click "🎮 Open Live Board"

# 8. Se abre nueva ventana con el tablero
# ¡Ve los hexágonos, edificios, y recursos!
```

## 🔍 Verificación

### Checklist:

- [ ] `.env.local` existe
- [ ] Tiene tu API key real (no la de ejemplo)
- [ ] Servidor reiniciado después de agregar la key
- [ ] Puedes ver `/ai-battle`
- [ ] Los agentes aparecen en la lista
- [ ] Puedes seleccionar agentes
- [ ] Al iniciar batalla, ves eventos
- [ ] Aparece botón "Open Live Board"
- [ ] Al clickear, abre nueva ventana
- [ ] El tablero se ve con hexágonos
- [ ] Los edificios aparecen cuando se construyen

### Si algo falla:

**Logs en la terminal te dirán exactamente qué pasó:**

```bash
# ✅ Funcionando:
[El Conquistador] Raw response: {"action":"roll"}
[El Conquistador] Valid decision: roll

# ❌ Sin API key o inválida:
AI decision error: Error: Invalid API key

# ⚠️ Usando fallback (GPT falló pero el juego continúa):
AI decision error: Error: No valid JSON found in response
[El Conquistador] Fallback for phase: setup_road_1
Selected edge: e_v_0.5_-0.5_0_v_0.5_0_-0.5
```

## 🎯 Lo Que Cambiamos

### `lib/agent-decision.ts`
```typescript
// ANTES: Solo buscaba {.*}
const jsonMatch = fullText.match(/\{[\s\S]*\}/);

// AHORA: Busca en múltiples formatos
let jsonMatch = fullText.match(/\{[\s\S]*\}/);
if (!jsonMatch) {
  const codeBlockMatch = fullText.match(/```json\s*([\s\S]*?)\s*```/);
  if (codeBlockMatch) jsonMatch = [codeBlockMatch[1]];
}

// + Validación con Zod
// + Logging detallado
// + Mejor manejo de errores
```

### `app/api/game/play-ai/route.ts`
```typescript
// ANTES: No guardaba gameId
send({ type: 'game_start', players });

// AHORA: Guarda y envía gameId
const gameId = createGameSession(gameState);
send({ type: 'game_start', gameId, players });
```

### `app/ai-battle/page.tsx`
```typescript
// NUEVO: Guarda gameId y muestra botón
const [gameId, setGameId] = useState<string | null>(null);

{gameId && (
  <Button onClick={() => window.open(`/ai-battle/live/${gameId}`, '_blank')}>
    🎮 Open Live Board
  </Button>
)}
```

### `app/ai-battle/live/[gameId]/page.tsx`
```typescript
// NUEVO: Página completa para ver el tablero en vivo
export default function LiveGamePage({ params }) {
  // Carga gameState cada segundo
  // Renderiza CatanBoardWithBuildings
  // Muestra paneles de jugadores
}
```

## 💡 Tips

1. **Testing rápido:** Usa solo 2 agentes para juegos más cortos
2. **Debugging:** Mira la terminal para ver las decisiones de GPT
3. **Costo:** Cada juego cuesta ~$0.01-0.03 con GPT-4o
4. **Performance:** El tablero se actualiza cada 1 segundo
5. **Múltiples ventanas:** Puedes abrir el Live Board en otra pantalla

## ✅ Todo Listo!

Ahora tienes:
- ✅ Parsing robusto de JSON
- ✅ Fallback que funciona
- ✅ Visualización del tablero en tiempo real
- ✅ Logging detallado para debugging
- ✅ Mejor manejo de errores

¡Disfruta viendo a los agentes competir! 🤖🎲

