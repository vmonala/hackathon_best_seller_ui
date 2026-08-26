import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import * as Tooltip from '@radix-ui/react-tooltip'
import { RouterProvider } from 'react-router-dom'
import { router } from './router'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      refetchOnWindowFocus: false,
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <Tooltip.Provider delayDuration={200} skipDelayDuration={300}>
        <RouterProvider router={router} />
      </Tooltip.Provider>
    </QueryClientProvider>
  </React.StrictMode>,
)
