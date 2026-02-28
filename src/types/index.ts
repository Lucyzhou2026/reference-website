export enum LiteratureType {
  JOURNAL = 'Journal Article',
  BOOK = 'Book',
  CONFERENCE = 'Conference Paper',
  THESIS = 'Thesis',
  WEB = 'Website',
  REPORT = 'Report',
  OTHER = 'Other'
}

export enum CitationStyle {
  APA = 'apa',
  MLA = 'mla',
  CHICAGO = 'chicago',
  HARVARD = 'harvard',
  IEEE = 'ieee',
  BIBTEX = 'bibtex'
}

export interface AppSettings {
  defaultCitationStyle: CitationStyle;
  itemsPerPage: number;
  enableAutoSave: boolean;
  theme: 'light' | 'dark' | 'system';
}

export interface FilterOptions {
  search: string;
  types: LiteratureType[];
  yearRange: [number | null, number | null];
  tags: string[];
}

export interface LiteratureItem {
  id: string;
  title: string;
  authors: string[];
  year: number;
  type: LiteratureType | string; // Allow string to be compatible with metadata if needed
  journal?: string;
  publisher?: string;
  volume?: string;
  issue?: string;
  pages?: string;
  doi?: string;
  url?: string;
  abstract?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  notes?: string;
  citationCount?: number;
  isOpenAccess?: boolean;
}

export interface Citation {
  id: string;
  type: 'in-text' | 'reference';
  rawText: string;
  authors: string[];
  year: number;
  title?: string; // For reference type
  journal?: string; // For reference type
  doi?: string; // For reference type
  matchStatus: 'matched' | 'missing' | 'unused' | 'pending';
  metadata?: LiteratureMetadata;
  index: number; // Position in text for highlighting
  length: number;
}

export interface LiteratureMetadata {
  id?: string;
  title: string;
  authors: string[];
  year: number;
  journal?: string;
  volume?: string;
  issue?: string;
  pages?: string;
  doi?: string;
  url?: string;
  abstract?: string;
  citationCount?: number;
  type?: string;
  isOpenAccess?: boolean;
  // AI-generated analysis fields
  summary?: string;
  supportingQuote?: string;
  explanation?: string;
  analysisStatus?: 'pending' | 'loading' | 'completed' | 'failed';
}

export interface ParseResult {
  citations: Citation[];
  missingCitations: Citation[];
  unusedReferences: Citation[];
  totalInText: number;
  totalReferences: number;
}

export interface DocumentState {
  content: string;
  citations: Citation[];
  isAnalyzing: boolean;
  selectedCitationId: string | null;
}
