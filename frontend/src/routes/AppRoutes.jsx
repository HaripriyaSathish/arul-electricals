import { createBrowserRouter } from 'react-router-dom'
import Home from '../pages/Home'
import NotFound from '../pages/NotFound'
import Login from '../admin/pages/Login'
import ProtectedRoute from '../admin/ProtectedRoute'
import AdminLayout from '../admin/AdminLayout'
import Dashboard from '../admin/pages/Dashboard'
import SectionPage from '../admin/pages/SectionPage'
import MediaLibrary from '../admin/pages/MediaLibrary'
import ContactEnquiries from '../admin/pages/ContactEnquiries'
import SiteSettings from '../admin/pages/SiteSettings'
import Account from '../admin/pages/Account'
import { CONTENT_ORDER, PAGES } from '../admin/config/content'

const router = createBrowserRouter([
  { path: '/', element: <Home /> },
  { path: '/admin/login', element: <Login /> },
  {
    path: '/admin',
    element: <ProtectedRoute />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          { index: true, element: <Dashboard /> },
          ...[...CONTENT_ORDER, 'legal'].map((key) => ({ path: PAGES[key].path, element: <SectionPage key={key} pageKey={key} /> })),
          { path: 'media', element: <MediaLibrary /> },
          { path: 'enquiries', element: <ContactEnquiries /> },
          { path: 'settings', element: <SiteSettings /> },
          { path: 'account', element: <Account /> },
          { path: '*', element: <NotFound admin /> },
        ],
      },
    ],
  },
  { path: '*', element: <NotFound /> },
])

export default router
