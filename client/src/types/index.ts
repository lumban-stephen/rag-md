export interface Document {
  id: string;
  filename: string;
  topic: string;
  timestamp: string;
  status: 'Processed' | 'Pending';
}

export interface SearchResult {
  id: string;
  snippet: string;
  filename: string;
  confidence: number;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  event: string;
  details: string;
}

export interface TabProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}