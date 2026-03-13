# Render Deployment Guide

## Prerequisites
- GitHub account with your code pushed
- Render account (free tier works)

## Step-by-Step Deployment

### 1. Create Render Account
1. Go to https://render.com
2. Sign up with GitHub (recommended)
3. Authorize Render to access your repositories

### 2. Create New Web Service
1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repository: `nishant-uxs/green_belt`
3. Configure the service:

**Basic Settings:**
- **Name**: `stellar-crowdfund` (or your preferred name)
- **Region**: Oregon (US West) or closest to you
- **Branch**: `master`
- **Root Directory**: Leave empty (or `.` if needed)
- **Runtime**: `Node`

**Build & Deploy Settings:**
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm run start`

**Environment Variables:**
- **NODE_VERSION**: `18.17.0`

### 3. Deploy
1. Click **"Create Web Service"**
2. Render will automatically:
   - Clone your repository
   - Install dependencies
   - Build your Next.js app
   - Start the production server
3. Wait 5-10 minutes for first deployment

### 4. Get Your Live URL
- Once deployed, you'll get a URL like: `https://stellar-crowdfund.onrender.com`
- Copy this URL for your README

### 5. Enable Auto-Deploy (Optional)
- Go to Settings → Build & Deploy
- Enable "Auto-Deploy" for automatic deployments on git push

## Troubleshooting

### Build Fails
- Check build logs in Render dashboard
- Ensure `package.json` has correct scripts
- Verify Node version compatibility

### App Doesn't Start
- Check start command is `npm run start`
- Ensure port binding (Next.js handles this automatically)

### Environment Variables
If you need custom environment variables:
1. Go to Environment tab
2. Add key-value pairs
3. Redeploy

## Free Tier Limitations
- App spins down after 15 minutes of inactivity
- First request after spin-down takes 30-60 seconds
- 750 hours/month free

## Next Steps
After deployment:
1. Test your live URL
2. Update README with live demo link
3. Take screenshots for submission
