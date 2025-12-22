// API Client for Phantom CMS

import { API_BASE_URL, USE_MOCK_DATA, USE_MOCK_AUTH, ENDPOINTS, REQUEST_TIMEOUT } from "./config";
import {
  mockPlayers,
  mockAchievements,
  mockTeamMedia,
  mockTournaments,
  mockGallery,
  mockVideos,
  mockNews,
  mockSponsors,
  mockUser,
  mockDashboardStats,
  mockActivities,
} from './mockData';
import type {
  Player,
  Achievement,
  TeamMedia,
  Tournament,
  GalleryImage,
  Video,
  NewsArticle,
  Sponsor,
  User,
  DashboardStats,
  Activity,
  ApiResponse,
} from '@/types';

// Generic fetch wrapper with timeout (Fix: avoid forcing preflight on GET)
async function fetchWithTimeout(url: string, options: RequestInit = {}): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  try {
    const method = (options.method || "GET").toUpperCase();

    // Start with Accept header only
    const headers: Record<string, string> = {
      Accept: "application/json",
      ...(options.headers as Record<string, string>),
    };

    // Only set Content-Type when you actually send a body (POST/PUT/PATCH)
    if (options.body && method !== "GET") {
      headers["Content-Type"] = "application/json";
    }

    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers,
    });

    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}


// Generic API request handler
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  mockData?: T
): Promise<T> {
  if (USE_MOCK_DATA && mockData !== undefined) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300));
    return mockData;
  }

  const response = await fetchWithTimeout(`${API_BASE_URL}${endpoint}`, options);
  
  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data;
}

// ============ AUTH API ============

