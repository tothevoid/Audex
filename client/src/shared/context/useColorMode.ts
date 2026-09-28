import { createContext, useContext } from 'react';
import { ColorMode, ResolvedColorMode } from '@/theme/types';

export interface ColorModeContextType {
    colorMode: ColorMode;
    resolvedColorMode: ResolvedColorMode;
    setColorMode: (mode: ColorMode) => void;
    toggleColorMode: () => void;
}

export const ColorModeContext = createContext<ColorModeContextType | undefined>(undefined);

export const useColorMode = (): ColorModeContextType => {
    const context = useContext(ColorModeContext);
    if (!context) {
        throw new Error('useColorMode must be used within a ColorModeProvider');
    }
    return context;
};
