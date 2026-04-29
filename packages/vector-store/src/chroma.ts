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
    this.client = new ChromaClient({ path: chromaUrl });
  }

  private async getCollection() {
    if (!this.collection) {
      this.collection = await this.client.getOrCreateCollection({
        name: this.collectionName,
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
    const res = await col.query({
      queryEmbeddings: [embedding],
      nResults: topK,
      include: ['documents' as never, 'metadatas' as never, 'distances' as never],
    });

    const ids = res.ids[0] ?? [];
    return ids.map((id: string, i: number) => ({
      id,
      content: (res.documents as (string | null)[][])[0]?.[i] ?? '',
      metadata: {
        url: ((res.metadatas as (Record<string, unknown> | null)[][])[0]?.[i]?.url as string) ?? '',
        title: ((res.metadatas as (Record<string, unknown> | null)[][])[0]?.[i]?.title as string) ?? '',
        heading: ((res.metadatas as (Record<string, unknown> | null)[][])[0]?.[i]?.heading as string) || undefined,
      },
      score: 1 - ((res.distances as number[][])?.[0]?.[i] ?? 0),
    }));
  }

  async getSources(): Promise<
    { url: string; title: string; chunks: number }[]
  > {
    const col = await this.getCollection();
    const all = await col.get({ include: ['metadatas' as never] });
    const map = new Map<string, { title: string; count: number }>();
    for (const meta of (all.metadatas ?? []) as (Record<string, unknown> | null)[]) {
      if (!meta) continue;
      const url = meta.url as string;
      const existing = map.get(url);
      if (existing) {
        existing.count++;
      } else {
        map.set(url, { title: (meta.title as string) ?? '', count: 1 });
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
    const res = await col.get({
      where: { url },
      include: ['documents' as never, 'metadatas' as never],
    });
    return (res.ids ?? []).map((id: string, i: number) => ({
      id,
      content: (res.documents as (string | null)[])[i] ?? '',
      metadata: {
        url: ((res.metadatas as (Record<string, unknown> | null)[])[i]?.url as string) ?? '',
        title: ((res.metadatas as (Record<string, unknown> | null)[])[i]?.title as string) ?? '',
        heading: ((res.metadatas as (Record<string, unknown> | null)[])[i]?.heading as string) || undefined,
      },
    }));
  }
}
