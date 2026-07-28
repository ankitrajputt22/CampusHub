import { Navigate, createBrowserRouter } from 'react-router-dom';

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
import { StudentShell } from '../features/student/components/StudentShell';
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
          {
            path: 'student/dashboard',
            lazy: async () => {
              const { StudentDashboardPage } =
                await import('../features/student/pages/StudentDashboardPage');
              return { Component: StudentDashboardPage };
            },
          },
          {
            path: 'student/profile',
            lazy: async () => {
              const { StudentProfilePage } =
                await import('../features/student/profile/pages/StudentProfilePage');
              return { Component: StudentProfilePage };
            },
          },
          {
            path: 'student/marketplace',
            lazy: async () => {
              const { MarketplacePage } =
                await import('../features/marketplace/pages/MarketplacePage');
              return { Component: MarketplacePage };
            },
          },
          {
            path: 'student/explore-colleges',
            lazy: async () => {
              const { ExploreCollegesPage } =
                await import('../features/marketplace/pages/ExploreCollegesPage');
              return { Component: ExploreCollegesPage };
            },
          },
          {
            path: 'student/explore-colleges/listing/:id',
            lazy: async () => {
              const { ListingDetailsPage } =
                await import('../features/marketplace/pages/ListingDetailsPage');
              return {
                Component: () => <ListingDetailsPage exploreMode />,
              };
            },
          },
          {
            path: 'student/sell',
            lazy: async () => {
              const { SellItemPage } =
                await import('../features/marketplace/pages/SellItemPage');
              return { Component: SellItemPage };
            },
          },
          {
            path: 'student/my-marketplace',
            lazy: async () => {
              const { MyMarketplacePage } =
                await import('../features/marketplace/pages/MyMarketplacePage');
              return { Component: MyMarketplacePage };
            },
          },
          {
            path: 'student/my-marketplace/edit/:listingId',
            lazy: async () => {
              const { EditListingPage } =
                await import('../features/marketplace/pages/EditListingPage');
              return { Component: EditListingPage };
            },
          },
          {
            path: 'student/wishlist',
            lazy: async () => {
              const { WishlistPage } =
                await import('../features/wishlist/pages/WishlistPage');
              return { Component: WishlistPage };
            },
          },
          {
            path: 'student/orders',
            lazy: async () => {
              const { OrdersPage } =
                await import('../features/orders/pages/OrdersPage');
              return { Component: OrdersPage };
            },
          },
          {
            path: 'student/orders/:orderId',
            lazy: async () => {
              const { OrderDetailsPage } =
                await import('../features/orders/pages/OrderDetailsPage');
              return { Component: OrderDetailsPage };
            },
          },
          {
            path: 'student/payments',
            lazy: async () => {
              const { PaymentHistoryPage } =
                await import('../features/payments/pages/PaymentHistoryPage');
              return { Component: PaymentHistoryPage };
            },
          },
          {
            path: 'student/reviews',
            lazy: async () => {
              const { ReviewsPage } =
                await import('../features/reviews/pages/ReviewsPage');
              return { Component: ReviewsPage };
            },
          },
          {
            path: 'student/notifications',
            lazy: async () => {
              const { NotificationsPage } =
                await import('../features/notifications/pages/NotificationsPage');
              return { Component: NotificationsPage };
            },
          },
          {
            path: 'student/settings',
            element: (
              <Navigate replace to="/student/profile#profile-security" />
            ),
          },
          {
            path: 'student/chat',
            element: <Navigate replace to="/student/dashboard" />,
          },
          {
            path: 'listing/:id',
            lazy: async () => {
              const { ListingDetailsPage } =
                await import('../features/marketplace/pages/ListingDetailsPage');
              return { Component: ListingDetailsPage };
            },
          },
          {
            path: 'user/public-profile/:sellerId',
            lazy: async () => {
              const { PublicSellerProfilePage } =
                await import('../features/marketplace/pages/PublicSellerProfilePage');
              return { Component: PublicSellerProfilePage };
            },
          },
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
