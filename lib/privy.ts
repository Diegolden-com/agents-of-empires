import { PrivyClient } from '@privy-io/server-auth';

const PRIVY_APP_ID = process.env.PRIVY_API_KEY_APP_ID;
const PRIVY_APP_SECRET = process.env.PRIVY_API_KEY_SECRET_API;

if (!PRIVY_APP_ID || !PRIVY_APP_SECRET) {
  // Solo warn en desarrollo, en build puede que no estén
  if (process.env.NODE_ENV !== 'production') {
    console.warn('Missing Privy environment variables: PRIVY_API_KEY_APP_ID or PRIVY_API_KEY_SECRET_API');
  }
}

export const privy = new PrivyClient(PRIVY_APP_ID || '', PRIVY_APP_SECRET || '');

