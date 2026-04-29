#!/usr/bin/env node
import 'dotenv/config';
import { program } from 'commander';
import { crawl } from '@florexlabs/docs-mcp-crawler';
import { parse } from '@florexlabs/docs-mcp-parser';
import { chunk } from '@florexlabs/docs-mcp-chunker';
import { OpenAIEmbeddingProvider } from '@florexlabs/docs-mcp-embeddings';
import { ChromaVectorStore } from '@florexlabs/docs-mcp-vector-store';
import { startServer } from '@florexlabs/docs-mcp-server';
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';

program
  .name('docs-mcp')
  .version('0.1.0')
  .description('Convert documentation URLs into MCP servers');

program
  .command('init <url>')
  .description('Initialize a new docs-mcp project from a documentation URL')
  .option('--out <dir>', 'Output directory', './docs-mcp-project')
  .option('--depth <n>', 'Crawl depth', '3')
  .option('--limit <n>', 'Max pages', '50')
  .option('--provider <name>', 'Embedding provider', 'openai')
  .option('--model <name>', 'Embedding model', 'text-embedding-3-small')
  .option('--collection <name>', 'Collection name', 'docs')
  .action(async (url: string, opts) => {
    const outDir = resolve(opts.out);
    mkdirSync(join(outDir, 'src'), { recursive: true });
    mkdirSync(join(outDir, 'data'), { recursive: true });

    const config = {
      url,
      depth: parseInt(opts.depth),
      limit: parseInt(opts.limit),
      provider: opts.provider,
      model: opts.model,
      collection: opts.collection,
    };

    writeFileSync(
      join(outDir, 'docs-mcp.config.ts'),
      `export default ${JSON.stringify(config, null, 2)};\n`,
    );

    writeFileSync(
      join(outDir, '.env.example'),
      'OPENAI_API_KEY=\nOPENAI_EMBEDDING_MODEL=text-embedding-3-small\nCHROMA_URL=http://localhost:8000\n',
    );

    writeFileSync(
      join(outDir, 'package.json'),
      JSON.stringify(
        {
          name: 'my-docs-mcp',
          version: '0.1.0',
          private: true,
          type: 'module',
          scripts: {
            crawl: `docs-mcp crawl ${url} --out ./data --depth ${config.depth} --limit ${config.limit}`,
            build: `docs-mcp build --collection ${config.collection}`,
            start: `docs-mcp start --collection ${config.collection}`,
            dev: `docs-mcp dev --collection ${config.collection}`,
          },
          dependencies: {
            '@florexlabs/docs-mcp': '^0.1.0',
          },
        },
        null,
        2,
      ) + '\n',
    );

    writeFileSync(
      join(outDir, 'src', 'server.ts'),
      `import 'dotenv/config';
import { OpenAIEmbeddingProvider } from '@florexlabs/docs-mcp-embeddings';
import { ChromaVectorStore } from '@florexlabs/docs-mcp-vector-store';
import { startServer } from '@florexlabs/docs-mcp-server';

const store = new ChromaVectorStore(
  '${config.collection}',
  process.env.CHROMA_URL ?? 'http://localhost:8000',
);
const embeddings = new OpenAIEmbeddingProvider(
  process.env.OPENAI_API_KEY!,
  process.env.OPENAI_EMBEDDING_MODEL ?? '${config.model}',
);

startServer(store, embeddings);
`,
    );

    writeFileSync(
      join(outDir, 'src', 'config.ts'),
      `export default ${JSON.stringify(config, null, 2)};\n`,
    );

    writeFileSync(
      join(outDir, 'README.md'),
      `# My Docs MCP Server

MCP server for ${url}

## Setup

\`\`\`bash
npm install
cp .env.example .env
# Add your OPENAI_API_KEY to .env
\`\`\`

## Usage

\`\`\`bash
# 1. Start ChromaDB
docker run -p 8000:8000 chromadb/chroma

# 2. Crawl documentation
npm run crawl

# 3. Build embeddings
npm run build

# 4. Start MCP server
npm run start
\`\`\`

## Connect to Claude Desktop

Add to \`claude_desktop_config.json\`:

\`\`\`json
{
  "mcpServers": {
    "my-docs": {
      "command": "npx",
      "args": ["docs-mcp", "start", "--collection", "${config.collection}"]
    }
  }
}
\`\`\`
`,
    );

    console.log(`✅ Project initialized at ${outDir}`);
    console.log('Next steps:');
    console.log(`  cd ${opts.out}`);
    console.log('  npm install');
    console.log('  cp .env.example .env');
    console.log('  # Add your OPENAI_API_KEY');
    console.log('  npm run crawl');
    console.log('  npm run build');
    console.log('  npm run start');
  });

