'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export function useAuthGuard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (status === 'authenticated') {
      setIsReady(true);
    } else if (status === 'unauthenticated') {
      fetch('/api/auth/me')
        .then((r) => {
          if (r.ok) {
            setIsReady(true);
          } else {
            router.push('/login');
          }
        })
        .catch(() => router.push('/login'));
    }
  }, [status, router]);

  const isLoading = status === 'loading' || (status === 'unauthenticated' && !isReady);

  return { session, status, isReady, isLoading };
}
