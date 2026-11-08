import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function createPNG(width, height, drawPixel) {
  // Raw scanlines: width * 4 + 1 filter byte per line
  const rowSize = width * 4 + 1;
  const rawData = Buffer.alloc(rowSize * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter type 0 (None)
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = drawPixel(x, y, width, height);
      const pixelOffset = rowOffset + 1 + x * 4;
      rawData[pixelOffset] = r;
      rawData[pixelOffset + 1] = g;
      rawData[pixelOffset + 2] = b;
      rawData[pixelOffset + 3] = a;
    }
  }

  const compressed = zlib.deflateSync(rawData);

  // Helper for writing chunk
  function makeChunk(type, data) {
    const typeBuf = Buffer.from(type, 'ascii');
    const lenBuf = Buffer.alloc(4);
    lenBuf.writeUInt32BE(data.length, 0);
    const body = Buffer.concat([typeBuf, data]);
    const crc = zlib.crc32(body);
    const crcBuf = Buffer.alloc(4);
    crcBuf.writeUInt32BE(crc >>> 0, 0);
    return Buffer.concat([lenBuf, body, crcBuf]);
  }

  // PNG Signature
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // IHDR chunk: 13 bytes
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // 8 bits per channel
  ihdr[9] = 6; // RGBA color type
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  const ihdrChunk = makeChunk('IHDR', ihdr);
  const idatChunk = makeChunk('IDAT', compressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// Ensure public directory exists
const publicDir = path.resolve(process.cwd(), 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Drawer function: Nafas glowing acoustic wave & baby heart emblem
function drawIconPixel(x, y, w, h, isMaskable = false) {
  const cx = w / 2;
  const cy = h / 2;
  const maxR = w / 2;
  const dx = x - cx;
  const dy = y - cy;
  const dist = Math.sqrt(dx * dx + dy * dy);

  // Background: gradient from indigo-900 (#1e1b4b) to violet-950 (#0f172a)
  const normY = y / h;
  let bgR = Math.round(30 + normY * 15);
  let bgG = Math.round(27 + normY * 10);
  let bgB = Math.round(75 + normY * 20);

  // For non-maskable icons, give gentle rounded corners
  if (!isMaskable) {
    const cornerR = w * 0.22;
    // Check if pixel is within rounded rect
    const rx = Math.abs(x - cx);
    const ry = Math.abs(y - cy);
    const innerW = w / 2 - cornerR;
    const innerH = h / 2 - cornerR;
    if (rx > innerW && ry > innerH) {
      const cDist = Math.hypot(rx - innerW, ry - innerH);
      if (cDist > cornerR) {
        return [0, 0, 0, 0]; // Transparent outside rounded corner
      }
    }
  }

  // Safe scale for maskable (central 70%) vs standard (80%)
  const scale = (isMaskable ? 0.35 : 0.42) * w;

  // Glow halo in center
  const halo = Math.max(0, 1 - dist / (scale * 1.6));
  bgR = Math.min(255, Math.round(bgR + halo * 30));
  bgG = Math.min(255, Math.round(bgG + halo * 40));
  bgB = Math.min(255, Math.round(bgB + halo * 80));

  // Infant Acoustic Logo elements:
  // 1. Central acoustic rings (concentric sound waves)
  const ring1 = Math.abs(dist - scale * 0.75);
  const ring2 = Math.abs(dist - scale * 0.45);
  const inSoundAngle = Math.abs(dx) > 0.1 ? Math.atan2(dy, dx) : 0;

  // Wave ripple
  const waveVal = Math.sin((x / w) * 16 + (y / h) * 4);
  const isAcousticBar = Math.abs(dy) < scale * 0.6 && Math.abs(Math.sin((x - cx) / (scale * 0.2))) < 0.35;

  // Draw infant face / serene sleeping profile
  // Head circle: center slightly above middle
  const headCy = cy - scale * 0.15;
  const headDist = Math.hypot(dx, y - headCy);
  const headR = scale * 0.42;

  // Womb / Sound pulse wave line through center
  const pulseY = cy + Math.sin(dx / (scale * 0.25)) * (scale * 0.25) * Math.exp(-Math.pow(dx / (scale * 0.8), 2));
  const distToPulse = Math.abs(y - pulseY);

  if (distToPulse < scale * 0.08 && Math.abs(dx) < scale * 0.9) {
    // Glowing acoustic pulse line (Cyan / Electric Violet)
    return [99, 102, 241, 255]; // Indigo-500
  }

  // Sleeping infant crescent / head arc
  if (Math.abs(headDist - headR) < scale * 0.08 && y < headCy + headR * 0.5) {
    // Gentle golden/rose glow
    return [251, 191, 36, 255]; // Amber-400
  }

  // Sweet closed eye arc
  const eyeDx = dx - scale * 0.08;
  const eyeDy = y - (headCy + scale * 0.05);
  const eyeDist = Math.hypot(eyeDx, eyeDy);
  if (Math.abs(eyeDist - scale * 0.1) < scale * 0.04 && eyeDy > 0 && Math.abs(eyeDx) < scale * 0.09) {
    return [244, 244, 245, 255]; // Soft white
  }

  // Soundwave radiating dots
  if (Math.abs(ring1) < scale * 0.04 && (Math.abs(dx) > scale * 0.4 || dy > scale * 0.3)) {
    return [168, 85, 247, 200]; // Purple-500
  }

  return [bgR, bgG, bgB, 255];
}

// Generate PNG files
console.log('Generating PWA icons...');
const png192 = createPNG(192, 192, (x, y, w, h) => drawIconPixel(x, y, w, h, false));
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), png192);

