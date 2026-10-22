/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Config separada do vite.config.ts para não carregar o plugin PWA durante os testes.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    restoreMocks: true,
    coverage: {
      provider: 'v8',
      include: [
        'src/utils/cheques.ts',
        'src/utils/navigation.ts',
        'src/pages/Relatorios/ChequesDashboard.tsx',
        'src/pages/Clientes/Clientes.tsx',
        'src/pages/Home/Home.tsx',
        'src/components/ErrorBoundary/ErrorBoundary.tsx',
        'src/App.tsx'
      ],
      reporter: ['text', 'html']
    }
  }
})
