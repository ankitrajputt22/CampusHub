export type ProfileCollege = {
  id: number;
  name: string;
  code: string;
};

export type ProfileTrustScore = {
  score: number;
  level: string;
  suggestions: string[];
};

export type ProfileCompletion = {
  percentage: number;
  completedFields: number;
  totalFields: number;
  missingFields: string[];
};

export type SellerStats = {
  averageRating: number;
  totalReviews: number;
  successfulDeals: number;
  activeListings: number;
  soldItems: number;
  ordersCompleted: number;
  wishlistItems: number;
};

export type ProfilePrivacySettings = {
  showBio: boolean;
  showLinkedin: boolean;
  showGithub: boolean;
  showHostelArea: boolean;
  showDepartment: boolean;
  showYearOfStudy: boolean;
};

export type SellerReview = {
  id: number;
  reviewerName: string;
  rating: number;
  message: string;
  reviewDate: string;
};

export type StudentProfile = {
  id: number;
  fullName: string;
  email: string;
  phoneNumber: string;
  college: ProfileCollege;
  department: string;
  course: string;
  yearOfStudy: string;
  rollNumber: string | null;
  hostelArea: string;
  profilePhotoUrl: string | null;
  bio: string | null;
  linkedinUrl: string | null;
  githubUrl: string | null;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  isVerifiedStudent: boolean;
  role: 'STUDENT';
  accountStatus: string;
  trustScore: ProfileTrustScore;
  profileCompletion: ProfileCompletion;
  sellerStats: SellerStats;
  privacySettings: ProfilePrivacySettings;
  latestReviews: SellerReview[];
};

export type ProfileUpdatePayload = {
  fullName: string;
  bio: string;
  hostelArea: string;
  department: string;
  course: string;
  yearOfStudy: string;
  rollNumber: string;
  linkedinUrl: string;
  githubUrl: string;
};

export type ChangePasswordPayload = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

export type ProfilePhotoResult = {
  profilePhotoUrl: string;
  trustScore: number;
  profileCompletionPercentage: number;
};
