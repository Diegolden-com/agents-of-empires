# 🔧 Solución: Múltiples Instancias del Servidor

## Problema Detectado

El error `availableGames: Array(0)` indica que no hay juegos en el store. Esto puede ocurrir cuando hay **múltiples instancias del servidor Next.js** corriendo simultáneamente.

## ¿Por qué pasa esto?

Next.js almacena los juegos en memoria (un `Map`). Si hay múltiples instancias del servidor:
- El juego se crea en la instancia A
- El frontend busca el juego en la instancia B
- La instancia B no tiene el juego → `availableGames: Array(0)`

## Solución Inmediata

### 1. Detener todas las instancias

```bash
# Ver procesos de Next.js
ps aux | grep "next dev" | grep -v grep

# Matar todos los procesos de Next.js
pkill -f "next dev"
# O más específico:
killall node
```

### 2. Limpiar puertos

```bash
# Ver qué está usando el puerto 3000
lsof -ti:3000

# Matar el proceso en el puerto 3000
kill -9 $(lsof -ti:3000)
```

### 3. Reiniciar solo UNA instancia

```bash
# Asegúrate de estar en el directorio correcto
cd /Users/guty/Desktop/code/catan

# Limpiar caché de Next.js (opcional pero recomendado)
rm -rf .next

# Iniciar solo UNA instancia
npm run dev
```

## Verificación

Después de reiniciar, verifica:

1. **Solo una instancia corriendo:**
```bash
ps aux | grep "next dev" | grep -v grep
# Debería mostrar solo 1 proceso
```

2. **Crear un juego de prueba:**
```bash
npx tsx scripts/test-realtime-game.ts
```

3. **Verificar que el juego existe:**
```bash
curl http://localhost:3000/api/game/debug
```

Deberías ver el juego en la lista.

## Prevención

### Usar un script de inicio limpio

Crea un script `start-dev.sh`:

```bash
#!/bin/bash
# Detener cualquier instancia previa
pkill -f "next dev" 2>/dev/null
sleep 2

# Limpiar puerto si es necesario
lsof -ti:3000 | xargs kill -9 2>/dev/null
sleep 1

# Iniciar servidor
npm run dev
```

Hazlo ejecutable:
```bash
chmod +x start-dev.sh
```

Úsalo en lugar de `npm run dev`:
```bash
./start-dev.sh
```

## Alternativa: Usar un puerto diferente

Si necesitas múltiples instancias para desarrollo:

```bash
# Instancia 1
PORT=3000 npm run dev

# Instancia 2 (en otra terminal)
PORT=3001 npm run dev
```

Pero recuerda: **cada instancia tiene su propio store en memoria**.

## Debugging

Si el problema persiste después de reiniciar:

1. **Verifica los logs del servidor** cuando creas el juego:
   - Deberías ver: `🔗 Blockchain game session created: blockchain_2`
   - Deberías ver: `Total games in store: 1`

2. **Verifica inmediatamente después de crear:**
   ```bash
   curl http://localhost:3000/api/game/debug
   ```

3. **Verifica que el gameId sea correcto:**
   - El `gameId` en la respuesta debe ser `blockchain_2` (no solo `2`)
   - La URL debe ser `/game/blockchain_2`

## Nota sobre Producción

En producción, esto no debería ser un problema porque:
- Solo hay una instancia del servidor
- O usas un store compartido (base de datos, Redis, etc.)

Para desarrollo local, asegúrate de tener solo una instancia corriendo.

