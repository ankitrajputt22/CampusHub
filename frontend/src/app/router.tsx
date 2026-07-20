import { Navigate, createBrowserRouter } from 'react-router-dom';

import { AdminShell } from '../features/admin/components/AdminShell';
import { AdminDashboardPage } from '../features/admin/pages/AdminDashboardPage';
import {
  AdminCategoriesPage,
  AdminCollegesPage,
  AdminListingsPage,
  AdminOrdersPage,
  AdminPaymentsPage,
  AdminReportsPage,
  AdminReviewsPage,
  AdminUsersPage,
} from '../features/admin/pages/AdminSectionPages';
import { authRoutes } from '../features/auth/routes/authRoutes';
import {
  AboutPage,
  ContactSupportPage,
  PrivacyPolicyPage,
  PublicShell,
  RefundPolicyPage,
  SafetyGuidelinesPage,
  TermsPage,
} from '../features/legal/pages/PublicPages';
import { ExploreCollegesPage } from '../features/marketplace/pages/ExploreCollegesPage';
import { ListingDetailsPage } from '../features/marketplace/pages/ListingDetailsPage';
import { MarketplacePage } from '../features/marketplace/pages/MarketplacePage';
import { MyMarketplacePage } from '../features/marketplace/pages/MyMarketplacePage';
import { SellItemPage } from '../features/marketplace/pages/SellItemPage';
import { StudentShell } from '../features/student/components/StudentShell';
import {
  ChatPage,
  NotificationsPage,
  OrdersPage,
  PaymentsPage,
  ReviewsPage,
  WishlistPage,
} from '../features/student/pages/StudentActivityPages';
import {
  ProfilePage,
  SettingsPage,
} from '../features/student/pages/StudentAccountPages';
import { StudentDashboardPage } from '../features/student/pages/StudentDashboardPage';
import {
  SuperAdminAdminsPage,
  SuperAdminAnalyticsPage,
  SuperAdminCollegesPage,
  SuperAdminDashboardPage,
  SuperAdminSettingsPage,
} from '../features/super-admin/pages/SuperAdminPages';
import { App } from './App';
import { HomePage } from './HomePage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <HomePage /> },
      ...authRoutes,
      {
        element: <StudentShell />,
        children: [
          { path: 'student/dashboard', element: <StudentDashboardPage /> },
          { path: 'student/profile', element: <ProfilePage /> },
          { path: 'student/marketplace', element: <MarketplacePage /> },
          {
            path: 'student/explore-colleges',
            element: <ExploreCollegesPage />,
          },
          { path: 'student/sell', element: <SellItemPage /> },
          { path: 'student/my-marketplace', element: <MyMarketplacePage /> },
          { path: 'student/wishlist', element: <WishlistPage /> },
          { path: 'student/orders', element: <OrdersPage /> },
          { path: 'student/payments', element: <PaymentsPage /> },
          { path: 'student/reviews', element: <ReviewsPage /> },
          { path: 'student/notifications', element: <NotificationsPage /> },
          { path: 'student/settings', element: <SettingsPage /> },
          { path: 'student/chat', element: <ChatPage /> },
        ],
      },
      { path: 'listing/:id', element: <ListingDetailsPage /> },
      {
        element: <AdminShell />,
        children: [
          { path: 'admin/dashboard', element: <AdminDashboardPage /> },
          { path: 'admin/users', element: <AdminUsersPage /> },
          { path: 'admin/colleges', element: <AdminCollegesPage /> },
          { path: 'admin/listings', element: <AdminListingsPage /> },
          { path: 'admin/reports', element: <AdminReportsPage /> },
          { path: 'admin/orders', element: <AdminOrdersPage /> },
          { path: 'admin/payments', element: <AdminPaymentsPage /> },
          { path: 'admin/reviews', element: <AdminReviewsPage /> },
          { path: 'admin/categories', element: <AdminCategoriesPage /> },
        ],
      },
      {
        element: <AdminShell mode="super-admin" />,
        children: [
          {
            path: 'super-admin/dashboard',
            element: <SuperAdminDashboardPage />,
          },
          { path: 'super-admin/admins', element: <SuperAdminAdminsPage /> },
          { path: 'super-admin/colleges', element: <SuperAdminCollegesPage /> },
          {
            path: 'super-admin/analytics',
            element: <SuperAdminAnalyticsPage />,
          },
          { path: 'super-admin/settings', element: <SuperAdminSettingsPage /> },
        ],
      },
      {
        element: <PublicShell />,
        children: [
          { path: 'privacy-policy', element: <PrivacyPolicyPage /> },
          { path: 'terms-and-conditions', element: <TermsPage /> },
          { path: 'refund-policy', element: <RefundPolicyPage /> },
          { path: 'safety-guidelines', element: <SafetyGuidelinesPage /> },
          { path: 'contact-support', element: <ContactSupportPage /> },
          { path: 'about', element: <AboutPage /> },
        ],
      },
      { path: '*', element: <Navigate replace to="/login" /> },
    ],
  },
]);
