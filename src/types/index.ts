// Types for Phantom CMS

export interface Player {
  id: string;
  fullName: string;
  jerseyNumber: number;
  roleTag: 'Captain' | 'Coach' | 'Player';
  position: string;
  tagline?: string;
  bio?: string;
  photoUrl?: string;
  status: 'active' | 'inactive';
  socials?: {
    instagram?: string;
    twitter?: string;
    linkedin?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Achievement {
  id: string;
  year: number;
  title: string;
  description?: string;
  category: string;
  featured: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TeamMedia {
  id: string;
  type: 'team-photo' | 'hero-banner' | 'logo';
  imageUrl: string;
  title?: string;
  updatedAt: string;
}

export interface Tournament {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  location: string;
  division: 'Open' | 'Mixed';
  status: 'Upcoming' | 'Past';
  featuredNextTournament: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Result {
  id: string;
  tournamentId: string;
  tournamentName: string;
  placement: number;
  date: string;
  notes?: string;
  createdAt: string;
}

export interface GalleryImage {
  id: string;
  imageUrl: string;
  caption?: string;
  album?: string;
  category?: string;
  featured: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface Video {
  id: string;
  platform: 'YouTube' | 'Instagram' | 'TikTok';
  title: string;
  url: string;
  thumbnailUrl?: string;
  featured: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface NewsArticle {
  id: string;
  title: string;
  category: string;
  publishDate: string;
  summary: string;
  coverImageUrl?: string;
  content: string;
  status: 'Draft' | 'Published';
  createdAt: string;
  updatedAt: string;
}

export interface Sponsor {
  id: string;
  name: string;
  logoUrl: string;
  websiteUrl?: string;
  tier: 'Gold' | 'Silver' | 'Bronze' | 'Partner';
  featured: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'Admin' | 'Editor';
  avatarUrl?: string;
}

export interface DashboardStats {
  totalPlayers: number;
  totalAchievements: number;
  upcomingTournaments: number;
  publishedNews: number;
}

export interface Activity {
  id: string;
  type: 'player' | 'achievement' | 'tournament' | 'news' | 'gallery';
  action: 'created' | 'updated' | 'deleted';
  description: string;
  timestamp: string;
  userId: string;
}

// API Response types
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}
