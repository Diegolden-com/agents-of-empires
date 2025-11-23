'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BlockchainMetadata } from '@/lib/types';
import { ExternalLink } from 'lucide-react';

interface BlockchainInfoProps {
  metadata: BlockchainMetadata;
}

const STATUS_LABELS: Record<number, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  0: { label: 'Esperando Aleatoriedad', variant: 'secondary' },
  1: { label: 'Activo', variant: 'default' },
  2: { label: 'Finalizado', variant: 'outline' },
  3: { label: 'Cancelado', variant: 'destructive' },
};

export function BlockchainInfo({ metadata }: BlockchainInfoProps) {
  const statusInfo = STATUS_LABELS[metadata.status] || { label: 'Desconocido', variant: 'outline' as const };
  
  // Formatear la cantidad depositada (convertir de wei a ETH)
  const depositInEth = (BigInt(metadata.deposit) / BigInt(10 ** 18)).toString();
  const depositFormatted = parseFloat(depositInEth) > 0 
    ? `${depositInEth} ETH` 
    : `${metadata.deposit} wei`;

  // Formatear el timestamp
  const startDate = new Date(parseInt(metadata.startTime) * 1000);
  const dateFormatted = startDate.toLocaleString('es-ES', {
    dateStyle: 'short',
    timeStyle: 'short',
  });

  return (
    <Card className="border-purple-300 bg-gradient-to-br from-purple-50 to-blue-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="text-lg">⛓️ Información del Blockchain</span>
          <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Game ID (Blockchain)</p>
            <p className="font-mono font-semibold">#{metadata.gameId}</p>
          </div>
          
          <div>
            <p className="text-muted-foreground">Fecha de Inicio</p>
            <p className="font-semibold">{dateFormatted}</p>
          </div>

          <div className="col-span-2">
            <p className="text-muted-foreground">Apostador</p>
            <p className="font-mono text-xs break-all">{metadata.bettor}</p>
          </div>

          <div>
            <p className="text-muted-foreground">Depósito</p>
            <p className="font-semibold">{depositFormatted}</p>
          </div>

          <div>
            <p className="text-muted-foreground">Jugador Elegido</p>
            <p className="font-semibold">Jugador #{metadata.bettorChoice + 1}</p>
          </div>

          <div className="col-span-2">
            <p className="text-muted-foreground">Request ID (VRF)</p>
            <p className="font-mono text-xs">{metadata.requestId}</p>
          </div>
        </div>

        <div className="pt-2 border-t">
          <a
            href={`https://testnet.explorer.chain.link`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            Ver en Chainlink Explorer
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </CardContent>
    </Card>
  );
}

