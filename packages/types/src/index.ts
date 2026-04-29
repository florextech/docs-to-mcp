export interface CrawlResult {
  url: string;
  canonicalUrl?: string;
  title: string;
  html: string;
  text: string;
}

export interface ParsedDocument {
  url: string;
  title: string;
  markdown: string;
}

export interface Chunk {
  id: string;
  content: string;
  metadata: ChunkMetadata;
}

export interface ChunkMetadata {
  url: string;
  title: string;
  heading?: string;
}

export interface SearchResult {
  id: string;
  content: string;
  metadata: ChunkMetadata;
  score: number;
}

export interface EmbeddingProvider {
  embedDocuments(texts: string[]): Promise<number[][]>;
  embedQuery(query: string): Promise<number[]>;
}

export interface VectorStore {
  upsert(chunks: Chunk[], embeddings: number[][]): Promise<void>;
  search(embedding: number[], topK: number): Promise<SearchResult[]>;
  getSources(): Promise<{ url: string; title: string; chunks: number }[]>;
  getBySource(url: string): Promise<Chunk[]>;
}

export interface DocsMcpConfig {
  url: string;
  out: string;
  depth: number;
  limit: number;
  provider: string;
  model: string;
  collection: string;
}
