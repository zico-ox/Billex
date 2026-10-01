import fs from 'fs';
import zlib from 'zlib';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function createPng(width, height, drawFn) {
  const rowSize = width * 4 + 1; // 1 filter byte per row (0 = None)
  const buffer = Buffer.alloc(rowSize * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    buffer[rowOffset] = 0; // Filter None
    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      const [r, g, b, a] = drawFn(x, y, width, height);
      buffer[pxOffset] = r;
      buffer[pxOffset + 1] = g;
      buffer[pxOffset + 2] = b;
      buffer[pxOffset + 3] = a;
    }
  }

  const idatData = zlib.deflateSync(buffer);

  // Precomputed CRC table
  let crcTable;
  function getCrcTable() {
    if (!crcTable) {
      crcTable = new Int32Array(256);
      for (let n = 0; n < 256; n++) {
        let t = n;
        for (let k = 0; k < 8; k++) {
          t = (t & 1) ? (0xedb88320 ^ (t >>> 1)) : (t >>> 1);
        }
        crcTable[n] = t;
      }
    }
    return crcTable;
  }

  function crc32(buf) {
    const table = getCrcTable();
    let c = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      c = table[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
    }
    return (c ^ 0xffffffff);
  }

  function chunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const body = Buffer.concat([typeBuf, data]);
    const crc = Buffer.alloc(4);
    crc.writeInt32BE(crc32(body), 0);
    return Buffer.concat([len, body, crc]);
  }

  // Header
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  const ihdrChunk = chunk('IHDR', ihdr);
  const idatChunk = chunk('IDAT', idatData);
  const iendChunk = chunk('IEND', Buffer.alloc(0));

  return Buffer.concat([sig, ihdrChunk, idatChunk, iendChunk]);
}

// Draw Weknd icon
function drawWekndIcon(x, y, w, h, isMaskable = false) {
  const cx = w / 2;
  const cy = h / 2;
  const cornerR = w * (isMaskable ? 0.18 : 0.22);

  const dx = Math.abs(x - cx);
  const dy = Math.abs(y - cy);

  // Rounded rectangle SDF
  const qx = Math.max(0, dx - (w / 2 - cornerR - (isMaskable ? 0 : w * 0.04)));
  const qy = Math.max(0, dy - (h / 2 - cornerR - (isMaskable ? 0 : h * 0.04)));
  const dist = Math.sqrt(qx * qx + qy * qy);

  if (dist > cornerR) {
    if (isMaskable) {
      return [141, 94, 60, 255];
    }
    const edgeAlpha = Math.max(0, Math.min(1, 1 - (dist - cornerR)));
    if (edgeAlpha <= 0) return [0, 0, 0, 0];
    return [141, 94, 60, Math.round(edgeAlpha * 255)];
  }

  // Inside rounded card: Warm brown gradient (#8d5e3c to #5c3a21)
  const gradY = y / h;
  const baseR = Math.round(141 * (1 - gradY * 0.28));
  const baseG = Math.round(94 * (1 - gradY * 0.28));
  const baseB = Math.round(60 * (1 - gradY * 0.28));

  // Golden accent border ring
  const borderDist = cornerR - dist;
  if (borderDist < w * 0.025 && !isMaskable) {
    return [245, 158, 11, 255]; // Gold #f59e0b
  }

  // Draw stylized letter "W"
  const nx = (x - cx) / (w * 0.36);
  const ny = (y - cy) / (h * 0.32);

  const thickness = 0.22;

  function distToSegment(px, py, x1, y1, x2, y2) {
    const l2 = (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
    if (l2 === 0) return Math.hypot(px - x1, py - y1);
    let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(px - (x1 + t * (x2 - x1)), py - (y1 + t * (y2 - y1)));
  }

  const d1 = distToSegment(nx, ny, -0.85, -0.65, -0.45, 0.65);
  const d2 = distToSegment(nx, ny, -0.45, 0.65, 0.0, -0.15);
  const d3 = distToSegment(nx, ny, 0.0, -0.15, 0.45, 0.65);
  const d4 = distToSegment(nx, ny, 0.45, 0.65, 0.85, -0.65);
  const minWDist = Math.min(d1, d2, d3, d4);

  // Dot for "W."
  const dotDist = Math.hypot(nx - 1.05, ny - 0.55);

  if (minWDist < thickness || dotDist < 0.16) {
    if (minWDist > thickness - 0.03 && dotDist >= 0.16) {
      return [254, 243, 199, 255];
    }
    return [255, 255, 255, 255];
  }

  // Golden accent bar
  if (ny > 0.82 && ny < 0.98 && Math.abs(nx) < 0.65) {
    return [245, 158, 11, 255];
  }

  return [baseR, baseG, baseB, 255];
}

const publicDir = path.join(__dirname, 'public');

console.log('Generating PWA icons in:', publicDir);

const icon192 = createPng(192, 192, (x, y, w, h) => drawWekndIcon(x, y, w, h, false));
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), icon192);

const icon512 = createPng(512, 512, (x, y, w, h) => drawWekndIcon(x, y, w, h, false));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), icon512);

const iconMaskable = createPng(512, 512, (x, y, w, h) => drawWekndIcon(x, y, w, h, true));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), iconMaskable);

const appleTouch = createPng(180, 180, (x, y, w, h) => drawWekndIcon(x, y, w, h, false));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), appleTouch);

console.log('All icons generated successfully!');
