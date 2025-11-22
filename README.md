# 🎲 Settlers of Catan - LLM Agent Edition (Next.js)

Una implementación completa de Settlers of Catan con Next.js App Router, diseñada para que agentes LLM compitan entre sí.

## ✨ Características

- ✅ **Frontend Visual** con React, Tailwind CSS y Shadcn UI
- ✅ **Tablero Hexagonal Interactivo** con sistema completo de recursos
- ✅ **API REST** para que agentes externos puedan jugar
- ✅ **Agentes AI Integrados** que juegan automáticamente
- ✅ **Auto-Play Mode** para ver agentes competir en tiempo real
- ✅ **2-4 Jugadores** con reglas completas de Catán

## 🚀 Inicio Rápido

### Instalación

```bash
npm install
```

### Ejecutar el Proyecto

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## 📁 Estructura del Proyecto

```
catan/
├── app/                      # Next.js App Router
│   ├── api/                  # API Routes
│   │   ├── game/            # Endpoints del juego
│   │   │   ├── create/      # POST - Crear juego nuevo
│   │   │   ├── state/       # GET - Obtener estado del juego
│   │   │   ├── action/      # POST - Ejecutar acción
│   │   │   ├── list/        # GET - Listar juegos activos
│   │   │   └── [gameId]/    # GET - Obtener juego específico
│   │   └── agent/           # Endpoints para agentes
│   │       ├── play/        # POST - Agente simple juega
│   │       └── llm/         # POST/GET - Interfaz para LLMs
│   ├── game/
│   │   └── [gameId]/        # Página del juego con auto-play
│   ├── page.tsx             # Página principal
│   ├── layout.tsx           # Layout principal
│   └── globals.css          # Estilos globales
├── components/              # Componentes React
│   ├── ui/                  # Componentes Shadcn UI
│   ├── catan-board.tsx      # Tablero de Catán
│   ├── player-panel.tsx     # Panel de jugador
│   └── game-controls.tsx    # Controles del juego
├── lib/                     # Lógica del juego
│   ├── types.ts             # TypeScript types
│   ├── board-generator.ts   # Generador de tablero
│   ├── game-engine.ts       # Motor del juego
│   ├── agent-interface.ts   # API para agentes
│   ├── game-store.ts        # Almacenamiento en memoria
│   └── utils.ts             # Utilidades
└── scripts/                 # Scripts CLI (opcional)
    └── terminal-game.ts     # Juego de terminal
```

## 🎮 Modos de Juego

### 1. Juego Visual Interactivo

1. Ve a [http://localhost:3000](http://localhost:3000)
2. Click en "Iniciar Juego"
3. Juega manualmente o activa el "Auto-Play" para ver a los agentes jugar

### 2. Auto-Play Mode

Los agentes juegan automáticamente cada turno:

1. Crea un juego
2. Activa el botón "Auto-Play"
3. Los agentes tomarán decisiones automáticamente

### 3. API REST para Agentes Externos

#### Crear un juego

```bash
curl -X POST http://localhost:3000/api/game/create \
  -H "Content-Type: application/json" \
  -d '{"players": ["Agent_GPT4", "Agent_Claude", "Agent_Gemini"]}'
```

#### Obtener estado del juego para un agente

```bash
curl "http://localhost:3000/api/game/state?gameId=GAME_ID&playerId=player_0"
```

#### Ejecutar una acción

```bash
curl -X POST http://localhost:3000/api/game/action \
  -H "Content-Type: application/json" \
  -d '{
    "gameId": "GAME_ID",
    "playerId": "player_0",
    "action": {
      "type": "roll"
    }
  }'
```

## 🤖 Integración con LLMs

### Endpoint Especializado para LLMs

#### GET `/api/agent/llm` - Obtener prompt formateado

```bash
curl "http://localhost:3000/api/agent/llm?gameId=GAME_ID&playerId=player_0"
```

Retorna:
- `systemPrompt`: Instrucciones del juego para el LLM
- `gameState`: Estado completo del juego
- `instructions`: Acciones posibles

#### POST `/api/agent/llm` - Enviar decisión del LLM

```bash
curl -X POST http://localhost:3000/api/agent/llm \
  -H "Content-Type: application/json" \
  -d '{
    "gameId": "GAME_ID",
    "playerId": "player_0",
    "action": {
      "type": "build_settlement",
      "data": {"vertexId": "v_0.5_-0.5_0"}
    },
    "reasoning": "Construyo aquí porque tiene acceso a recursos variados"
  }'
```

### Ejemplo de Integración con OpenAI

```typescript
import OpenAI from 'openai';

const openai = new OpenAI();

async function playTurnWithGPT4(gameId: string, playerId: string) {
  // 1. Obtener estado del juego
  const response = await fetch(
    `http://localhost:3000/api/agent/llm?gameId=${gameId}&playerId=${playerId}`
  );
  const { systemPrompt, gameState, instructions } = await response.json();

  // 2. Consultar a GPT-4
  const completion = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      { role: 'system', content: systemPrompt },
      { 
        role: 'user', 
        content: `${instructions}\n\nGame State:\n${JSON.stringify(gameState, null, 2)}` 
      },
    ],
    response_format: { type: 'json_object' },
  });

  const decision = JSON.parse(completion.choices[0].message.content);

  // 3. Ejecutar la acción
  const actionResponse = await fetch('http://localhost:3000/api/agent/llm', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      gameId,
      playerId,
      action: decision,
      reasoning: decision.reasoning,
    }),
  });

  return await actionResponse.json();
}
```

## 🎯 Reglas del Juego

### Costos de Construcción

- **Camino**: 1 Madera + 1 Ladrillo
- **Asentamiento**: 1 Madera + 1 Ladrillo + 1 Oveja + 1 Trigo
- **Ciudad**: 2 Trigo + 3 Mineral

### Puntos de Victoria

- **Asentamiento**: 1 PV
- **Ciudad**: 2 PV
- **Camino Más Largo** (5+ caminos): 2 PV
- **Ejército Más Grande** (3+ caballeros): 2 PV

**Primer jugador en llegar a 10 PV gana!**

### Fases del Juego

1. **Setup** (2 rondas):
   - Cada jugador coloca 2 asentamientos y 2 caminos
   - Primera ronda: orden normal
   - Segunda ronda: orden inverso

2. **Juego Principal**:
   - Tirar dados
   - Recibir recursos según el número
   - Construir/Comerciar
   - Terminar turno

## 🛠 Tecnologías

- **Next.js 15** - App Router
- **React 18** - UI
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Shadcn UI** - Component library
- **Zustand** - State management (opcional)

## 📖 Documentación Adicional

- [API Documentation](./API.md) - API REST completa
- [Quick Start Guide](./QUICKSTART.md) - Guía de inicio rápido
- [Agent Examples](./examples/README.md) - Ejemplos de agentes

## 🚧 Próximas Características

- [ ] Websockets para actualizaciones en tiempo real
- [ ] Tarjetas de desarrollo
- [ ] Puertos marítimos (comercio 3:1 y 2:1)
- [ ] Sistema del ladrón (robber)
- [ ] Cálculo de camino más largo
- [ ] Persistencia con base de datos
- [ ] Autenticación de jugadores
- [ ] Salas multijugador

## 🤝 Contribuir

Las contribuciones son bienvenidas! Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 License

MIT

## 🙏 Créditos

Basado en el clásico juego de mesa "Settlers of Catan" de Klaus Teuber.

---

¡Construido con ❤️ para que los LLMs dominen el mundo... de Catán! 🎲🤖
