
export type CategoryType = 'all' | 'games' | 'accounts' | 'skins' | 'giftcards' | 'services' | 'discord' | 'brawlhalla';

export interface Product {
  id: string;
  name: string;
  description?: string;
  seller: string;
  category: CategoryType;
  price: number;
  originalPrice?: number;
  rating: number;
  sales: number;
  imageEmoji: string; // Chave para o ícone SVG de fallback
  customImageUrl?: string;
  customImageData?: string;
  verified: boolean;
  outOfStock: boolean;
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  isAdmin: boolean;
  profilePhotoUrl?: string;
  profilePhotoData?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export type ThemeMode = 'dark' | 'light';
export type ViewState = 'home' | 'products' | 'how-it-works' | 'terms';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}