const png512 = createPNG(512, 512, (x, y, w, h) => drawIconPixel(x, y, w, h, false));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), png512);

const pngMaskable = createPNG(512, 512, (x, y, w, h) => drawIconPixel(x, y, w, h, true));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), pngMaskable);

const appleTouch = createPNG(180, 180, (x, y, w, h) => drawIconPixel(x, y, w, h, false));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), appleTouch);

const favicon = createPNG(32, 32, (x, y, w, h) => drawIconPixel(x, y, w, h, false));
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), favicon);

// Generate Vector SVG
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="none">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#312E81"/>
      <stop offset="50%" stop-color="#1E1B4B"/>
      <stop offset="100%" stop-color="#0F172A"/>
    </linearGradient>
    <linearGradient id="neonPulse" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#06B6D4"/>
      <stop offset="50%" stop-color="#6366F1"/>
      <stop offset="100%" stop-color="#EC4899"/>
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="8" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>
  <rect width="512" height="512" rx="112" fill="url(#bg)"/>
  <circle cx="256" cy="256" r="180" stroke="#4F46E5" stroke-width="2" stroke-opacity="0.3" stroke-dasharray="8 8"/>
  <circle cx="256" cy="256" r="140" stroke="#818CF8" stroke-width="1.5" stroke-opacity="0.25"/>
  <!-- Sleeping infant halo / crescent -->
  <path d="M 256 150 C 315 150 355 195 355 256 C 355 317 315 362 256 362 C 205 362 175 325 170 290" 
        stroke="#F59E0B" stroke-width="8" stroke-linecap="round" fill="none" filter="url(#glow)"/>
  <!-- Sleeping eye -->
  <path d="M 230 240 Q 250 255 270 240" stroke="#F1F5F9" stroke-width="6" stroke-linecap="round" fill="none"/>
  <!-- ECG / Acoustic pulse -->
  <path d="M 120 280 L 190 280 L 210 240 L 235 320 L 265 210 L 290 310 L 310 265 L 330 280 L 392 280" 
        stroke="url(#neonPulse)" stroke-width="10" stroke-linecap="round" stroke-linejoin="round" filter="url(#glow)"/>
</svg>`;

fs.writeFileSync(path.join(publicDir, 'icon.svg'), svgContent, 'utf-8');
console.log('Icons created successfully in /public');
