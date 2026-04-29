import { ChromaClient } from 'chromadb';
import type {
  Chunk,
  SearchResult,
  VectorStore,
} from '@florexlabs/docs-to-mcp-types';

export class ChromaVectorStore implements VectorStore {
  private client: ChromaClient;
  private collection: Awaited<ReturnType<ChromaClient['getOrCreateCollection']>> | null = null;

  constructor(
    private collectionName: string,
    chromaUrl = 'http://localhost:8000',
  ) {
    const url = new URL(chromaUrl);
    this.client = new ChromaClient({
      host: url.hostname,
      port: parseInt(url.port) || 8000,
      ssl: url.protocol === 'https:',
    });
  }

  private async getCollection() {
    if (!this.collection) {
      this.collection = await this.client.getOrCreateCollection({
        name: this.collectionName,
        embeddingFunction: null,
      });
    }
    return this.collection;
  }

  async upsert(chunks: Chunk[], embeddings: number[][]): Promise<void> {
    const col = await this.getCollection();
    await col.upsert({
      ids: chunks.map((c) => c.id),
      embeddings,
      documents: chunks.map((c) => c.content),
      metadatas: chunks.map((c) => ({
        url: c.metadata.url,
        title: c.metadata.title,
        heading: c.metadata.heading ?? '',
      })),
    });
  }

  async search(embedding: number[], topK: number): Promise<SearchResult[]> {
    const col = await this.getCollection();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const include = ['documents', 'metadatas', 'distances'] as any;
    const res = await col.query({
      queryEmbeddings: [embedding],
      nResults: topK,
      include,
    });

    const ids = res.ids[0] ?? [];
    return ids.map((id: string, i: number) => ({
      id,
      content: String(res.documents?.[0]?.[i] ?? ''),
      metadata: {
        url: String(res.metadatas?.[0]?.[i]?.url ?? ''),
        title: String(res.metadatas?.[0]?.[i]?.title ?? ''),
        heading: res.metadatas?.[0]?.[i]?.heading ? String(res.metadatas[0][i].heading) : undefined,
      },
      score: 1 - (res.distances?.[0]?.[i] ?? 0),
    }));
  }

  async getSources(): Promise<
    { url: string; title: string; chunks: number }[]
  > {
    const col = await this.getCollection();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const all = await col.get({ include: ['metadatas'] as any });
    const map = new Map<string, { title: string; count: number }>();
    for (const meta of all.metadatas ?? []) {
      if (!meta) continue;
      const url = String(meta.url);
      const existing = map.get(url);
      if (existing) {
        existing.count++;
      } else {
        map.set(url, { title: String(meta.title ?? ''), count: 1 });
      }
    }
    return [...map.entries()].map(([url, { title, count }]) => ({
      url,
      title,
      chunks: count,
    }));
  }

  async getBySource(url: string): Promise<Chunk[]> {
    const col = await this.getCollection();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = await col.get({
      where: { url },
      include: ['documents', 'metadatas'] as any,
    });
    return (res.ids ?? []).map((id: string, i: number) => ({
      id,
      content: String(res.documents?.[i] ?? ''),
      metadata: {
        url: String(res.metadatas?.[i]?.url ?? ''),
        title: String(res.metadatas?.[i]?.title ?? ''),
        heading: res.metadatas?.[i]?.heading ? String(res.metadatas[i].heading) : undefined,
      },
    }));
  }
}
