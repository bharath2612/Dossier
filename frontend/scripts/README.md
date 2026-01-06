# Social Media Preview (OG Image) Generation

This folder contains tools to help you create the perfect social media preview image for Dossier AI.

## 🎯 Quick Start

Choose one of these three methods:

### Method 1: Automated Script (Recommended)
Automatically captures your landing page and creates the OG image.

```bash
# Install dependencies
npm install --save-dev puppeteer sharp

# Make sure your app is running
npm run dev

# Generate OG image
npm run generate:og
```

The script will create `frontend/public/og-image.png` automatically.

### Method 2: HTML Template
Use the pre-designed HTML template to create a custom OG image.

```bash
# Open the template in your browser
open scripts/og-image-template.html

# Click "Download Image" button
# Save the file as og-image.png in frontend/public/
```

### Method 3: Manual Design
Design your own OG image from scratch.

**Requirements:**
- Dimensions: 1200 x 630 pixels
- Format: PNG or JPG
- File name: `og-image.png`
- Location: `frontend/public/og-image.png`

**Design Tools:**
- Figma: https://figma.com
- Canva: https://canva.com
- Photoshop
- Any image editor

## 📋 What Makes a Good OG Image?

### Essential Elements
✅ Clear, readable headline (60px+ font size)  
✅ Your logo/branding  
✅ High contrast colors  
✅ Simple, focused message  
✅ 1200x630 dimensions (important!)  

### Avoid
❌ Small text (under 40px)  
❌ Too much information  
❌ Low contrast  
❌ Complex layouts  
❌ Dark images (may not render well)  

## 🧪 Testing Your OG Image

After creating your image, test it on these platforms:

1. **OpenGraph Preview**
   ```
   https://www.opengraph.xyz/
   ```

2. **LinkedIn Post Inspector**
   ```
   https://www.linkedin.com/post-inspector/
   ```

3. **Facebook Sharing Debugger**
   ```
   https://developers.facebook.com/tools/debug/
   ```

4. **Twitter Card Validator**
   ```
   https://cards-dev.twitter.com/validator
   ```

## 📱 How It Appears on Different Platforms

| Platform | Display Size | Notes |
|----------|-------------|--------|
| Facebook | 1200x630 | Full image shown |
| LinkedIn | 1200x627 | Full image shown |
| Twitter | 1200x628 | Large card format |
| WhatsApp | 1200x630 | Thumbnail preview |
| Slack | 1200x630 | Thumbnail preview |
| Discord | 1200x630 | Embed preview |

## 🔧 Troubleshooting

### "Image not updating on social media"
Social platforms cache OG images. Solutions:
- Clear cache on platform's developer tools (links above)
- Add version query parameter: `og-image.png?v=2`
- Wait 24-48 hours for natural cache expiry

### "Script fails to generate image"
Make sure:
- Your dev server is running (`npm run dev`)
- Dependencies are installed (`npm install --save-dev puppeteer sharp`)
- Port 3000 is accessible
- No firewall blocking localhost

### "Image dimensions are wrong"
- Always use exactly 1200x630 pixels
- Don't use responsive dimensions
- Export at 2x resolution for retina displays

## 🎨 Current Design

The HTML template (`og-image-template.html`) includes:
- Dossier AI branding
- Headline: "Research-backed presentations"
- Tagline: "Generate presentations backed by credible sources. No fluff."
- Clean, minimal design
- Brand colors (green accent)

Feel free to customize it to match your brand!

## 📝 Files in This Folder

- `generate-og-image.js` - Automated screenshot script
- `og-image-template.html` - Visual template for manual creation
- `README.md` - This file

## 🚀 After Creating Your Image

1. Verify the file exists: `frontend/public/og-image.png`
2. Check file size: Should be under 1MB (ideally under 300KB)
3. Test locally: Visit your site and view page source
4. Test with tools: Use the testing links above
5. Deploy: Push to production
6. Clear cache: Use platform debug tools to refresh

## 💡 Pro Tips

1. **Use your actual landing page**: The automated script captures your real site
2. **Test on mobile**: Many people share links on mobile devices
3. **Keep it simple**: Social thumbnails are small - don't overcomplicate
4. **Use brand colors**: Maintain consistency with your app
5. **Update seasonally**: Refresh your OG image for campaigns/seasons

## 🔗 Resources

- [OpenGraph Protocol](https://ogp.me/)
- [Twitter Cards Documentation](https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/abouts-cards)
- [Facebook Sharing Best Practices](https://developers.facebook.com/docs/sharing/webmasters/)

---

Need help? Check the main project documentation or create an issue.



