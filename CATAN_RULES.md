# 🎲 Reglas Oficiales de Catan - Para Agentes LLM

## 🎯 OBJETIVO DEL JUEGO
Ser el **primer jugador en alcanzar 10 PUNTOS DE VICTORIA**.

---

## 📊 PUNTOS DE VICTORIA

| Elemento | Puntos |
|----------|--------|
| Asentamiento (Settlement) | 1 VP |
| Ciudad (City) | 2 VP |
| Carretera Más Larga (5+ carreteras conectadas) | 2 VP |
| Ejército Más Grande (3+ caballeros) | 2 VP |

---

## 🏗️ REGLAS DE CONSTRUCCIÓN (CRÍTICAS - LEER CUIDADOSAMENTE)

### 🏠 ASENTAMIENTOS (Settlements)

#### Costo
- **Setup**: GRATIS (no requiere recursos)
- **Juego Normal**: 1 Madera + 1 Ladrillo + 1 Oveja + 1 Trigo

#### Reglas de Colocación (ESTRICTAS)
1. **REGLA DE DISTANCIA** ⚠️ (LA MÁS IMPORTANTE):
   - Un asentamiento DEBE estar separado de CUALQUIER otro asentamiento (propio o de oponentes) por AL MENOS 2 ARISTAS (edges).
   - En otras palabras: NO puede haber asentamientos en vértices ADYACENTES.
   - Si hay un asentamiento en un vértice, TODOS los vértices directamente conectados a él por una arista están BLOQUEADOS.

2. **Conexión a Carreteras** (Solo en juego normal, NO en setup):
   - El asentamiento DEBE estar conectado a una de TUS carreteras.
   - NO puedes construir en un vértice sin tener una carretera tuya que llegue ahí.

3. **No Construir en Espacios Ocupados**:
   - Si un vértice ya tiene un asentamiento o ciudad (de cualquier jugador), NO puedes construir ahí.

#### Producción
- Cuando se tira el dado y sale el número de un hexágono adyacente al asentamiento, recibes **1 recurso** del tipo de ese hexágono.

---

### 🛣️ CARRETERAS (Roads)

#### Costo
- **Setup**: GRATIS (no requiere recursos)
- **Juego Normal**: 1 Madera + 1 Ladrillo

#### Reglas de Colocación (ESTRICTAS)
1. **Conexión Obligatoria**:
   - Una carretera DEBE conectarse a:
     - Una de TUS carreteras existentes, O
     - Uno de TUS asentamientos/ciudades

2. **Setup Especial** ⚠️:
   - En las fases `setup_road_1` y `setup_road_2`:
   - La carretera DEBE conectarse al **ÚLTIMO asentamiento** que acabas de construir.
   - NO puede conectarse a cualquier asentamiento tuyo, solo al más reciente.

3. **No Construir en Espacios Ocupados**:
   - Si una arista (edge) ya tiene una carretera (de cualquier jugador), NO puedes construir ahí.

4. **Límite**: Cada jugador tiene 15 carreteras máximo.

---

### 🏛️ CIUDADES (Cities)

#### Costo
- 2 Trigo + 3 Mineral

#### Reglas de Colocación
1. **Solo sobre TUS asentamientos**:
   - Una ciudad REEMPLAZA uno de tus asentamientos existentes.
   - NO puedes construir una ciudad directamente en un vértice vacío.
   - NO puedes convertir el asentamiento de otro jugador en ciudad.

2. **Producción mejorada**:
   - Una ciudad produce **2 recursos** en vez de 1 cuando se tira el dado.

3. **Límite**: Cada jugador tiene 4 ciudades máximo.

---

## 🎮 FASES DEL JUEGO

### Fase 1: SETUP (Configuración Inicial)

El juego comienza con 4 sub-fases de setup para cada jugador:

1. **setup_settlement_1**: Colocar primer asentamiento
   - Acción válida: `build_settlement`
   - NO cuesta recursos
   - Aplica REGLA DE DISTANCIA
   
2. **setup_road_1**: Colocar primera carretera
   - Acción válida: `build_road`
   - NO cuesta recursos
   - DEBE conectar al asentamiento que acabas de construir en paso 1

3. **setup_settlement_2**: Colocar segundo asentamiento
   - Acción válida: `build_settlement`
   - NO cuesta recursos
   - Aplica REGLA DE DISTANCIA
   
4. **setup_road_2**: Colocar segunda carretera
   - Acción válida: `build_road`
   - NO cuesta recursos
   - DEBE conectar al asentamiento que acabas de construir en paso 3

⚠️ **IMPORTANTE EN SETUP**:
- NO puedes hacer `end_turn` - DEBES construir
- NO puedes hacer otras acciones - solo la construcción obligatoria
- La construcción es GRATIS (no necesitas recursos)

### Fase 2: JUEGO NORMAL

Cada turno tiene 2 sub-fases:

1. **dice_roll**: Tirar los dados
   - Acción válida: `roll`
   - Se distribuyen recursos según el resultado

2. **main**: Tu turno principal
   - Acciones válidas:
     - `build_road` (si tienes recursos)
     - `build_settlement` (si tienes recursos y conexión)
     - `build_city` (si tienes recursos y un asentamiento)
     - `trade_bank` (intercambiar 4:1 con el banco)
     - `end_turn` (terminar tu turno)

---

## 🎲 DADOS Y PRODUCCIÓN

### Probabilidades de los Dados

| Número | Probabilidad | Frecuencia |
|--------|--------------|------------|
| 6, 8 | 13.9% | ⭐⭐⭐⭐⭐ Más frecuentes |
| 5, 9 | 11.1% | ⭐⭐⭐⭐ Muy bueno |
| 4, 10 | 8.3% | ⭐⭐⭐ Bueno |
| 3, 11 | 5.6% | ⭐⭐ Raro |
| 2, 12 | 2.8% | ⭐ Muy raro |

