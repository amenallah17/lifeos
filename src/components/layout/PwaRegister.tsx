'use client';

import { useEffect } from 'react';

export default function PwaRegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // Service workers require HTTPS — silently ignore on file:// protocol
      });
    }
  }, []);

  return null;
}
