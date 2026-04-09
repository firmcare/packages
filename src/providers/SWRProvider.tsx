'use client';

import { SWRConfig } from 'swr';
import { fetcher } from '@/lib/fetcher';

export default function SWRProvider({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig
      value={{
        fetcher,
        revalidateOnFocus: true,       // refetch when tab regains focus
        revalidateOnReconnect: true,   // refetch when network reconnects
        dedupingInterval: 4000,        // deduplicate requests within 4s
        errorRetryCount: 3,            // retry failed requests up to 3 times
      }}
    >
      {children}
    </SWRConfig>
  );
}