program
  .command('crawl <url>')
  .description('Crawl a documentation site')
  .option('--out <dir>', 'Output directory for crawled data', './data')
  .option('--depth <n>', 'Crawl depth', '3')
  .option('--limit <n>', 'Max pages to crawl', '50')
  .option('--verbose', 'Verbose output', false)
  .action(async (url: string, opts) => {
    const outDir = resolve(opts.out);
    mkdirSync(outDir, { recursive: true });

    console.log(`🕷️  Crawling ${url} (depth=${opts.depth}, limit=${opts.limit})`);
    const results = await crawl(url, {
      depth: parseInt(opts.depth),
      limit: parseInt(opts.limit),
      verbose: opts.verbose,
    });

    const parsed = results.map(parse);
    const allChunks = parsed.flatMap((doc) => chunk(doc));

    writeFileSync(
      join(outDir, 'crawl-results.json'),
      JSON.stringify(results, null, 2),
    );
    writeFileSync(
      join(outDir, 'parsed.json'),
      JSON.stringify(parsed, null, 2),
    );
    writeFileSync(
      join(outDir, 'chunks.json'),
      JSON.stringify(allChunks, null, 2),
    );

    console.log(`✅ Crawled ${results.length} pages → ${allChunks.length} chunks`);
    console.log(`   Saved to ${outDir}`);
  });

program
  .command('build')
  .description('Build embeddings and upsert into vector store')
  .option('--collection <name>', 'Collection name', 'docs')
  .option('--provider <name>', 'Embedding provider', 'openai')
  .option('--model <name>', 'Embedding model', 'text-embedding-3-small')
  .option('--data <dir>', 'Data directory with chunks.json', './data')
  .option('--force', 'Force rebuild', false)
  .option('--verbose', 'Verbose output', false)
  .action(async (opts) => {
    const dataDir = resolve(opts.data);
    const chunksPath = join(dataDir, 'chunks.json');

    if (!existsSync(chunksPath)) {
      console.error('❌ No chunks.json found. Run "docs-mcp crawl" first.');
      process.exit(1);
    }

    const { readFileSync } = await import('node:fs');
    const chunks = JSON.parse(readFileSync(chunksPath, 'utf-8'));

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error('❌ OPENAI_API_KEY not set');
      process.exit(1);
    }

    const embedder = new OpenAIEmbeddingProvider(apiKey, opts.model);
    const store = new ChromaVectorStore(
      opts.collection,
      process.env.CHROMA_URL ?? 'http://localhost:8000',
    );

    console.log(`🔨 Embedding ${chunks.length} chunks...`);
    const batchSize = 100;
    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize);
      const texts = batch.map((c: { content: string }) => c.content);
      const embeddings = await embedder.embedDocuments(texts);
      await store.upsert(batch, embeddings);
      if (opts.verbose) {
        console.log(`  Batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(chunks.length / batchSize)}`);
      }
    }

    console.log(`✅ Upserted ${chunks.length} chunks into "${opts.collection}"`);
  });

program
  .command('start')
  .description('Start the MCP server')
  .option('--collection <name>', 'Collection name', 'docs')
  .option('--provider <name>', 'Embedding provider', 'openai')
  .option('--model <name>', 'Embedding model', 'text-embedding-3-small')
  .action(async (opts) => {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error('❌ OPENAI_API_KEY not set');
      process.exit(1);
    }

    const store = new ChromaVectorStore(
      opts.collection,
      process.env.CHROMA_URL ?? 'http://localhost:8000',
    );
    const embedder = new OpenAIEmbeddingProvider(apiKey, opts.model);

    await startServer(store, embedder);
  });

program
  .command('dev')
  .description('Start the MCP server in development mode')
  .option('--collection <name>', 'Collection name', 'docs')
  .option('--provider <name>', 'Embedding provider', 'openai')
  .option('--model <name>', 'Embedding model', 'text-embedding-3-small')
  .action(async (opts) => {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error('❌ OPENAI_API_KEY not set');
      process.exit(1);
    }

    const store = new ChromaVectorStore(
      opts.collection,
      process.env.CHROMA_URL ?? 'http://localhost:8000',
    );
    const embedder = new OpenAIEmbeddingProvider(apiKey, opts.model);

    console.log('🚀 Starting MCP server in dev mode...');
    await startServer(store, embedder);
  });

program.parse();
