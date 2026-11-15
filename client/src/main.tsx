import { lazy, StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import '@/index.css';
import '@/i18n';
import App from '@/App.tsx';
import { ChakraProvider } from '@chakra-ui/react';
import { appTheme } from '@/theme';
import { ColorModeProvider } from '@/shared/context/ColorModeContext';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/shared/config/queryClientConfig';

const ReactQueryDevtools = import.meta.env.DEV
    ? lazy(async () => {
          const devtoolsModule = await import('@tanstack/react-query-devtools');
          return { default: devtoolsModule.ReactQueryDevtools };
      })
    : null;

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <QueryClientProvider client={queryClient}>
            <ChakraProvider value={appTheme}>
                <ColorModeProvider>
                    <App />
                </ColorModeProvider>
            </ChakraProvider>
            {ReactQueryDevtools && (
                <Suspense fallback={null}>
                    <ReactQueryDevtools initialIsOpen={false} />
                </Suspense>
            )}
        </QueryClientProvider>
    </StrictMode>,
);
