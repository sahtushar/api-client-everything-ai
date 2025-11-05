# Vercel Deployment Guide

## Production Domain
**URL:** https://api-client-everything-ai.vercel.app

## Environment Variables Setup

### Required Environment Variables

Set these in **Vercel Dashboard > Settings > Environment Variables**:

1. **OPENAI_API_KEY** (Required)
   ```
   your_openai_api_key_here
   ```

2. **NODE_ENV** (Optional, defaults to production)
   ```
   production
   ```

3. **CORS_ORIGINS** (Optional, defaults to *)
   ```
   *
   ```
   Or specify specific origins:
   ```
   chrome-extension://*,https://your-frontend.vercel.app
   ```

4. **PORT** (Optional, Vercel sets this automatically)
   ```
   3000
   ```

### How to Set Environment Variables in Vercel

1. Go to your Vercel project dashboard
2. Navigate to **Settings** > **Environment Variables**
3. Add each variable:
   - **Key:** `OPENAI_API_KEY`
   - **Value:** Your actual OpenAI API key
   - **Environment:** Select `Production`, `Preview`, and/or `Development` as needed
4. Click **Save**

## Deployment Steps

### Option 1: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy (first time)
vercel

# Deploy to production
vercel --prod
```

### Option 2: Deploy via GitHub Integration

1. Push your code to GitHub
2. Import the repository in Vercel Dashboard
3. Configure build settings:
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`
4. Add environment variables (see above)
5. Deploy

### Option 3: Deploy via Vercel Dashboard

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **Add New Project**
3. Import your Git repository
4. Configure settings:
   - Framework Preset: **Other**
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`
5. Add environment variables
6. Click **Deploy**

## API Endpoints

After deployment, your API will be available at:

- **Health Check:** `https://api-client-everything-ai.vercel.app/health`
- **Preprocess JD:** `https://api-client-everything-ai.vercel.app/api/preprocess/jd`
- **Preprocess Resume:** `https://api-client-everything-ai.vercel.app/api/preprocess/resume`
- **Analyze:** `https://api-client-everything-ai.vercel.app/api/analyze`

## Testing the Deployment

```bash
# Health check
curl https://api-client-everything-ai.vercel.app/health

# Test preprocess JD
curl -X POST https://api-client-everything-ai.vercel.app/api/preprocess/jd \
  -H "Content-Type: application/json" \
  -d '{"jd": "Software Engineer position..."}'
```

## Important Notes

1. **Serverless Functions:** Vercel runs Express as serverless functions. Each request may spin up a new instance, so cold starts are possible.

2. **Timeout:** Vercel has a 10-second timeout for Hobby plan, 60 seconds for Pro. OpenAI API calls may take longer, so consider upgrading if needed.

3. **Environment Variables:** Always set `OPENAI_API_KEY` in Vercel dashboard. Never commit API keys to Git.

4. **CORS:** Update `CORS_ORIGINS` to include your Chrome extension ID and any frontend domains.

5. **Build:** The `vercel.json` file configures the build process. Make sure `dist/app.js` is generated correctly.

## Troubleshooting

### Build Fails
- Check that `npm run build` works locally
- Ensure TypeScript compilation succeeds
- Check build logs in Vercel dashboard

### API Returns 500
- Check Vercel function logs
- Verify `OPENAI_API_KEY` is set correctly
- Check OpenAI API status

### CORS Errors
- Update `CORS_ORIGINS` environment variable
- Ensure Chrome extension origin is allowed
- Check Vercel function logs for CORS errors

## Updating Chrome Extension

Update your Chrome extension to use the production URL:

```typescript
const API_BASE_URL = 'https://api-client-everything-ai.vercel.app';
```

## Production Checklist

- [ ] Set `OPENAI_API_KEY` in Vercel dashboard
- [ ] Configure `CORS_ORIGINS` for your domains
- [ ] Test all API endpoints after deployment
- [ ] Update Chrome extension with production URL
- [ ] Monitor Vercel function logs for errors
- [ ] Set up error tracking (optional, e.g., Sentry)

