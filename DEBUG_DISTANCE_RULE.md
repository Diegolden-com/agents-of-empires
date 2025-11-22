# 🐛 Debug: Regla de Distancia no Funciona

## 🔍 Problema Actual

Los asentamientos se están colocando **uno al lado del otro** (en vértices adyacentes), violando la regla de Catan que requiere **mínimo 1 arista libre entre asentamientos**.

En la imagen que compartiste veo dos asentamientos (rojo y azul) que están MUY cerca.

---

## ✅ Cambios Aplicados

He agregado **logging extensivo** para entender exactamente qué está pasando:

### 1. Logs en `buildSettlement()`

Cada vez que se intenta construir un asentamiento, verás:

```
🏗️  Attempting to build settlement for [Player] at vertex [ID]
   Phase: setup_settlement_1, Buildings on board: 0

🔍 Distance check for vertex v_0.5_-0.5_0:
   Adjacent vertices (3): ['v_1_-1_0', 'v_0_0_-1', 'v_0.5_0_-0.5']
   Result: ✅ VALID

✅ Settlement built by [Player] on vertex [ID]
```

O si viola la regla:

```
🏗️  Attempting to build settlement for [Player] at vertex [ID]
   Phase: setup_settlement_1, Buildings on board: 1

🔍 Distance check for vertex v_1_-1_0:
   Adjacent vertices (3): ['v_0.5_-0.5_0', ...]
   ❌ Adjacent vertex v_0.5_-0.5_0 has settlement owned by player_0
   Result: ❌ VIOLATES DISTANCE RULE

❌ Settlement build failed: Too close to another settlement (distance rule)
```

### 2. Logs en `getGameStateForAgent()`

Cuando un agente pide la lista de posiciones disponibles:

```
🏠 Filtering available vertices. Current buildings on board: 2
   Total vertices: 54
   Occupied: 2
   Available (after distance check): 46
```

---

## 🧪 Cómo Probar

### Paso 1: Verificar que el Servidor Está Corriendo

Espera unos 5-10 segundos después de que yo reinicié el servidor.

```bash
# Verifica que solo hay UN servidor corriendo:
ps aux | grep "next dev" | grep -v grep | wc -l
# Debería mostrar: 1
```

### Paso 2: Abrir el Juego en el Navegador

Abre una pestaña NUEVA (no uses la vieja):

```
http://localhost:3000/ai-battle
```

### Paso 3: Crear un Juego NUEVO

1. Click en "Create New Game"
2. Elige 3 agentes
3. Click "Start Game"

### Paso 4: Observar la Consola del Servidor

En la terminal donde corre `npm run dev`, deberías ver logs como:

```
🏠 Filtering available vertices. Current buildings on board: 0
   Total vertices: 54
   Occupied: 0
   Available (after distance check): 54

🏗️  Attempting to build settlement for El Arquitecto at vertex v_1_0_-1
   Phase: setup_settlement_1, Buildings on board: 0

🔍 Distance check for vertex v_1_0_-1:
   Adjacent vertices (3): ['v_0.5_0.5_-1', 'v_1_-1_0', 'v_0.5_0_-0.5']
   Result: ✅ VALID

✅ Settlement built by El Arquitecto on vertex v_1_0_-1

🏠 Filtering available vertices. Current buildings on board: 1
   Total vertices: 54
   Occupied: 1
   Available (after distance check): 51  ← Debe REDUCIR porque hay building
```

---

## 🔎 Qué Buscar en los Logs

### ✅ Comportamiento CORRECTO:

1. **Cada vez que se construye un asentamiento:**
   - El número de "Buildings on board" debe incrementar: 0 → 1 → 2 → 3...
   - El número de "Available" debe REDUCIR cada vez

2. **Al filtrar vertices:**
   ```
   Available (after distance check): 54  // Primer turno
   Available (after distance check): 51  // Después del 1er asentamiento (pierde 3: el ocupado + 2 adyacentes)
   Available (after distance check): 48  // Después del 2do asentamiento
   ```

3. **Si un agente intenta construir muy cerca:**
   ```
   ❌ Adjacent vertex v_X has settlement owned by player_Y
   ❌ Settlement build failed: Too close to another settlement
   ```

