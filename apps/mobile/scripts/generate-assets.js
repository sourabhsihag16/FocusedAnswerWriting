#!/usr/bin/env node

/**
 * Script to generate placeholder assets for Expo app
 * Run: node scripts/generate-assets.js
 */

const fs = require('fs');
const path = require('path');

// Minimal 1x1 transparent PNG (base64 encoded)
const minimalPNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64'
);

// Create a simple colored PNG placeholder
// For a proper implementation, you'd use a library like 'sharp' or 'jimp'
// For now, we'll create a minimal valid PNG

function createPlaceholderImage(width, height, color = [70, 7, 20]) {
  // This is a minimal valid PNG - 1x1 pixel
  // In production, you'd want to use a proper image library
  // For now, we'll create the file and let the user replace it
  return minimalPNG;
}

const assetsDir = path.join(__dirname, '..', 'assets');
const soundsDir = path.join(assetsDir, 'sounds');

// Create directories
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}
if (!fs.existsSync(soundsDir)) {
  fs.mkdirSync(soundsDir, { recursive: true });
}

// Generate placeholder images
const assets = [
  { name: 'icon.png', size: 1024, description: 'App icon (1024x1024 recommended)' },
  { name: 'splash.png', size: 2048, description: 'Splash screen (2048x2048 recommended)' },
  { name: 'adaptive-icon.png', size: 1024, description: 'Android adaptive icon (1024x1024)' },
  { name: 'favicon.png', size: 48, description: 'Web favicon (48x48)' },
];

console.log('📦 Generating placeholder assets...\n');

assets.forEach((asset) => {
  const filePath = path.join(assetsDir, asset.name);
  
  if (!fs.existsSync(filePath)) {
    // Create a minimal PNG file
    fs.writeFileSync(filePath, createPlaceholderImage(asset.size, asset.size));
    console.log(`✅ Created ${asset.name} (${asset.description})`);
    console.log(`   ⚠️  This is a placeholder - replace with your actual ${asset.name}`);
  } else {
    console.log(`⏭️  ${asset.name} already exists, skipping...`);
  }
});

// Create placeholder sound file (empty WAV file header)
const beepWavPath = path.join(soundsDir, 'beep.wav');
if (!fs.existsSync(beepWavPath)) {
  // Minimal WAV file header (silent 1 second at 44.1kHz)
  const wavHeader = Buffer.alloc(44);
  wavHeader.write('RIFF', 0);
  wavHeader.writeUInt32LE(36, 4); // File size - 8
  wavHeader.write('WAVE', 8);
  wavHeader.write('fmt ', 12);
  wavHeader.writeUInt32LE(16, 16); // fmt chunk size
  wavHeader.writeUInt16LE(1, 20); // Audio format (PCM)
  wavHeader.writeUInt16LE(1, 22); // Number of channels
  wavHeader.writeUInt32LE(44100, 24); // Sample rate
  wavHeader.writeUInt32LE(88200, 28); // Byte rate
  wavHeader.writeUInt16LE(2, 32); // Block align
  wavHeader.writeUInt16LE(16, 34); // Bits per sample
  wavHeader.write('data', 36);
  wavHeader.writeUInt32LE(0, 40); // Data size (0 = silent)
  
  fs.writeFileSync(beepWavPath, wavHeader);
  console.log(`✅ Created beep.wav (placeholder - replace with actual sound)`);
} else {
  console.log(`⏭️  beep.wav already exists, skipping...`);
}

console.log('\n✨ Done!');
console.log('\n📝 Next steps:');
console.log('   1. Replace placeholder images with your actual assets');
console.log('   2. Replace beep.wav with your actual notification sound');
console.log('   3. Recommended sizes:');
console.log('      - icon.png: 1024x1024');
console.log('      - splash.png: 2048x2048');
console.log('      - adaptive-icon.png: 1024x1024 (foreground only)');
console.log('      - favicon.png: 48x48 or 192x192');