### Producción de Recursos

Cuando se tiran los dados:
1. Se suma el resultado de ambos dados
2. Todos los hexágonos con ese número producen
3. Los jugadores con asentamientos/ciudades adyacentes reciben recursos:
   - Asentamiento: 1 recurso
   - Ciudad: 2 recursos

### El 7 (Ladrón)
- Si sale un 7, NO se producen recursos
- El ladrón se activa (actualmente no implementado en tu versión)

---

## 🔄 COMERCIO

### Comercio con el Banco
- Ratio estándar: **4:1**
- Das 4 recursos del mismo tipo
- Recibes 1 recurso de cualquier otro tipo

### Puertos (No implementado aún)
- Puerto genérico: 3:1
- Puerto específico: 2:1 para ese recurso

---

## ✅ ACCIONES VÁLIDAS POR FASE

### En `setup_settlement_1` o `setup_settlement_2`:
```json
{
  "action": "build_settlement",
  "data": { "vertexId": "v_X_Y_Z" }
}
```

### En `setup_road_1` o `setup_road_2`:
```json
{
  "action": "build_road",
  "data": { "edgeId": "e_v_X1_Y1_Z1_v_X2_Y2_Z2" }
}
```

### En `dice_roll`:
```json
{
  "action": "roll"
}
```

### En `main`:
```json
// Construir carretera
{
  "action": "build_road",
  "data": { "edgeId": "e_..." }
}

// Construir asentamiento
{
  "action": "build_settlement",
  "data": { "vertexId": "v_..." }
}

// Construir ciudad
{
  "action": "build_city",
  "data": { "vertexId": "v_..." }  // Vértice con TU asentamiento
}

// Comerciar con banco
{
  "action": "trade_bank",
  "data": {
    "give": { "wood": 4 },
    "receive": "brick"
  }
}

// Terminar turno
{
  "action": "end_turn"
}
```

---

## ❌ ERRORES COMUNES QUE DEBES EVITAR

1. **Construir asentamientos muy cerca**:
   - ❌ MAL: Construir en un vértice adyacente a otro asentamiento
   - ✅ BIEN: Dejar al menos 2 aristas de distancia

2. **Carreteras desconectadas**:
   - ❌ MAL: Construir una carretera que no conecta a tus estructuras
   - ✅ BIEN: La carretera se extiende desde tus carreteras/asentamientos

3. **Carreteras en setup mal colocadas**:
   - ❌ MAL: Conectar la carretera a tu primer asentamiento cuando estás en setup_road_2
   - ✅ BIEN: Conectar a tu ÚLTIMO asentamiento (el más reciente)

4. **Intentar hacer end_turn en setup**:
   - ❌ MAL: `{"action": "end_turn"}` en fase setup_settlement_1
   - ✅ BIEN: `{"action": "build_settlement", "data": {...}}` siempre en setup

5. **Construir en espacios ocupados**:
   - ❌ MAL: Intentar construir donde ya hay algo
   - ✅ BIEN: Solo usar los IDs de la lista de posiciones disponibles

6. **Usar nombres de acción incorrectos**:
   - ❌ MAL: `{"action": "setup_settlement"}` 
   - ✅ BIEN: `{"action": "build_settlement"}` (incluso en setup)

---

## 🎯 ESTRATEGIA BÁSICA

1. **En Setup**:
   - Prioriza hexágonos con números 6 y 8
   - Busca diversidad de recursos
   - Deja espacio para expandirte

2. **Juego Temprano**:
   - Construye más asentamientos antes que ciudades
   - Expande tu red de carreteras
   - Comercia excesos de recursos

3. **Juego Medio**:
   - Actualiza asentamientos a ciudades
   - Busca la carretera más larga si es posible
   - Bloquea a oponentes cerca de victoria

4. **Juego Final**:
   - Cuenta los VP de todos
   - Calcula tu ruta más rápida a 10 VP
   - Bloquea al líder si no eres tú

---

## 📋 RESUMEN: CHECKLIST ANTES DE DECIDIR

Antes de tomar una decisión, verifica:

- [ ] ¿Estoy en la fase correcta?
- [ ] ¿Esta acción es válida en esta fase?
- [ ] ¿Tengo los recursos necesarios? (si no es setup)
- [ ] ¿El vértice/arista está disponible?
- [ ] ¿Cumplo con la REGLA DE DISTANCIA? (para asentamientos)
- [ ] ¿Mi carretera conecta a mis estructuras? (especialmente en setup)
- [ ] ¿Estoy usando el formato JSON correcto?
- [ ] ¿Estoy usando los IDs exactos de las listas disponibles?

---

## 🚨 REGLAS ABSOLUTAS (NUNCA VIOLAR)

1. **REGLA DE DISTANCIA**: Asentamientos NUNCA en vértices adyacentes
2. **CONEXIÓN EN SETUP**: Carreteras en setup SIEMPRE al último asentamiento
3. **NO CONSTRUIR EN OCUPADO**: Nunca construir donde ya hay algo
4. **ACCIÓN CORRECTA**: Usar siempre `build_settlement`, `build_road`, etc. (NO `setup_settlement`)
5. **NO END_TURN EN SETUP**: En setup DEBES construir, no puedes terminar turno
6. **USAR IDS DE LA LISTA**: Solo usar vertexId/edgeId que te dan en la lista de disponibles

---

**¿Dudas?** Cuando no estés seguro, pregunta en tu `reasoning` y elige la opción más conservadora que cumpla las reglas.

**Recuerda**: Es mejor hacer una jugada subóptima que cumpla las reglas, que intentar una jugada óptima que las viole. 🎯

