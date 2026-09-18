import React, { createContext, useContext, useEffect, useState, useTransition } from 'react';
import { ColorMode, ResolvedColorMode } from '../../theme/types';

interface ColorModeContextType {
    colorMode: ColorMode;
    resolvedColorMode: ResolvedColorMode;
    setColorMode: (mode: ColorMode) => void;
    toggleColorMode: () => void;
}

const STORAGE_KEY = 'audex_theme';

const ColorModeContext = createContext<ColorModeContextType | undefined>(undefined);

const getSystemColorMode = (): ResolvedColorMode => {
    if (typeof window === 'undefined') return 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

const getInitialColorMode = (): ColorMode => {
    if (typeof window === 'undefined') return 'dark';
    const stored = localStorage.getItem(STORAGE_KEY) as ColorMode | null;
    if (stored === 'light' || stored === 'dark' || stored === 'system') {
        return stored;
    }
    return 'dark';
};

export const ColorModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [colorMode, setColorModeState] = useState<ColorMode>(getInitialColorMode);
    const [systemColorMode, setSystemColorMode] = useState<ResolvedColorMode>(getSystemColorMode);
    const [, startTransition] = useTransition();

    const resolvedColorMode: ResolvedColorMode = colorMode === 'system' ? systemColorMode : colorMode;

    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = (e: MediaQueryListEvent) => {
            setSystemColorMode(e.matches ? 'dark' : 'light');
        };

        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, []);

    useEffect(() => {
        const root = document.documentElement;
        root.setAttribute('data-theme', resolvedColorMode);
        root.style.colorScheme = resolvedColorMode;
        if (resolvedColorMode === 'dark') {
            root.classList.add('dark');
            root.classList.remove('light');
        } else {
            root.classList.add('light');
            root.classList.remove('dark');
        }
    }, [resolvedColorMode]);

    const setColorMode = (mode: ColorMode) => {
        startTransition(() => {
            setColorModeState(mode);
            localStorage.setItem(STORAGE_KEY, mode);
        });
    };

    const toggleColorMode = () => {
        setColorMode(
            colorMode === 'dark'
                ? 'light'
                : colorMode === 'light'
                ? 'system'
                : 'dark'
        );
    };

    return (
        <ColorModeContext.Provider
            value={{
                colorMode,
                resolvedColorMode,
                setColorMode,
                toggleColorMode,
            }}
        >
            {children}
        </ColorModeContext.Provider>
    );
};

export const useColorMode = (): ColorModeContextType => {
    const context = useContext(ColorModeContext);
    if (!context) {
        throw new Error('useColorMode must be used within a ColorModeProvider');
    }
    return context;
};
