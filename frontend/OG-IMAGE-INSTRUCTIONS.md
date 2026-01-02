# OpenGraph Image Instructions

## Required Image Specifications

To ensure your social media previews look great on all platforms, you need to create an OG image with these specifications:

### Image Requirements
- **Filename**: `og-image.png`
- **Location**: `/frontend/public/og-image.png`
- **Dimensions**: 1200 x 630 pixels (1.91:1 aspect ratio)
- **Format**: PNG or JPG
- **File Size**: Under 8MB (ideally under 1MB for faster loading)
- **Content**: Should showcase the key value proposition of Dossier AI

### Recommended Content
Your OG image should include:
- The Dossier AI logo
- Main headline: "Research-backed presentations"
- Tagline: "Generate presentations backed by credible sources. No fluff."
- Clean, professional design with good contrast
- Avoid text smaller than 40px (it won't be readable in thumbnails)

### How to Create the OG Image

#### Option 1: Using a Design Tool
1. Open Figma, Canva, or Photoshop
2. Create a new canvas: 1200 x 630 pixels
3. Design your image with the recommended content above
4. Export as PNG
5. Save to: `frontend/public/og-image.png`

#### Option 2: Screenshot Method (Quick)
1. Take a screenshot of your landing page
2. Crop/resize to 1200 x 630 pixels using an image editor
3. Save as `og-image.png` in the `frontend/public/` folder

#### Option 3: Use a Screenshot Tool
```bash
# If you have a Mac, you can use the built-in screenshot tool
# Take a full-page screenshot and crop it to 1200x630

# Or use a tool like:
npm install -g pageres-cli
pageres https://your-domain.com 1200x630 --filename=og-image
mv og-image.png frontend/public/
```

### Testing Your OG Image

After adding your image, test it on these platforms:

1. **LinkedIn Post Inspector**
   - https://www.linkedin.com/post-inspector/

2. **Facebook Sharing Debugger**
   - https://developers.facebook.com/tools/debug/

3. **Twitter Card Validator**
   - https://cards-dev.twitter.com/validator

4. **OpenGraph Preview Tool**
   - https://www.opengraph.xyz/

### Platform-Specific Display Areas

- **Facebook/LinkedIn**: Full 1200x630 image displayed
- **Twitter Large Card**: Full image with 2:1 ratio
- **WhatsApp**: 1200x630 thumbnail
- **Slack**: 1200x630 thumbnail

## Current Setup

Your metadata is already configured in `app/layout.tsx` with:
- OpenGraph tags for Facebook, LinkedIn
- Twitter Card tags
- Proper dimensions and alt text
- Fallback to app URL

Just add the `og-image.png` file to the `public` folder and you're done!


