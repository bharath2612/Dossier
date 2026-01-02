#!/usr/bin/env node

/**
 * Generate OG Image Script
 * 
 * This script helps you generate a social media preview image (OG image)
 * by taking a screenshot of your landing page.
 * 
 * Prerequisites:
 * npm install puppeteer sharp
 * 
 * Usage:
 * node scripts/generate-og-image.js
 */

const puppeteer = require('puppeteer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const OG_WIDTH = 1200;
const OG_HEIGHT = 630;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

async function generateOGImage() {
  console.log('🚀 Starting OG image generation...');
  console.log(`📸 Capturing screenshot from: ${APP_URL}`);

  let browser;
  try {
    // Launch browser
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    // Set viewport to a standard desktop size
    await page.setViewport({
      width: 1920,
      height: 1080,
      deviceScaleFactor: 2
    });

    // Navigate to the landing page
    await page.goto(APP_URL, {
      waitUntil: 'networkidle0',
      timeout: 30000
    });

    // Wait a bit for animations
    await page.waitForTimeout(2000);

    // Take full page screenshot
    const screenshotBuffer = await page.screenshot({
      type: 'png',
      fullPage: false
    });

    console.log('✂️  Resizing image to 1200x630...');

    // Resize and crop to OG image dimensions
    const outputPath = path.join(__dirname, '../public/og-image.png');
    await sharp(screenshotBuffer)
      .resize(OG_WIDTH, OG_HEIGHT, {
        fit: 'cover',
        position: 'top'
      })
      .png({ quality: 90 })
      .toFile(outputPath);

    console.log(`✅ OG image generated successfully at: ${outputPath}`);
    console.log('\n📋 Next steps:');
    console.log('1. Check the generated image at frontend/public/og-image.png');
    console.log('2. Test it using: https://www.opengraph.xyz/');
    console.log('3. Deploy your app to see it live on social media!');

  } catch (error) {
    console.error('❌ Error generating OG image:', error.message);
    console.error('\n💡 Troubleshooting:');
    console.error('1. Make sure your app is running at', APP_URL);
    console.error('2. Install dependencies: npm install puppeteer sharp');
    console.error('3. Try running: npm run dev (in another terminal)');
    process.exit(1);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Check if required packages are installed
try {
  require.resolve('puppeteer');
  require.resolve('sharp');
  generateOGImage();
} catch (error) {
  console.error('❌ Missing required packages!');
  console.error('\n📦 Please install dependencies:');
  console.error('npm install --save-dev puppeteer sharp');
  console.error('\nThen run this script again.');
  process.exit(1);
}