export const authApi = {
  login: async (email: string, password: string): Promise<ApiResponse<User>> => {
    if (USE_MOCK_AUTH) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      if (email === "admin@phantom.team" && password === "phantom123") {
        return { data: mockUser, message: "Login successful" };
      }
      throw new Error("Invalid credentials");
    }

    return apiRequest<ApiResponse<User>>(ENDPOINTS.auth.login, {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  },

  logout: async (): Promise<void> => {
    if (USE_MOCK_AUTH) {
      await new Promise((resolve) => setTimeout(resolve, 200));
      return;
    }
    await apiRequest<void>(ENDPOINTS.auth.logout, { method: "POST" });
  },

  me: async (): Promise<User> => {
    if (USE_MOCK_AUTH) return mockUser;
    return apiRequest<User>(ENDPOINTS.auth.me);
  },
};

// ============ PLAYERS API ============

let playersData = [...mockPlayers];

export const playersApi = {
  getAll: async (): Promise<Player[]> => {
    return apiRequest<Player[]>(ENDPOINTS.players, {}, playersData);
  },

  getById: async (id: string): Promise<Player | undefined> => {
    const players = await playersApi.getAll();
    return players.find(p => p.id === id);
  },

  create: async (player: Omit<Player, 'id' | 'createdAt' | 'updatedAt'>): Promise<Player> => {
    const newPlayer: Player = {
      ...player,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    if (USE_MOCK_DATA) {
      await new Promise(resolve => setTimeout(resolve, 300));
      playersData.push(newPlayer);
      return newPlayer;
    }

    return apiRequest<Player>(ENDPOINTS.players, {
      method: 'POST',
      body: JSON.stringify(player),
    });
  },

  update: async (id: string, player: Partial<Player>): Promise<Player> => {
    if (USE_MOCK_DATA) {
      await new Promise(resolve => setTimeout(resolve, 300));
      const index = playersData.findIndex(p => p.id === id);
      if (index === -1) throw new Error('Player not found');
      playersData[index] = { ...playersData[index], ...player, updatedAt: new Date().toISOString() };
      return playersData[index];
    }

    return apiRequest<Player>(`${ENDPOINTS.players}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(player),
    });
  },

  delete: async (id: string): Promise<void> => {
    if (USE_MOCK_DATA) {
      await new Promise(resolve => setTimeout(resolve, 300));
      playersData = playersData.filter(p => p.id !== id);
      return;
    }

    await apiRequest<void>(`${ENDPOINTS.players}/${id}`, { method: 'DELETE' });
  },
};

// ============ ACHIEVEMENTS API ============

let achievementsData = [...mockAchievements];

export const achievementsApi = {
  getAll: async (): Promise<Achievement[]> => {
    return apiRequest<Achievement[]>(ENDPOINTS.achievements, {}, achievementsData);
  },

  create: async (achievement: Omit<Achievement, 'id' | 'createdAt' | 'updatedAt'>): Promise<Achievement> => {
    const newAchievement: Achievement = {
      ...achievement,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    if (USE_MOCK_DATA) {
      await new Promise(resolve => setTimeout(resolve, 300));
      achievementsData.push(newAchievement);
      return newAchievement;
    }

    return apiRequest<Achievement>(ENDPOINTS.achievements, {
      method: 'POST',
      body: JSON.stringify(achievement),
    });
  },

  update: async (id: string, achievement: Partial<Achievement>): Promise<Achievement> => {
    if (USE_MOCK_DATA) {
      await new Promise(resolve => setTimeout(resolve, 300));
      const index = achievementsData.findIndex(a => a.id === id);
      if (index === -1) throw new Error('Achievement not found');
      achievementsData[index] = { ...achievementsData[index], ...achievement, updatedAt: new Date().toISOString() };
      return achievementsData[index];
    }

    return apiRequest<Achievement>(`${ENDPOINTS.achievements}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(achievement),
    });
  },

  delete: async (id: string): Promise<void> => {
    if (USE_MOCK_DATA) {
      await new Promise(resolve => setTimeout(resolve, 300));
      achievementsData = achievementsData.filter(a => a.id !== id);
      return;
    }

    await apiRequest<void>(`${ENDPOINTS.achievements}/${id}`, { method: 'DELETE' });
  },
};

// ============ TEAM MEDIA API ============

let teamMediaData = [...mockTeamMedia];

export const teamMediaApi = {
  getAll: async (): Promise<TeamMedia[]> => {
    return apiRequest<TeamMedia[]>(ENDPOINTS.teamMedia, {}, teamMediaData);
  },

  update: async (id: string, media: Partial<TeamMedia>): Promise<TeamMedia> => {
    if (USE_MOCK_DATA) {
      await new Promise(resolve => setTimeout(resolve, 300));
      const index = teamMediaData.findIndex(m => m.id === id);
      if (index === -1) throw new Error('Media not found');
      teamMediaData[index] = { ...teamMediaData[index], ...media, updatedAt: new Date().toISOString() };
      return teamMediaData[index];
    }

    return apiRequest<TeamMedia>(`${ENDPOINTS.teamMedia}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(media),
    });
  },
};

// ============ TOURNAMENTS API ============

let tournamentsData = [...mockTournaments];

export const tournamentsApi = {
  getAll: async (): Promise<Tournament[]> => {
    return apiRequest<Tournament[]>(ENDPOINTS.tournaments, {}, tournamentsData);
  },

  create: async (tournament: Omit<Tournament, 'id' | 'createdAt' | 'updatedAt'>): Promise<Tournament> => {
    const newTournament: Tournament = {
      ...tournament,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    if (USE_MOCK_DATA) {
      await new Promise(resolve => setTimeout(resolve, 300));
      tournamentsData.push(newTournament);
      return newTournament;
    }

    return apiRequest<Tournament>(ENDPOINTS.tournaments, {
      method: 'POST',
      body: JSON.stringify(tournament),
    });
  },

  update: async (id: string, tournament: Partial<Tournament>): Promise<Tournament> => {
    if (USE_MOCK_DATA) {
      await new Promise(resolve => setTimeout(resolve, 300));
      const index = tournamentsData.findIndex(t => t.id === id);
      if (index === -1) throw new Error('Tournament not found');
      tournamentsData[index] = { ...tournamentsData[index], ...tournament, updatedAt: new Date().toISOString() };
      return tournamentsData[index];
    }

    return apiRequest<Tournament>(`${ENDPOINTS.tournaments}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(tournament),
    });
  },

  delete: async (id: string): Promise<void> => {
    if (USE_MOCK_DATA) {
      await new Promise(resolve => setTimeout(resolve, 300));
      tournamentsData = tournamentsData.filter(t => t.id !== id);
      return;
    }

    await apiRequest<void>(`${ENDPOINTS.tournaments}/${id}`, { method: 'DELETE' });
  },
};

