import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import './i18n';
import App from './App.tsx';
import { Box, ChakraProvider, Theme } from '@chakra-ui/react';
import 'react-datepicker/dist/react-datepicker.css';
import { appTheme } from './theme';
import { ColorModeProvider, useColorMode } from './shared/context/ColorModeContext';

const AppRoot = () => {
    const { resolvedColorMode } = useColorMode();

    return (
        <Theme appearance={resolvedColorMode} hasBackground={false}>
            <Box backgroundColor="background_main" minH="100vh">
                <App />
            </Box>
        </Theme>
    );
};

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <ChakraProvider value={appTheme}>
            <ColorModeProvider>
                <AppRoot />
            </ColorModeProvider>
        </ChakraProvider>
    </StrictMode>,
);
