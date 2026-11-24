// news-image-20261124 entry (Node 22, standard library only).
// Validates the bundled 24 November 2026 broadsheet image and writes it deterministically to /output/entry.png.

import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const MAX_BYTES = 1_048_576;
const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const JPEG_MAGIC = Buffer.from([0xff, 0xd8, 0xff]);

const PNG_IEND = Buffer.from([0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82]);

function detectFormat(bytes: Buffer): 'PNG' | 'JPEG' {
  if (bytes.length === 0 || bytes.length > MAX_BYTES) {
    throw new Error(`entry.png size ${bytes.length} exceeds allowed 1..${MAX_BYTES} byte range`);
  }
  if (bytes.subarray(0, 8).equals(PNG_MAGIC)) {
    if (bytes.length < 20 || !bytes.subarray(bytes.length - 12).equals(PNG_IEND)) {
      throw new Error('entry.png has PNG header but missing IEND trailer');
    }
    return 'PNG';
  }
  if (bytes.subarray(0, 3).equals(JPEG_MAGIC)) {
    if (bytes.length < 5 || bytes[bytes.length - 2] !== 0xff || bytes[bytes.length - 1] !== 0xd9) {
      throw new Error('entry.png has JPEG header but missing EOI trailer');
    }
    return 'JPEG';
  }
  throw new Error('entry.png is neither a valid PNG nor a valid JPEG');
}

const sourceUrl = new URL('./entry.png', import.meta.url);
const payload = readFileSync(sourceUrl);
const format = detectFormat(payload);

const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
mkdirSync(outDir, { recursive: true });
const outFile = join(outDir, 'entry.png');
writeFileSync(outFile, payload);

const digest = createHash('sha256').update(payload).digest('hex');
process.stdout.write(`wrote ${outFile} (${format}, ${payload.length} bytes, sha256=${digest})\n`);
