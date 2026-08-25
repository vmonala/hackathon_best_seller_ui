import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppLayout } from './components/AppLayout'
import { SegmentsPage } from './pages/SegmentsPage'
import { SegmentDetailPage } from './pages/SegmentDetailPage'
import { SellerInsightsPage } from './pages/SellerInsightsPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to="/segments" replace /> },
      { path: 'segments', element: <SegmentsPage /> },
      { path: 'segments/:id', element: <SegmentDetailPage /> },
      { path: 'seller-insights', element: <SellerInsightsPage /> },
      { path: '*', element: <Navigate to="/segments" replace /> },
    ],
  },
])
