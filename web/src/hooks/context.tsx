import { createContext, ReactNode, useContext, useEffect, useState } from 'react';

type AppContextType = {
    openLogin: () => void;
    closeLogin: () => void;
    isLoginOpen: boolean;
    fontState: 'roboto' | 'rust';
    toggleFont: () => void;
    // Add more modal controls here as needed
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppWrapper = ({ children }: { children: ReactNode }) => {
    const [isLoginOpen, setIsLoginOpen] = useState(false);
    const [fontState, setFontState] = useState<'roboto' | 'rust'>('rust');

    const value = {
        openLogin: () => setIsLoginOpen(true),
        closeLogin: () => setIsLoginOpen(false),
        toggleFont: () => setFontState(fontState === 'roboto' ? 'rust' : 'roboto'),
        isLoginOpen,
        fontState,
        setFontState,
    };

    useEffect(() => {
        document.body.setAttribute('data-font', fontState);
    }, [fontState]);

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
    const context = useContext(AppContext);

    if (!context) {
        throw new Error('useApp must be used within an AppWrapper');
    }

    return context;
};
