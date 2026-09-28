import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@/index.css';
import '@/i18n';
import App from '@/App.tsx';
import { ChakraProvider } from '@chakra-ui/react';
import 'react-datepicker/dist/react-datepicker.css';
import { appTheme } from '@/theme';
import { ColorModeProvider } from '@/shared/context/ColorModeContext';

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <ChakraProvider value={appTheme}>
            <ColorModeProvider>
                <App />
            </ColorModeProvider>
        </ChakraProvider>
    </StrictMode>,
);
