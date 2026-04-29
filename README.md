# @florexlabs/docs-mcp

Convert any documentation URL into a ready-to-run MCP server.

```
URL → crawl → clean HTML → markdown → chunks → embeddings → vector store → MCP server
```

## Quick Start

```bash
# Initialize a project from a docs URL
npx @florexlabs/docs-mcp init https://docs.example.com --out ./my-docs-mcp

cd my-docs-mcp
npm install
cp .env.example .env
# Add your OPENAI_API_KEY to .env

# Start ChromaDB
docker run -p 8000:8000 chromadb/chroma

# Crawl, build, and start
npm run crawl
npm run build
npm run start
```

## Installation

```bash
npm install -g @florexlabs/docs-mcp
```

Or use directly with npx:

```bash
npx @florexlabs/docs-mcp <command>
```

## Commands

### `docs-mcp init <url>`

Generate a new MCP server project from a documentation URL.

```bash
docs-mcp init https://docs.example.com --out ./my-docs-mcp
```

Options:
- `--out <dir>` — Output directory (default: `./docs-mcp-project`)
- `--depth <n>` — Crawl depth (default: `3`)
- `--limit <n>` — Max pages (default: `50`)
- `--provider <name>` — Embedding provider (default: `openai`)
- `--model <name>` — Embedding model (default: `text-embedding-3-small`)
- `--collection <name>` — Collection name (default: `docs`)

### `docs-mcp crawl <url>`

Crawl a documentation site, parse HTML to markdown, and chunk it.

```bash
docs-mcp crawl https://docs.example.com --out ./data --depth 3 --limit 50
```

Options:
- `--out <dir>` — Output directory (default: `./data`)
- `--depth <n>` — Crawl depth (default: `3`)
- `--limit <n>` — Max pages (default: `50`)
- `--verbose` — Verbose output

### `docs-mcp build`

Embed chunks and upsert into ChromaDB.

```bash
docs-mcp build --collection docs --data ./data
```

Options:
- `--collection <name>` — Collection name (default: `docs`)
- `--provider <name>` — Embedding provider (default: `openai`)
- `--model <name>` — Embedding model (default: `text-embedding-3-small`)
- `--data <dir>` — Data directory (default: `./data`)
- `--force` — Force rebuild
- `--verbose` — Verbose output

### `docs-mcp start`

Start the MCP server (stdio transport).

```bash
docs-mcp start --collection docs
```

### `docs-mcp dev`

Start the MCP server in development mode with logging.

```bash
docs-mcp dev --collection docs
```

## MCP Tools

The server exposes three tools:

| Tool | Description |
|------|-------------|
| `search_docs(query, topK?)` | Semantic search across indexed documentation |
| `get_source(url)` | Get all chunks from a specific source URL |
| `list_sources()` | List all indexed documentation sources |

## Connecting to MCP Clients

### Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "my-docs": {
      "command": "npx",
      "args": ["@florexlabs/docs-mcp", "start", "--collection", "docs"],
      "env": {
        "OPENAI_API_KEY": "sk-...",
        "CHROMA_URL": "http://localhost:8000"
      }
    }
  }
}
```

### Cursor

Add to `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "my-docs": {
      "command": "npx",
      "args": ["@florexlabs/docs-mcp", "start", "--collection", "docs"],
      "env": {
        "OPENAI_API_KEY": "sk-...",
        "CHROMA_URL": "http://localhost:8000"
      }
    }
  }
}
```

## Environment Variables

```
OPENAI_API_KEY=sk-...
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
CHROMA_URL=http://localhost:8000
```

## Prerequisites

- Node.js >= 18
- ChromaDB running (e.g., `docker run -p 8000:8000 chromadb/chroma`)
- OpenAI API key
- Playwright browsers: `npx playwright install chromium`

## Architecture

```
packages/
  cli/          — CLI commands (init, crawl, build, start, dev)
  crawler/      — Playwright-based same-origin doc crawler
  parser/       — HTML cleanup (Cheerio) + markdown conversion (Turndown)
  chunker/      — Heading-aware markdown chunking
  embeddings/   — OpenAI embeddings provider (extensible interface)
  vector-store/ — ChromaDB adapter
  mcp-server/   — MCP server with search tools
```

## Security Notes

- Only crawls same-origin links by default
- Never executes scraped content
- URLs are sanitized and normalized
- Do not crawl private documentation unless you understand where embeddings are sent
- Embeddings are sent to OpenAI's API — use local providers (Ollama) for sensitive content
- No shell execution from user-controlled input

## Development

```bash
pnpm install
pnpm test
pnpm build
```

## License

MIT
