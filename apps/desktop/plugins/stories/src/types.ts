export type StoryFormat = 'article' | 'slides' | 'scroll';

export interface Slide {
  title?: string;
  content: string;
  notes?: string;
  background?: string;
  layout?: 'center' | 'left' | 'right' | 'split' | 'code';
}

export interface ScrollSection {
  id: string;
  content: string;
  animation?: 'fade-in' | 'slide-up' | 'parallax' | 'reveal';
  background?: string;
  sticky?: boolean;
}

export interface StoryPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  format: StoryFormat;
  content: string;
  slides?: Slide[];
  sections?: ScrollSection[];
  coverImage?: string;
  author: {
    name: string;
    avatar?: string;
  };
  publishedAt: string;
  updatedAt?: string;
  readTime: number;
  tags: string[];
  featured?: boolean;
}
