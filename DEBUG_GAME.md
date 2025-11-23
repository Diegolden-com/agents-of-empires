# 🐛 Debug: Juego No Encontrado

## Problema

Cuando intentas abrir un juego creado desde el blockchain, aparece "Juego no encontrado".

## 🔍 Diagnóstico

### 1. Verificar que el juego existe

Abre en el navegador o con cURL:

```bash
# Ver todos los juegos activos
curl http://localhost:3000/api/game/debug
```

O en el navegador:
```
http://localhost:3000/api/game/debug
```

Esto te mostrará:
- Todos los juegos activos
- Sus IDs
- Si son juegos del blockchain
- Estado de cada juego

### 2. Verificar el Game ID

Cuando creas un juego desde el blockchain, la respuesta incluye:

```json
{
  "gameId": "blockchain_2",
  "blockchainGameId": "2"
}
```

**IMPORTANTE**: Usa el `gameId` (no el `blockchainGameId`) para acceder al juego.

URL correcta:
```
http://localhost:3000/game/blockchain_2
```

URL incorrecta:
```
http://localhost:3000/game/2  ❌
```

### 3. Verificar en la consola

Abre la consola del navegador (F12) y busca:

```
🔍 Loading game state for: blockchain_2
❌ Error response: 404
```

O si funciona:
```
🔍 Loading game state for: blockchain_2
✅ Game state loaded: { gameId: "blockchain_2", phase: "setup_settlement_1" }
```

### 4. Verificar en los logs del servidor

En la terminal donde corre `npm run dev`, deberías ver:

```
🔗 Creating game from blockchain: 2
🔗 Blockchain game session created: blockchain_2
   Blockchain Game ID: 2
   Bettor: 0x5ee75a1B1648C023e885E58bD3735Ae273f2cc52
```

Y cuando accedes al juego:
```
🔍 GET /api/game/blockchain_2
Getting game blockchain_2, available games: [ 'blockchain_2' ]
✅ Game found: blockchain_2, phase: setup_settlement_1
```

## 🔧 Soluciones Comunes

### Problema 1: Usar el ID incorrecto

**Síntoma**: El juego se crea pero no se encuentra

**Solución**: Asegúrate de usar el `gameId` completo (con prefijo `blockchain_`)

```javascript
// ✅ Correcto
const { gameId } = await response.json(); // "blockchain_2"
window.location.href = `/game/${gameId}`;

// ❌ Incorrecto
const { blockchainGameId } = await response.json(); // "2"
window.location.href = `/game/${blockchainGameId}`; // No funcionará
```

### Problema 2: El servidor se reinició

**Síntoma**: El juego existía pero ahora no se encuentra

**Solución**: Los juegos están en memoria. Si reinicias el servidor, se pierden. Vuelve a crear el juego.

### Problema 3: Error al crear el juego

**Síntoma**: La respuesta del POST no tiene `gameId`

**Solución**: Revisa los logs del servidor para ver el error:

```bash
# Ver logs en tiempo real
npm run dev
```

### Problema 4: URL mal formada

**Síntoma**: 404 en la página

**Solución**: Verifica que la URL sea correcta:

```
✅ http://localhost:3000/game/blockchain_2
❌ http://localhost:3000/game/blockchain_2/
❌ http://localhost:3000/game/2
```

## 🧪 Test Completo

Ejecuta este script para probar todo el flujo:

```bash
# Terminal 1: Iniciar servidor
npm run dev

# Terminal 2: Crear juego y verificar
npx tsx scripts/test-realtime-game.ts
```

El script debería:
1. ✅ Crear el juego
2. ✅ Mostrar el gameId
3. ✅ Verificar que existe
4. ✅ Mostrar la URL correcta

## 📊 Endpoints de Debug

### Ver todos los juegos
```
GET /api/game/debug
```

### Ver un juego específico
```
GET /api/game/{gameId}
```

### Crear un juego de prueba
```
POST /api/game/start
Content-Type: application/json
Body: (ver cre-catan/start-game/example-payload.json)
```

## 🔍 Checklist

Antes de reportar un problema, verifica:

- [ ] El servidor está corriendo (`npm run dev`)
- [ ] El juego se creó exitosamente (respuesta 200 del POST)
- [ ] Estás usando el `gameId` completo (con `blockchain_` prefix)
- [ ] La URL no tiene trailing slash
- [ ] Revisaste los logs del servidor
- [ ] Revisaste la consola del navegador
- [ ] Ejecutaste `/api/game/debug` para ver juegos activos

## 💡 Tips

1. **Siempre usa el `gameId` de la respuesta**, no el `blockchainGameId`
2. **Revisa la consola del navegador** para ver errores detallados
3. **Usa `/api/game/debug`** para ver qué juegos existen
4. **Los juegos se pierden al reiniciar el servidor** (están en memoria)

