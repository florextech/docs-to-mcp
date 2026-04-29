# @florexlabs/docs-mcp

Convert any documentation URL into a ready-to-run MCP server.

**100% local by default** — no API keys needed. Embeddings run locally with [Transformers.js](https://huggingface.co/docs/transformers.js).

```
URL → crawl → clean HTML → markdown → chunks → embeddings → vector store → MCP server
```

## Quick Start

```bash
# Initialize a project from a docs URL
npx @florexlabs/docs-mcp init https://docs.example.com --out ./my-docs-mcp

cd my-docs-mcp
npm install

# Start ChromaDB
docker run -p 8000:8000 chromadb/chroma

# Crawl, build, and start — no API keys needed!
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

## Embedding Providers

### Local (default)

Uses [Transformers.js](https://huggingface.co/docs/transformers.js) with the `Xenova/all-MiniLM-L6-v2` model. Runs 100% on your machine via ONNX runtime. No API keys, no external services, no cost.

```bash
docs-mcp build                                    # uses local by default
docs-mcp build --model Xenova/all-MiniLM-L6-v2    # explicit model
```

The model is downloaded automatically on first use (~80MB) and cached locally.

### OpenAI (opt-in)

For higher quality embeddings on large documentation sets, you can use OpenAI:

```bash
export OPENAI_API_KEY=sk-...
docs-mcp build --provider openai
docs-mcp build --provider openai --model text-embedding-3-large
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
- `--provider <name>` — Embedding provider: `local` or `openai` (default: `local`)
- `--model <name>` — Embedding model
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
docs-mcp build                          # local embeddings (default)
docs-mcp build --provider openai        # use OpenAI instead
```

Options:
- `--collection <name>` — Collection name (default: `docs`)
- `--provider <name>` — `local` or `openai` (default: `local`)
- `--model <name>` — Embedding model
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
        "CHROMA_URL": "http://localhost:8000"
      }
    }
  }
}
```

## Environment Variables

```
CHROMA_URL=http://localhost:8000

# Only needed with --provider openai:
OPENAI_API_KEY=sk-...
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
```

## Prerequisites

- Node.js >= 18
- ChromaDB running (e.g., `docker run -p 8000:8000 chromadb/chroma`)
- Playwright browsers: `npx playwright install chromium`
- No API keys needed for default local embeddings

## Architecture

```
packages/
  cli/          — CLI commands (init, crawl, build, start, dev)
  crawler/      — Playwright-based same-origin doc crawler
  parser/       — HTML cleanup (Cheerio) + markdown conversion (Turndown)
  chunker/      — Heading-aware markdown chunking
  embeddings/   — Local (Transformers.js) + OpenAI providers
  vector-store/ — ChromaDB adapter
  mcp-server/   — MCP server with search tools
```

## Security Notes

- Only crawls same-origin links by default
- Never executes scraped content
- URLs are sanitized and normalized
- Local embeddings stay on your machine — nothing leaves your network
- If using OpenAI, embeddings are sent to OpenAI's API
- Do not crawl private documentation unless you understand where data goes
- No shell execution from user-controlled input

## Development

```bash
pnpm install
pnpm test
pnpm build
```

## License

MIT
