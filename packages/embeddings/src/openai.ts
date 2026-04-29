import OpenAI from 'openai';
import type { EmbeddingProvider } from '@florexlabs/docs-mcp-types';

export class OpenAIEmbeddingProvider implements EmbeddingProvider {
  private client: OpenAI;

  constructor(
    private apiKey: string,
    private model = 'text-embedding-3-small',
  ) {
    this.client = new OpenAI({ apiKey });
  }

  async embedDocuments(texts: string[]): Promise<number[][]> {
    const res = await this.client.embeddings.create({
      model: this.model,
      input: texts,
    });
    return res.data.map((d) => d.embedding);
  }

  async embedQuery(query: string): Promise<number[]> {
    const [embedding] = await this.embedDocuments([query]);
    return embedding;
  }
}
