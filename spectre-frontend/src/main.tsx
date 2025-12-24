import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './api/init.ts'
import { RouterProvider } from 'react-router/dom'
import router from '@/pages/router.tsx'
import { HeroUIProvider, ToastProvider } from '@heroui/react'
import SvgSymbols from '@/components/icon/svg-symbols.tsx'
import DialogProvider from '@/components/DialogProvider/DialogProvider.tsx'
import { Provider } from 'react-redux'
import { store, persistor } from '@/store'
import { PersistGate } from 'redux-persist/integration/react'
import '@/i18n'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <PersistGate persistor={persistor}>
        <HeroUIProvider>
          <SvgSymbols />
          <DialogProvider />
          <ToastProvider placement="top-center" />
          <RouterProvider router={router} />
        </HeroUIProvider>
      </PersistGate>
    </Provider>
  </StrictMode>,
)
