import type { AppCategory } from './types';

export interface CategoryConfig {
  icon: string;
  label: string;
  order: number;
  description: string;
  requiresAuth?: boolean;
}

export const categoryConfig: Record<AppCategory, CategoryConfig> = {
  showcase: { icon: '💼', label: 'Showcase', order: 0, description: 'Work & portfolio' },
  studio:   { icon: '🛠', label: 'Studio',   order: 1, description: 'Build & create' },
  creative: { icon: '🎨', label: 'Creative', order: 2, description: 'Art & experiments' },
  games:    { icon: '🎮', label: 'Games',    order: 3, description: 'Play & explore' },
  desktop:  { icon: '🖥', label: 'Desktop',  order: 4, description: 'Everyday tools' },
  admin:    { icon: '🔐', label: 'Admin',    order: 5, description: 'System management', requiresAuth: true },
};
