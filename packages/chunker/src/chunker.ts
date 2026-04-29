import { createHash } from 'node:crypto';
import type { ParsedDocument, Chunk } from '@florexlabs/docs-mcp-types';

export interface ChunkOptions {
  maxSize?: number;
  minSize?: number;
}

export function chunk(
  doc: ParsedDocument,
  options: ChunkOptions = {},
): Chunk[] {
  const { maxSize = 1500, minSize = 50 } = options;
  const lines = doc.markdown.split('\n');
  const chunks: Chunk[] = [];
  let currentHeading = '';
  let buffer = '';

  const flush = () => {
    const content = buffer.trim();
    if (content.length >= minSize) {
      chunks.push({
        id: createHash('sha256')
          .update(doc.url + currentHeading + content)
          .digest('hex')
          .slice(0, 16),
        content,
        metadata: {
          url: doc.url,
          title: doc.title,
          heading: currentHeading || undefined,
        },
      });
    }
    buffer = '';
  };

  for (const line of lines) {
    const headingMatch = line.match(/^(#{1,3})\s+(.+)/);
    if (headingMatch) {
      flush();
      currentHeading = headingMatch[2].trim();
      buffer = line + '\n';
      continue;
    }

    if (buffer.length + line.length + 1 > maxSize) {
      flush();
    }
    buffer += line + '\n';
  }
  flush();

  return chunks;
}
