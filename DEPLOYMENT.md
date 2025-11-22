# 🚀 Deployment Guide

Guía para desplegar Catan LLM Agent Edition en producción.

## Vercel (Recomendado)

### 1. Preparación

```bash
npm install -g vercel
```

### 2. Deploy

```bash
vercel
```

Sigue las instrucciones. Vercel detectará automáticamente que es un proyecto Next.js.

### 3. Variables de Entorno (Opcional)

Si usas agentes LLM externos:

```bash
vercel env add OPENAI_API_KEY
vercel env add ANTHROPIC_API_KEY
```

## Docker

### Dockerfile

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

### Build y Run

```bash
docker build -t catan-llm .
docker run -p 3000:3000 catan-llm
```

## AWS / Google Cloud / Azure

### 1. Build

```bash
npm run build
```

### 2. Start

```bash
npm start
```

El servidor correrá en el puerto 3000 por defecto.

## Variables de Entorno en Producción

```bash
# Opcional - Solo para agentes LLM externos
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# Node Environment
NODE_ENV=production
```

## Optimizaciones de Producción

### 1. Caché de Imágenes

Next.js optimiza automáticamente las imágenes. No se requiere configuración adicional.

### 2. Almacenamiento Persistente

El juego actualmente usa almacenamiento en memoria. Para producción, considera:

- **Redis** para sesiones de juego
- **PostgreSQL/MongoDB** para persistencia
- **Supabase** (recomendado según las reglas del usuario)

### 3. Rate Limiting

Implementa rate limiting para las API routes:

```typescript
// lib/rate-limit.ts
import { LRUCache } from 'lru-cache';

const rateLimitCache = new LRUCache({
  max: 500,
  ttl: 60000, // 1 minuto
});

export function rateLimit(identifier: string, limit: number = 10) {
  const count = (rateLimitCache.get(identifier) as number) || 0;
  
  if (count >= limit) {
    return false;
  }
  
  rateLimitCache.set(identifier, count + 1);
  return true;
}
```

### 4. Monitoring

Usa Vercel Analytics o implementa tu propio sistema:

```bash
npm install @vercel/analytics
```

```typescript
// app/layout.tsx
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

## Health Checks

### Endpoint de Health

```typescript
// app/api/health/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
}
```

## Backup y Recuperación

Si implementas persistencia:

1. **Backups automáticos** cada 24 horas
2. **Snapshots** antes de deploys
3. **Logs** centralizados con CloudWatch/Stackdriver

## Escalabilidad

### Horizontal Scaling

Para escalar horizontalmente, necesitas:

1. Almacenamiento compartido (Redis/DB)
2. Load balancer
3. Sesiones sin estado

### Ejemplo con Redis

```typescript
// lib/game-store.ts
import { createClient } from 'redis';

const redis = createClient({
  url: process.env.REDIS_URL,
});

await redis.connect();

export async function getGame(gameId: string) {
  const data = await redis.get(`game:${gameId}`);
  return data ? JSON.parse(data) : null;
}

export async function updateGame(gameId: string, state: GameState) {
  await redis.set(`game:${gameId}`, JSON.stringify(state), {
    EX: 3600, // TTL de 1 hora
  });
}
```

## Performance

### Métricas Clave

- **Time to First Byte (TTFB)**: < 200ms
- **First Contentful Paint (FCP)**: < 1.5s
- **Largest Contentful Paint (LCP)**: < 2.5s

### Optimizaciones

1. **Image Optimization**: Automático con Next.js
2. **Code Splitting**: Automático con Next.js
3. **Compression**: Habilita gzip/brotli en el servidor
4. **CDN**: Usa Vercel Edge Network o CloudFlare

## Seguridad

### Headers de Seguridad

```javascript
// next.config.mjs
const nextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
```

### CORS

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type');

  return response;
}

export const config = {
  matcher: '/api/:path*',
};
```

## Monitoreo en Producción

### Logging

```typescript
// lib/logger.ts
export function log(level: string, message: string, data?: any) {
  console.log(JSON.stringify({
    level,
    message,
    data,
    timestamp: new Date().toISOString(),
  }));
}
```

### Error Tracking

Usa Sentry o similar:

```bash
npm install @sentry/nextjs
```

```typescript
// sentry.client.config.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0,
});
```

---

¿Preguntas? Abre un issue en GitHub o consulta la documentación de Next.js.

