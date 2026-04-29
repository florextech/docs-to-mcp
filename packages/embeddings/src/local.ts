import type { EmbeddingProvider } from '@florexlabs/docs-to-mcp-types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let extractor: any = null;

export class LocalEmbeddingProvider implements EmbeddingProvider {
  constructor(private model = 'Xenova/all-MiniLM-L6-v2') {}

  private async getExtractor() {
    if (!extractor) {
      const { pipeline } = await import('@huggingface/transformers');
      extractor = await pipeline('feature-extraction', this.model);
    }
    return extractor;
  }

  async embedDocuments(texts: string[]): Promise<number[][]> {
    const ext = await this.getExtractor();
    const result = await ext(texts, { pooling: 'mean', normalize: true });
    return result.tolist();
  }

  async embedQuery(query: string): Promise<number[]> {
    const [embedding] = await this.embedDocuments([query]);
    return embedding;
  }
}
