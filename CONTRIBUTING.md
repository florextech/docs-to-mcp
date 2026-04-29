# Contributing to @florexlabs/docs-to-mcp

## Getting Started

```bash
git clone https://github.com/florexlabs/docs-to-mcp.git
cd docs-to-mcp
pnpm install
pnpm test
```

## Development

- `pnpm test` — Run tests
- `pnpm build` — Build all packages
- `pnpm lint` — Lint code
- `pnpm format` — Format code

## Commit Convention

Use [Conventional Commits](https://www.conventionalcommits.org/):

- `feat(scope):` — New feature
- `fix(scope):` — Bug fix
- `docs:` — Documentation
- `test:` — Tests
- `chore:` — Maintenance

Scopes: `cli`, `crawler`, `parser`, `chunker`, `embeddings`, `vector-store`, `mcp-server`

## Pull Requests

1. Fork the repo
2. Create a feature branch
3. Make your changes
4. Run `pnpm test` and `pnpm build`
5. Submit a PR

## Adding an Embedding Provider

Implement the `EmbeddingProvider` interface from `@florexlabs/docs-to-mcp-types`:

```typescript
import type { EmbeddingProvider } from '@florexlabs/docs-to-mcp-types';

export class MyProvider implements EmbeddingProvider {
  async embedDocuments(texts: string[]): Promise<number[][]> { ... }
  async embedQuery(query: string): Promise<number[]> { ... }
}
```

## Adding a Vector Store

Implement the `VectorStore` interface from `@florexlabs/docs-to-mcp-types`:

```typescript
import type { VectorStore } from '@florexlabs/docs-to-mcp-types';

export class MyStore implements VectorStore {
  async upsert(chunks, embeddings): Promise<void> { ... }
  async search(embedding, topK): Promise<SearchResult[]> { ... }
  async getSources(): Promise<...> { ... }
  async getBySource(url): Promise<Chunk[]> { ... }
}
```
