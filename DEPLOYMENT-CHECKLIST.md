# 🚀 Deployment Checklist - CORS & API Fixes

## Issues Fixed ✅

### 1. CORS Configuration
- ✅ Added proper CORS headers in backend
- ✅ Configured allowed origins for production
- ✅ Added OPTIONS preflight handler
- ✅ Updated vercel.json with CORS headers

### 2. Double Slash Bug
- ✅ Fixed API client to remove trailing slashes
- ✅ Prevents `/api/preprocess` from becoming `//api/preprocess`

### 3. Vercel Serverless Configuration
- ✅ Created proper API handler at `backend/api/index.js`
- ✅ Updated vercel.json with correct routing
- ✅ Added vercel-build script

### 4. OpenGraph Image
- ✅ Renamed og.png to og-image.png
- ✅ Updated metadata configuration

## 📝 Before Deploying

### Backend Environment Variables (Vercel)
Make sure these are set in your Vercel backend project settings:

```bash
# Anthropic API
ANTHROPIC_API_KEY=your_anthropic_api_key

# Brave Search API
BRAVE_SEARCH_API_KEY=your_brave_search_api_key

# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_supabase_service_key

# Node Environment
NODE_ENV=production
```

### Frontend Environment Variables (Vercel)
Make sure these are set in your Vercel frontend project settings:

```bash
# Backend API URL
NEXT_PUBLIC_API_URL=https://dossier-backend.vercel.app

# App URL
NEXT_PUBLIC_APP_URL=https://beautiful-pptx.vercel.app

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**⚠️ IMPORTANT**: Make sure `NEXT_PUBLIC_API_URL` does NOT have a trailing slash!
- ✅ Correct: `https://dossier-backend.vercel.app`
- ❌ Wrong: `https://dossier-backend.vercel.app/`

## 🚀 Deployment Steps

### 1. Deploy Backend First

```bash
cd backend
git add .
git commit -m "fix: CORS configuration and API routing for production"
git push origin main
```

Or if using Vercel CLI:
```bash
cd backend
vercel --prod
```

### 2. Deploy Frontend

```bash
cd frontend
git add .
git commit -m "fix: API client trailing slash and OG image"
git push origin main
```

Or if using Vercel CLI:
```bash
cd frontend
vercel --prod
```

### 3. Verify Environment Variables

**Backend (https://vercel.com/your-username/dossier-backend):**
- Go to Settings → Environment Variables
- Verify all keys are set for "Production"
- Redeploy if you added new variables

**Frontend (https://vercel.com/your-username/beautiful-pptx):**
- Go to Settings → Environment Variables
- Verify `NEXT_PUBLIC_API_URL` has NO trailing slash
- Verify `NEXT_PUBLIC_APP_URL` is correct
- Redeploy if you changed variables

### 4. Test the Deployment

1. **Open your frontend**: `https://beautiful-pptx.vercel.app`
2. **Open browser console** (F12)
3. **Enter a test prompt** and submit
4. **Check for errors**:
   - ✅ Should see successful API calls
   - ❌ If you still see CORS errors, check environment variables

### 5. Clear CORS Cache (if needed)

If you still see CORS errors after deployment:

1. **Hard refresh**: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
2. **Clear browser cache**
3. **Try incognito/private mode**
4. **Wait 2-3 minutes** for Vercel edge cache to update

## 🧪 Testing Checklist

After deployment, test these features:

- [ ] Landing page loads
- [ ] Enter a prompt and click Generate
- [ ] Outline generates successfully
- [ ] Generate full presentation works
- [ ] View presentation works
- [ ] Edit presentation works
- [ ] Export to PDF works
- [ ] Dashboard shows presentations
- [ ] Sign in/Sign out works
- [ ] OG image appears when sharing link on social media

## 🔍 Debugging

### If you get CORS errors:

1. **Check backend logs** in Vercel:
   ```
   https://vercel.com/your-username/dossier-backend/logs
   ```

2. **Check if API is responding**:
   ```bash
   curl https://dossier-backend.vercel.app/health
   ```

3. **Verify CORS headers**:
   ```bash
   curl -I -X OPTIONS https://dossier-backend.vercel.app/api/preprocess \
     -H "Origin: https://beautiful-pptx.vercel.app" \
     -H "Access-Control-Request-Method: POST"
   ```

   Should return headers including:
   ```
   Access-Control-Allow-Origin: *
   Access-Control-Allow-Methods: GET,OPTIONS,PATCH,DELETE,POST,PUT
   ```

### If you get 404 errors:

1. **Check vercel.json** is in the backend root
2. **Check api/index.js** exists and exports the app
3. **Verify build output** in dist folder

### If environment variables aren't working:

1. Go to Vercel project settings
2. Click "Redeploy" after adding variables
3. Variables starting with `NEXT_PUBLIC_` are exposed to the browser
4. Other variables are server-side only

## 📊 Monitoring

### Key Metrics to Watch:

1. **Backend Response Time**: Should be < 30s for outline generation
2. **CORS Errors**: Should be 0
3. **API Success Rate**: Should be > 95%
4. **Frontend Load Time**: Should be < 3s

### Vercel Analytics:

- Enable in project settings
- Monitor real user metrics
- Track API endpoints performance

## 🆘 Need Help?

If issues persist:

1. Check backend logs: `vercel logs --follow`
2. Check frontend logs: `vercel logs --follow`
3. Verify all environment variables are set
4. Try redeploying both projects
5. Check Vercel status: https://www.vercel-status.com/

---

## Summary of Changes

### Files Modified:

**Backend:**
- ✅ `src/index.ts` - Added CORS configuration
- ✅ `vercel.json` - Added CORS headers and routing
- ✅ `api/index.js` - Created serverless function handler
- ✅ `package.json` - Added vercel-build script

**Frontend:**
- ✅ `lib/api/client.ts` - Fixed trailing slash bug
- ✅ `app/layout.tsx` - Updated OG image metadata
- ✅ `public/og.png` → `public/og-image.png` - Renamed

### What This Fixes:

1. ✅ "CORS policy: Redirect is not allowed" - Fixed with proper CORS headers
2. ✅ "//api/preprocess" double slash - Fixed with trailing slash removal
3. ✅ Preflight OPTIONS requests - Fixed with OPTIONS handler
4. ✅ Vercel serverless routing - Fixed with proper vercel.json
5. ✅ Social media previews - Fixed with proper OG image

---

**Ready to deploy!** 🚀




