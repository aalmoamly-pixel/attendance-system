import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { db } from '../lib/supabase';
import type { CMSData } from '../types/database';

interface CMSContextType {
  cmsData: CMSData | null;
  loading: boolean;
  refreshCMSData: () => Promise<void>;
  updateCMSData: (partialData: Partial<CMSData>) => Promise<void>;
}

const CMSContext = createContext<CMSContextType | undefined>(undefined);

export function CMSProvider({ children }: { children: ReactNode }) {
  const [cmsData, setCmsData] = useState<CMSData | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshCMSData = async () => {
    setLoading(true);
    try {
      const data = await db.getCMSData();
      setCmsData(data);
    } catch (err) {
      console.error('[CMS] Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateCMSData = async (partialData: Partial<CMSData>) => {
    const updated = await db.updateCMSData(partialData);
    setCmsData(updated);
  };

  useEffect(() => {
    refreshCMSData();
  }, []);

  return (
    <CMSContext.Provider value={{ cmsData, loading, refreshCMSData, updateCMSData }}>
      {children}
    </CMSContext.Provider>
  );
}

export function useCMS() {
  const context = useContext(CMSContext);
  if (context === undefined) {
    throw new Error('useCMS must be used within a CMSProvider');
  }
  return context;
}
