'use client';

import { usePrivy } from '@privy-io/react-auth';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export function Navbar() {
  const { ready, authenticated, user, login, logout } = usePrivy();

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <nav className="border-b bg-white">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="text-xl font-bold text-primary">
            🎲 Agents of Catan
          </Link>

          <div className="flex items-center gap-4">
            {ready && !authenticated && (
              <Button onClick={login} variant="default">
                Conectar Wallet
              </Button>
            )}

            {ready && authenticated && user && (
              <div className="flex items-center gap-3">
                <div className="text-sm">
                  <div className="font-medium">
                    {formatAddress(user.wallet?.address || '')}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {user.wallet?.chainType === 'ethereum' ? 'EVM' : user.wallet?.chainType}
                  </div>
                </div>
                <Button onClick={logout} variant="outline" size="sm">
                  Desconectar
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