// ============ GALLERY API ============

let galleryData = [...mockGallery];

export const galleryApi = {
  getAll: async (): Promise<GalleryImage[]> => {
    return apiRequest<GalleryImage[]>(ENDPOINTS.gallery, {}, galleryData);
  },

  create: async (image: Omit<GalleryImage, 'id' | 'createdAt' | 'updatedAt'>): Promise<GalleryImage> => {
    const newImage: GalleryImage = {
      ...image,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    if (USE_MOCK_DATA) {
      await new Promise(resolve => setTimeout(resolve, 300));
      galleryData.push(newImage);
      return newImage;
    }

    return apiRequest<GalleryImage>(ENDPOINTS.gallery, {
      method: 'POST',
      body: JSON.stringify(image),
    });
  },

  update: async (id: string, image: Partial<GalleryImage>): Promise<GalleryImage> => {
    if (USE_MOCK_DATA) {
      await new Promise(resolve => setTimeout(resolve, 300));
      const index = galleryData.findIndex(i => i.id === id);
      if (index === -1) throw new Error('Image not found');
      galleryData[index] = { ...galleryData[index], ...image, updatedAt: new Date().toISOString() };
      return galleryData[index];
    }

    return apiRequest<GalleryImage>(`${ENDPOINTS.gallery}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(image),
    });
  },

  delete: async (id: string): Promise<void> => {
    if (USE_MOCK_DATA) {
      await new Promise(resolve => setTimeout(resolve, 300));
      galleryData = galleryData.filter(i => i.id !== id);
      return;
    }

    await apiRequest<void>(`${ENDPOINTS.gallery}/${id}`, { method: 'DELETE' });
  },
};

// ============ VIDEOS API ============

let videosData = [...mockVideos];

export const videosApi = {
  getAll: async (): Promise<Video[]> => {
    return apiRequest<Video[]>(ENDPOINTS.videos, {}, videosData);
  },

  create: async (video: Omit<Video, 'id' | 'createdAt' | 'updatedAt'>): Promise<Video> => {
    const newVideo: Video = {
      ...video,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    if (USE_MOCK_DATA) {
      await new Promise(resolve => setTimeout(resolve, 300));
      videosData.push(newVideo);
      return newVideo;
    }

    return apiRequest<Video>(ENDPOINTS.videos, {
      method: 'POST',
      body: JSON.stringify(video),
    });
  },

  update: async (id: string, video: Partial<Video>): Promise<Video> => {
    if (USE_MOCK_DATA) {
      await new Promise(resolve => setTimeout(resolve, 300));
      const index = videosData.findIndex(v => v.id === id);
      if (index === -1) throw new Error('Video not found');
      videosData[index] = { ...videosData[index], ...video, updatedAt: new Date().toISOString() };
      return videosData[index];
    }

    return apiRequest<Video>(`${ENDPOINTS.videos}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(video),
    });
  },

  delete: async (id: string): Promise<void> => {
    if (USE_MOCK_DATA) {
      await new Promise(resolve => setTimeout(resolve, 300));
      videosData = videosData.filter(v => v.id !== id);
      return;
    }

    await apiRequest<void>(`${ENDPOINTS.videos}/${id}`, { method: 'DELETE' });
  },
};

// ============ NEWS API ============

