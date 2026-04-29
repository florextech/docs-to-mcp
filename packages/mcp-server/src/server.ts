import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import type { VectorStore, EmbeddingProvider } from '@florexlabs/docs-to-mcp-types';

export function createServer(
  vectorStore: VectorStore,
  embeddingProvider: EmbeddingProvider,
) {
  const server = new McpServer({
    name: 'docs-to-mcp',
    version: '0.1.0',
  });

  server.registerTool(
    'search_docs',
    {
      description: 'Search indexed documentation by semantic query',
      inputSchema: {
        query: z.string().describe('Search query'),
        topK: z.number().optional().default(5).describe('Number of results'),
      },
    },
    async ({ query, topK }) => {
      const embedding = await embeddingProvider.embedQuery(query);
      const results = await vectorStore.search(embedding, topK);
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(
              results.map((r) => ({
                title: r.metadata.title,
                url: r.metadata.url,
                heading: r.metadata.heading,
                snippet: r.content.slice(0, 300),
                score: r.score,
              })),
              null,
              2,
            ),
          },
        ],
      };
    },
  );

  server.registerTool(
    'get_source',
    {
      description: 'Get all chunks from a specific source URL',
      inputSchema: {
        url: z.string().describe('Source URL'),
      },
    },
    async ({ url }) => {
      const chunks = await vectorStore.getBySource(url);
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(
              chunks.map((c) => ({
                heading: c.metadata.heading,
                content: c.content,
              })),
              null,
              2,
            ),
          },
        ],
      };
    },
  );

  server.registerTool(
    'list_sources',
    {
      description: 'List all indexed documentation sources',
      inputSchema: {},
    },
    async () => {
      const sources = await vectorStore.getSources();
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(sources, null, 2),
          },
        ],
      };
    },
  );

  return server;
}

export async function startServer(
  vectorStore: VectorStore,
  embeddingProvider: EmbeddingProvider,
) {
  const server = createServer(vectorStore, embeddingProvider);
  const transport = new StdioServerTransport();
  await server.connect(transport);
}
