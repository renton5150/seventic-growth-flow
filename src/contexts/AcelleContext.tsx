
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { AcelleAccount } from '@/types/acelle.types';

interface AcelleContextType {
  selectedAccount: AcelleAccount | null;
  setSelectedAccount: (account: AcelleAccount | null) => void;
  demoMode: boolean;
  setDemoMode: (isDemo: boolean) => void;
}

// Context with default values
const AcelleContext = createContext<AcelleContextType>({
  selectedAccount: null,
  setSelectedAccount: () => {},
  demoMode: false,
  setDemoMode: () => {}
});

interface AcelleProviderProps {
  children: ReactNode;
}

export const AcelleProvider = ({ children }: AcelleProviderProps) => {
  const [selectedAccount, setSelectedAccount] = useState<AcelleAccount | null>(null);
  const [demoMode, setDemoMode] = useState<boolean>(false);

  return (
    <AcelleContext.Provider
      value={{
        selectedAccount,
        setSelectedAccount,
        demoMode,
        setDemoMode
      }}
    >
      {children}
    </AcelleContext.Provider>
  );
};

export const useAcelleContext = () => useContext(AcelleContext);