let newsData = [...mockNews];

export const newsApi = {
  getAll: async (): Promise<NewsArticle[]> => {
    return apiRequest<NewsArticle[]>(ENDPOINTS.news, {}, newsData);
  },

  getById: async (id: string): Promise<NewsArticle | undefined> => {
    const articles = await newsApi.getAll();
    return articles.find(a => a.id === id);
  },

  create: async (article: Omit<NewsArticle, 'id' | 'createdAt' | 'updatedAt'>): Promise<NewsArticle> => {
    const newArticle: NewsArticle = {
      ...article,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    if (USE_MOCK_DATA) {
      await new Promise(resolve => setTimeout(resolve, 300));
      newsData.push(newArticle);
      return newArticle;
    }

    return apiRequest<NewsArticle>(ENDPOINTS.news, {
      method: 'POST',
      body: JSON.stringify(article),
    });
  },

  update: async (id: string, article: Partial<NewsArticle>): Promise<NewsArticle> => {
    if (USE_MOCK_DATA) {
      await new Promise(resolve => setTimeout(resolve, 300));
      const index = newsData.findIndex(a => a.id === id);
      if (index === -1) throw new Error('Article not found');
      newsData[index] = { ...newsData[index], ...article, updatedAt: new Date().toISOString() };
      return newsData[index];
    }

    return apiRequest<NewsArticle>(`${ENDPOINTS.news}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(article),
    });
  },

  delete: async (id: string): Promise<void> => {
    if (USE_MOCK_DATA) {
      await new Promise(resolve => setTimeout(resolve, 300));
      newsData = newsData.filter(a => a.id !== id);
      return;
    }

    await apiRequest<void>(`${ENDPOINTS.news}/${id}`, { method: 'DELETE' });
  },
};

// ============ SPONSORS API ============

let sponsorsData = [...mockSponsors];

export const sponsorsApi = {
  getAll: async (): Promise<Sponsor[]> => {
    return apiRequest<Sponsor[]>(ENDPOINTS.sponsors, {}, sponsorsData);
  },

  create: async (sponsor: Omit<Sponsor, 'id' | 'createdAt' | 'updatedAt'>): Promise<Sponsor> => {
    const newSponsor: Sponsor = {
      ...sponsor,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    if (USE_MOCK_DATA) {
      await new Promise(resolve => setTimeout(resolve, 300));
      sponsorsData.push(newSponsor);
      return newSponsor;
    }

    return apiRequest<Sponsor>(ENDPOINTS.sponsors, {
      method: 'POST',
      body: JSON.stringify(sponsor),
    });
  },

  update: async (id: string, sponsor: Partial<Sponsor>): Promise<Sponsor> => {
    if (USE_MOCK_DATA) {
      await new Promise(resolve => setTimeout(resolve, 300));
      const index = sponsorsData.findIndex(s => s.id === id);
      if (index === -1) throw new Error('Sponsor not found');
      sponsorsData[index] = { ...sponsorsData[index], ...sponsor, updatedAt: new Date().toISOString() };
      return sponsorsData[index];
    }

    return apiRequest<Sponsor>(`${ENDPOINTS.sponsors}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(sponsor),
    });
  },

  delete: async (id: string): Promise<void> => {
    if (USE_MOCK_DATA) {
      await new Promise(resolve => setTimeout(resolve, 300));
      sponsorsData = sponsorsData.filter(s => s.id !== id);
      return;
    }

    await apiRequest<void>(`${ENDPOINTS.sponsors}/${id}`, { method: 'DELETE' });
  },
};

// ============ DASHBOARD API ============

export const dashboardApi = {
  getStats: async (): Promise<DashboardStats> => {
    return apiRequest<DashboardStats>('/dashboard/stats', {}, mockDashboardStats);
  },

  getRecentActivity: async (): Promise<Activity[]> => {
    return apiRequest<Activity[]>('/dashboard/activity', {}, mockActivities);
  },
};
