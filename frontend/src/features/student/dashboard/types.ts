export type StudentDashboard = {
  user: {
    id: number;
    fullName: string;
    email: string;
    collegeId: number;
    collegeName: string;
    collegeCode: string;
    role: 'STUDENT';
    accountStatus: string;
    isEmailVerified: boolean;
    isPhoneVerified: boolean;
    department: string;
    course: string;
    yearOfStudy: string;
    hostelOrCampusArea: string;
    profilePhotoFileName: string | null;
  };
  trustScore: {
    score: number;
    level: string;
    suggestions: string[];
  };
  profileCompletion: {
    percentage: number;
    completedFields: number;
    totalFields: number;
    missingFields: string[];
  };
  stats: {
    activeListings: number;
    wishlistItems: number;
    ordersPlaced: number;
    itemsSold: number;
    unreadNotifications: number;
  };
  latestListings: DashboardListing[];
  notifications: DashboardNotification[];
  recentActivity: DashboardActivity[];
  generatedAt: string;
};

export type DashboardListing = {
  id: number;
  title: string;
  category: string;
  price: number;
  condition: string;
  imageUrl: string | null;
  sellerId: number;
  sellerName: string;
  sellerTrustScore: number;
  postedDate: string;
};

export type DashboardNotification = {
  id: number;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
};

export type DashboardActivity = {
  id: number;
  type: string;
  message: string;
  createdAt: string;
};
