# Basic Example: React Docs MCP Server

This example shows how to create an MCP server for the React documentation.

## Steps

```bash
# 1. Initialize the project
npx @florexlabs/docs-mcp init https://react.dev/learn --out ./react-docs-mcp

# 2. Setup
cd react-docs-mcp
npm install
cp .env.example .env
# Add your OPENAI_API_KEY to .env

# 3. Start ChromaDB
docker run -p 8000:8000 chromadb/chroma

# 4. Install Playwright browsers
npx playwright install chromium

# 5. Crawl React docs
npm run crawl

# 6. Build embeddings
npm run build

# 7. Start the MCP server
npm run start
```

## Connect to Claude Desktop

Add to your Claude Desktop config:

```json
{
  "mcpServers": {
    "react-docs": {
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

Then ask Claude: "How do I use useEffect in React?"
