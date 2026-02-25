export interface KBNote {
  id: string;
  title: string;
  content: string;
  tags: string[];
  created: number;
  updated: number;
}

export interface BacklinkRef {
  sourceId: string;
  sourceTitle: string;
  context: string; // surrounding text
}
