import { createContext, useContext, useState, ReactNode } from 'react';

type AppContextType = {
  openLogin: () => void;
  closeLogin: () => void;
  isLoginOpen: boolean;
  // Add more modal controls here as needed
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppWrapper = ({ children }: { children: ReactNode }) => {
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  const value = {
    openLogin: () => setIsLoginOpen(true),
    closeLogin: () => setIsLoginOpen(false),
    isLoginOpen,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppWrapper');
  }
  return context;
};
