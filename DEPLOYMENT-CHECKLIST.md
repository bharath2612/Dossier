# Deployment Checklist

Quick reference guide for deploying Dossier to production.

## Prerequisites

- Node.js >= 18.0.0
- Supabase account and project
- Anthropic API key
- Brave Search API key (optional)
- Deployment platform account (Vercel, Railway, Render, etc.)

## Environment Variables

### Backend

```bash
ANTHROPIC_API_KEY=your_anthropic_api_key
BRAVE_SEARCH_API_KEY=your_brave_search_api_key
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
PORT=8080
NODE_ENV=production
CORS_ORIGIN=https://your-frontend-domain.com
```

### Frontend

```bash
NEXT_PUBLIC_API_URL=https://your-backend-domain.com  # No trailing slash!
NEXT_PUBLIC_APP_URL=https://your-frontend-domain.com
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Deployment Steps

1. **Deploy Backend**
   - Build: `cd backend && npm install && npm run build`
   - Deploy to your platform (Vercel, Railway, Render, etc.)
   - Note the backend URL

2. **Deploy Frontend**
   - Set `NEXT_PUBLIC_API_URL` to your backend URL (no trailing slash)
   - Build: `cd frontend && npm install && npm run build`
   - Deploy to your platform

3. **Configure CORS**
   - Set backend `CORS_ORIGIN` to your frontend URL
   - Redeploy backend if needed

4. **Verify**
   - Check backend: `https://your-backend-url.com/health`
   - Test frontend and core features

## Post-Deployment Checklist

- [ ] Backend health endpoint responds
- [ ] Frontend loads without errors
- [ ] Outline generation works
- [ ] Presentation generation works
- [ ] Authentication works
- [ ] No CORS errors in browser console

## Common Issues

**CORS Errors**: Verify `CORS_ORIGIN` matches your frontend URL exactly

**404 Errors**: Check routing configuration and build output

**Environment Variables**: Redeploy after changing variables. `NEXT_PUBLIC_*` vars are exposed to browser.

## Security

- Never commit `.env` files
- Use strong API keys
- Configure CORS properly (avoid `*` in production)
- Use HTTPS everywhere

For detailed setup instructions, see [README.md](README.md).
