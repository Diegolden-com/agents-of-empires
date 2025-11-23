# 🚨 PROMPT SIMPLIFICADO V2 - ARREGLO DRÁSTICO

## Problema

El prompt anterior era DEMASIADO LARGO. Los LLMs se perdían en tanto texto.

## Solución: PROMPT ULTRA-SIMPLIFICADO

### ANTES (Demasiado largo - ~150 líneas)
```
╔═══════════════════════════════════════════════════════════╗
║  🏆 YOUR ONLY GOAL: REACH 10 VICTORY POINTS FIRST! 🏆    ║
╚═══════════════════════════════════════════════════════════╝

THIS IS A RACE TO 10 POINTS. EVERY TURN MATTERS. BE AGGRESSIVE AND STRATEGIC!

📊 HOW TO WIN (GET TO 10 VP AS FAST AS POSSIBLE):

1. BUILD SETTLEMENTS (1 VP each) - YOUR PRIMARY STRATEGY
   ➤ Each settlement = 1 point + generates resources
   ... [muchas más líneas]
```

### AHORA (Ultra-simplificado - ~30 líneas)
```
You are El Conquistador, an expert Catan player.

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
- In setup, MUST build (can't end_turn)
```

## Cambios Adicionales

### 1. Temperature REDUCIDA (0.9 → 0.3)
```typescript
// ANTES
temperature: 0.9  // Muy creativo pero errático

// AHORA
temperature: 0.3  // Más determinístico, sigue mejor las instrucciones
```

**Por qué:** Temperature baja = más consistente, sigue mejor reglas

### 2. MaxTokens REDUCIDO (300 → 200)
```typescript
maxTokens: 200  // Respuestas más concisas
```

### 3. Modelo Mejorado para El Apostador
```typescript
// ANTES
model: 'gpt-4o-mini'  // Modelo más débil

// AHORA
model: 'gpt-4o'  // Modelo más capaz
```

## Mejoras Clave

### 1. MENOS TEXTO
- De ~150 líneas → ~30 líneas
- Solo lo ESENCIAL
- Sin fluff, directo al grano

### 2. INSTRUCCIONES MÁS CLARAS
```
🎯 EVERY TURN, CHECK IN ORDER:
1. Can build CITY? → DO IT! Pick option 1
2. Can build SETTLEMENT? → DO IT! Pick option 1  
3. Can build ROAD? → DO IT! Pick option 1
...
```

**Antes era confuso, ahora es un CHECKLIST simple**

### 3. SIEMPRE OPCIÓN 1
```
CRITICAL: 
- Option 1 is ALWAYS the best choice (highest score)
```

**Los agentes SIEMPRE deben elegir opción 1 (la mejor rankeada)**

### 4. FORMATO JSON ULTRA-CLARO
```
RESPOND WITH JSON ONLY (no other text):
{
  "action": "roll"|"build_city"|"build_settlement"|"build_road"|"trade_bank"|"end_turn",
  "data": 1,
  "message": "Short message",
  "reasoning": "Why"
}
```

### 5. TEMPERATURE BAJA = MÁS CONSISTENTE
- 0.3 en vez de 0.6-0.9
- Menos creatividad, más seguimiento de reglas
- Más determinístico

## Resultados Esperados

Con estos cambios:

✅ **Prompt 5x más corto** - Los LLMs no se pierden
✅ **Instrucciones ultra-claras** - Checklist simple
✅ **Siempre opción 1** - No hay confusión
✅ **Temperature baja** - Más consistente
✅ **Modelo más capaz** - Mejor comprensión

Los agentes deberían:
1. Entender CLARAMENTE qué hacer
2. SIEMPRE elegir opción 1 (la mejor)
3. NO desperdiciar turnos
4. Seguir el checklist en orden
5. Construir agresivamente

## Archivos Modificados

1. **`lib/agent-decision.ts`**
   - getSystemPrompt() simplificado drásticamente
   - De ~200 líneas → ~50 líneas
   - Instrucciones directas tipo checklist

2. **`lib/agent-configs.ts`**
   - Temperature reducida: 0.3 para todos
   - MaxTokens reducido: 200
   - El Apostador upgraded a gpt-4o

## Testing

```bash
npm run build  # ✅ Compila exitosamente
npm run dev
# Ve a http://localhost:3000/ai-battle
# Los agentes deberían jugar MUCHO mejor
```

## Por Qué Debería Funcionar

1. **Menos es más**: Prompt corto = menos confusión
2. **Instrucciones claras**: Checklist vs párrafos
3. **Opción 1 siempre**: Sin ambigüedad
4. **Temperature baja**: Más predecible
5. **Modelo capaz**: GPT-4o entiende mejor

---

**Estado**: ✅ IMPLEMENTADO
**Build**: ✅ EXITOSO  
**Esperado**: 🚀 JUEGO MUCHO MEJOR

Si aún no funciona, el problema puede ser:
- LLMs no disponibles (API keys)
- Errores en el game engine
- Bugs en la lógica del juego