### ❌ Comportamiento INCORRECTO (Bug):

1. **Si el número de "Available" NO reduce:**
   ```
   Available (after distance check): 54
   [construye asentamiento]
   Available (after distance check): 54  ← ⚠️ DEBERÍA SER MENOS!
   ```
   → Esto significa que el filtro NO está funcionando

2. **Si NO aparece el log de distance check:**
   ```
   🏗️  Attempting to build settlement...
   ✅ Settlement built...
   ```
   → Sin el log "🔍 Distance check", significa que la validación NO se está ejecutando

3. **Si pasa la validación con vecinos ocupados:**
   ```
   🔍 Distance check for vertex v_X:
      Adjacent vertices (3): ['v_Y', 'v_Z', 'v_W']
      Result: ✅ VALID  ← ⚠️ PERO v_Y tiene un asentamiento!
   ```
   → Esto significa que el código de validación tiene un bug

---

## 📋 Checklist de Diagnóstico

Después de crear un juego, verifica:

- [ ] Los logs aparecen en la consola del servidor
- [ ] El número "Buildings on board" incrementa con cada asentamiento
- [ ] El número "Available" DISMINUYE con cada asentamiento
- [ ] Aparece "🔍 Distance check" antes de cada construcción
- [ ] Si hay edificios adyacentes, aparece "❌ Adjacent vertex has settlement"
- [ ] Los asentamientos en el tablero NO están en vértices adyacentes

---

## 🎯 Próximos Pasos

### Si los logs muestran que la validación funciona PERO el tablero tiene asentamientos adyacentes:

→ El problema puede ser que el juego que estás viendo es viejo (de antes del fix). Crea un juego COMPLETAMENTE NUEVO.

### Si los logs muestran "✅ VALID" cuando hay vecinos ocupados:

→ Hay un bug en la función `isVertexDistanceValid()`. Comparte los logs conmigo y lo arreglo.

### Si los logs NO aparecen:

→ El servidor no se reinició correctamente. Ejecuta:

```bash
pkill -f "next dev"
cd /Users/guty/Desktop/code/catan
npm run dev
```

Y espera a ver:
```
✓ Ready in XXXXms
```

Luego abre http://localhost:3000/ai-battle

---

## 📊 Ejemplo de Logs Correctos

```
🏠 Filtering available vertices. Current buildings on board: 0
   Total vertices: 54
   Occupied: 0
   Available (after distance check): 54

🏗️  Attempting to build settlement for El Arquitecto at vertex v_1_0_-1
   Phase: setup_settlement_1, Buildings on board: 0

🔍 Distance check for vertex v_1_0_-1:
   Adjacent vertices (3): ['v_0.5_0.5_-1', 'v_1_-1_0', 'v_0.5_0_-0.5']
   Result: ✅ VALID

✅ Settlement built by El Arquitecto on vertex v_1_0_-1

🏠 Filtering available vertices. Current buildings on board: 1
   Total vertices: 54
   Occupied: 1
   Available (after distance check): 51  ← Redujo de 54 a 51 (perdió 3 vértices)

🏗️  Attempting to build settlement for El Mercader at vertex v_-1_1_0
   Phase: setup_settlement_1, Buildings on board: 1

🔍 Distance check for vertex v_-1_1_0:
   Adjacent vertices (3): ['v_-0.5_0.5_0', 'v_-1_0.5_0.5', 'v_-0.5_0_0.5']
   Result: ✅ VALID

✅ Settlement built by El Mercader on vertex v_-1_1_0

🏠 Filtering available vertices. Current buildings on board: 2
   Total vertices: 54
   Occupied: 2
   Available (after distance check): 48  ← Redujo de 51 a 48 (perdió 3 más)
```

---

## 🆘 Si Nada Funciona

Toma una captura de pantalla de:
1. La consola del servidor con los logs
2. El tablero del juego mostrando los asentamientos adyacentes

Y compártelo conmigo. Con esa información puedo identificar exactamente dónde está el problema.

---

**Servidor reiniciado:** ✅  
**Logging agregado:** ✅  
**Listo para probar:** ✅  

**URL:** http://localhost:3000/ai-battle

