# 🚀 Quick Start Guide - Next.js Edition

## Opción 1: Interfaz Web (Recomendado)

### Iniciar la aplicación

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) y:

1. Click en "Iniciar Juego"
2. Verás el tablero de Catán en 3D
3. Puedes jugar manualmente o activar "Auto-Play"
4. Los agentes tomarán decisiones automáticamente

## Opción 2: Jugar desde la Terminal

### Iniciar el juego

```bash
npm install
npm run play
```

Esto inicia un juego con 4 agentes por defecto. O puedes especificar tus propios agentes:

```bash
npm run play Agent1 Agent2 Agent3
```

### Comandos básicos

Una vez que el juego inicie, verás el prompt `catan>`. Aquí están los comandos esenciales:

```bash
# Ver el estado actual del juego
state

# Ver el tablero
board

# Ver vértices disponibles para construir
vertices 10

# Ver aristas disponibles para caminos
edges 10

# Exportar el estado como JSON (para tu LLM)
json

# Ayuda
help
```

### Ejemplo de juego completo

Aquí hay una secuencia de ejemplo para jugar las primeras rondas:

```bash
# Fase de setup - Agent1 construye primer asentamiento
action {"type": "build_settlement", "data": {"vertexId": "v_0.5_-0.5_0"}}

# Agent1 construye primer camino
action {"type": "build_road", "data": {"edgeId": "e_v_0.5_-0.5_0_v_0.5_0_-0.5"}}

# Ahora es turno de Agent2, etc...
# Después del setup, el juego principal:

# Tirar dados
action {"type": "roll"}

# Construir camino (si tienes recursos)
action {"type": "build_road", "data": {"edgeId": "e_v_1_0_-1_v_1_-1_0"}}

# Comerciar con el banco (4:1)
action {"type": "trade_bank", "data": {"give": {"wood": 4}, "receive": "brick"}}

# Terminar turno
action {"type": "end_turn"}
```

### Flujo del juego

1. **Fase de Setup** (2 rondas):
   - Cada jugador coloca 2 asentamientos y 2 caminos
   - Primera ronda: orden normal
   - Segunda ronda: orden inverso (el último jugador va primero)

2. **Juego Principal**:
   - Tirar dados → Recibir recursos → Construir/Comerciar → Terminar turno
   - Primero en llegar a 10 puntos de victoria gana

---

## Opción 2: API HTTP (Para Agentes Externos)

### Iniciar el servidor

```bash
npm run server
```

El servidor corre en `http://localhost:3000`

### Crear un juego

```bash
curl -X POST http://localhost:3000/game/create \
  -H "Content-Type: application/json" \
  -d '{"players": ["Agent_GPT4", "Agent_Claude", "Agent_Gemini"]}'
```

Respuesta:
```json
{
  "gameId": "game_1705315800000_abc123",
  "players": [
    {"id": "player_0", "name": "Agent_GPT4", "color": "red"},
    {"id": "player_1", "name": "Agent_Claude", "color": "blue"},
    {"id": "player_2", "name": "Agent_Gemini", "color": "white"}
  ]
}
```

### Obtener estado del juego

```bash
curl "http://localhost:3000/game/state?gameId=game_123&playerId=player_0"
```

### Ejecutar acción

```bash
curl -X POST http://localhost:3000/game/action \
  -H "Content-Type: application/json" \
  -d '{
    "gameId": "game_123",
    "playerId": "player_0",
    "action": {
      "type": "build_settlement",
      "data": {"vertexId": "v_0.5_-0.5_0"}
    }
  }'
```

### Ver documentación completa de la API

Lee `API.md` para todos los endpoints y ejemplos.

---

## Opción 3: Agente Simple de Ejemplo

Puedes ejecutar un agente simple que juega automáticamente:

```bash
# Terminal 1: Inicia el servidor
npm run server

# Terminal 2: Ejecuta el agente simple
npx tsx examples/simple-agent.ts
```

Esto creará un juego con 3 agentes simples que jugarán automáticamente hasta que alguien gane.

---

## Para Desarrolladores de Agentes LLM

### Integración básica

1. **Obtén el estado del juego** en JSON
2. **Pasa el JSON a tu LLM** con un prompt apropiado
3. **El LLM devuelve una acción** en formato JSON
4. **Ejecuta la acción** a través de la API

### Ejemplo de prompt para LLM

```
Eres un jugador experto de Catán. Aquí está el estado actual del juego:

{el JSON del estado del juego}

Tu objetivo es ganar llegando primero a 10 puntos de victoria.

Acciones posibles en este turno: [lista de acciones]

Analiza la situación y decide tu próxima acción. Responde SOLO con JSON válido en este formato:
{
  "type": "tipo_de_accion",
  "data": { /* datos necesarios */ },
  "reasoning": "tu razonamiento"
}
```

### Costos de construcción (memoriza esto para tu LLM)

- **Camino**: 1 Madera + 1 Ladrillo
- **Asentamiento**: 1 Madera + 1 Ladrillo + 1 Oveja + 1 Trigo
- **Ciudad**: 2 Trigo + 3 Mineral

### Puntos de Victoria

- Asentamiento: 1 PV
- Ciudad: 2 PV
- Camino más largo (5+ caminos): 2 PV
- Ejército más grande (3+ caballeros): 2 PV

---

## Estructura del Proyecto

```
src/
├── types.ts              # Tipos e interfaces de TypeScript
├── board-generator.ts    # Genera el tablero de Catán
├── game-engine.ts        # Lógica y reglas del juego
├── agent-interface.ts    # API para que los agentes interactúen
├── display.ts            # Utilidades de visualización en terminal
├── terminal-game.ts      # Juego de terminal (npm run play)
└── api-server.ts         # Servidor HTTP API (npm run server)

examples/
├── simple-agent.ts       # Ejemplo de agente simple
└── README.md            # Guía para construir agentes

```

---

## Siguientes Pasos

1. ✅ Juega algunas rondas manualmente para entender el flujo
2. ✅ Revisa el JSON que se exporta con el comando `json`
3. ✅ Lee `API.md` para entender todos los endpoints
4. ✅ Estudia `examples/simple-agent.ts` para ver un agente básico
5. 🚀 ¡Construye tu propio agente LLM en tu otro repo!

---

## Troubleshooting

### El juego no inicia
```bash
# Reinstala dependencias
rm -rf node_modules package-lock.json
npm install
```

### Errores de TypeScript
```bash
# Recompila el proyecto
npm run build
```

### El servidor API no responde
```bash
# Verifica que el servidor esté corriendo
curl http://localhost:3000/health
```

---

## Tips para Agentes LLM

1. **Estrategia inicial**: En el setup, coloca asentamientos en hexágonos con números 6 y 8 (los más probables)

2. **Diversificación**: Intenta tener acceso a los 5 tipos de recursos

3. **Construcción temprana**: Construye caminos y asentamientos rápido para ganar territorio

4. **Ciudades**: Actualiza asentamientos a ciudades para duplicar producción de recursos

5. **Trading**: Usa el banco (4:1) cuando tengas recursos excedentes

¡Buena suerte y que gane el mejor agente! 🎲🤖

