# Complete Deployment Guide for yazamınakoyim

## Table of Contents
1. [Overview](#overview)
2. [Hosting Options](#hosting-options)
3. [Step-by-Step Deployment](#step-by-step-deployment)
4. [Domain Configuration](#domain-configuration)
5. [Environment Variables](#environment-variables)
6. [Supabase Configuration](#supabase-configuration)
7. [Post-Deployment Checklist](#post-deployment-checklist)
8. [Scalability & User Capacity](#scalability--user-capacity)
9. [Cost Estimates](#cost-estimates)
10. [Troubleshooting](#troubleshooting)

---

## Overview

This is a Next.js 16 application using:
- **Frontend/Backend**: Next.js 16 (App Router)
- **Database & Auth**: Supabase
- **Storage**: Supabase Storage (for media files)
- **Styling**: Tailwind CSS

**Recommended Hosting**: Vercel (made by Next.js creators, best integration)

---

## Hosting Options

### Option 1: Vercel (Recommended) ⭐
- **Pros**: 
  - Free tier available
  - Automatic deployments from Git
  - Built-in CDN
  - Perfect Next.js integration
  - Free SSL certificates
  - Custom domain support
- **Cons**: 
  - Free tier has usage limits
  - Serverless functions have execution time limits
- **Best for**: Most Next.js apps, including this one

### Option 2: Netlify
- **Pros**: Similar to Vercel, good Next.js support
- **Cons**: Slightly less optimized for Next.js
- **Best for**: Alternative to Vercel

### Option 3: Self-Hosted (VPS)
- **Pros**: Full control, no vendor lock-in
- **Cons**: Requires server management, more complex
- **Best for**: Advanced users, specific requirements

**This guide will focus on Vercel deployment (recommended).**

---

## Step-by-Step Deployment

### Phase 1: Prepare Your Code

#### Step 1.1: Update Cookie Settings for Production
- [ ] Open `utils/supabase/server.ts`
- [ ] Change `secure: false` to `secure: process.env.NODE_ENV === "production"`
- [ ] This ensures cookies work with HTTPS in production

#### Step 1.2: Update Middleware Cookie Settings
- [ ] Verify `utils/supabase/middleware.ts` has `secure: process.env.NODE_ENV === 'production'`
- [ ] This should already be correct

#### Step 1.3: Create `.env.example` file
Create a file named `.env.example` with:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

#### Step 1.4: Commit to Git
- [ ] Initialize git if not already: `git init`
- [ ] Add all files: `git add .`
- [ ] Commit: `git commit -m "Initial commit"`
- [ ] Create a GitHub/GitLab/Bitbucket repository
- [ ] Push code: `git push origin main`

---

### Phase 2: Deploy to Vercel

#### Step 2.1: Create Vercel Account
- [ ] Go to [vercel.com](https://vercel.com)
- [ ] Sign up with GitHub/GitLab/Bitbucket (recommended) or email

#### Step 2.2: Import Project
- [ ] Click "Add New Project"
- [ ] Import your Git repository
- [ ] Vercel will auto-detect Next.js

#### Step 2.3: Configure Build Settings
- [ ] **Framework Preset**: Next.js (auto-detected)
- [ ] **Root Directory**: `./` (default)
- [ ] **Build Command**: `npm run build` (default)
- [ ] **Output Directory**: `.next` (default)
- [ ] **Install Command**: `npm install` (default)

#### Step 2.4: Add Environment Variables
In Vercel project settings, add these environment variables:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

**Where to find these:**
- Go to Supabase Dashboard → Settings → API
- Copy "Project URL" → `NEXT_PUBLIC_SUPABASE_URL`
- Copy "anon public" key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

#### Step 2.5: Deploy
- [ ] Click "Deploy"
- [ ] Wait for build to complete (2-5 minutes)
- [ ] Your site will be live at `your-project.vercel.app`

---

### Phase 3: Domain Configuration

#### Step 3.1: Purchase Domain (if needed)
- [ ] Buy domain from: Namecheap, GoDaddy, Google Domains, etc.
- [ ] Note: Domain typically costs $10-15/year

#### Step 3.2: Add Domain to Vercel
- [ ] Go to Vercel project → Settings → Domains
- [ ] Click "Add Domain"
- [ ] Enter your domain (e.g., `yazaminakoyim.com`)
- [ ] Vercel will show DNS records to add

#### Step 3.3: Configure DNS Records
You have two options:

**Option A: Use Vercel's Nameservers (Easiest)**
- [ ] Go to your domain registrar
- [ ] Change nameservers to:
  ```
  ns1.vercel-dns.com
  ns2.vercel-dns.com
  ```
- [ ] Wait 24-48 hours for DNS propagation

**Option B: Add A/CNAME Records (More Control)**
- [ ] Add these DNS records at your domain registrar:
  - **Type**: A
  - **Name**: @
  - **Value**: 76.76.21.21 (Vercel's IP)
  
  OR
  
  - **Type**: CNAME
  - **Name**: @
  - **Value**: cname.vercel-dns.com

- [ ] For www subdomain:
  - **Type**: CNAME
  - **Name**: www
  - **Value**: cname.vercel-dns.com

#### Step 3.4: Wait for DNS Propagation
- [ ] DNS changes can take 24-48 hours
- [ ] Check status in Vercel dashboard
- [ ] Once verified, SSL certificate is automatically issued

#### Step 3.5: Verify Domain
- [ ] Vercel will automatically verify domain
- [ ] SSL certificate is issued automatically (free)
- [ ] Your site will be accessible at `https://yourdomain.com`

---

## Environment Variables

### Required Variables

Add these in Vercel → Project Settings → Environment Variables:

| Variable | Description | Where to Find |
|----------|-------------|---------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | Supabase Dashboard → Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | Supabase Dashboard → Settings → API → anon public key |

### Production vs Development

In Vercel, you can set different values for:
- **Production**: Live site
- **Preview**: Pull request previews
- **Development**: Local development (not used in Vercel)

**Set the same values for Production and Preview.**

---

## Supabase Configuration

### Step 1: Update Redirect URLs
- [ ] Go to Supabase Dashboard → Authentication → URL Configuration
- [ ] Add these **Redirect URLs**:
  ```
  https://yourdomain.com/auth/callback
  https://www.yourdomain.com/auth/callback
  https://your-project.vercel.app/auth/callback
  ```

### Step 2: Update Site URL
- [ ] In Supabase Dashboard → Authentication → URL Configuration
- [ ] Set **Site URL** to: `https://yourdomain.com`

### Step 3: Verify RLS Policies
- [ ] Ensure all Row Level Security (RLS) policies are enabled
- [ ] Test that public access works for posts, profiles, etc.

### Step 4: Storage Bucket Configuration
- [ ] Go to Storage → Buckets
- [ ] Verify `media` bucket exists
- [ ] Check bucket is public (if needed for media access)
- [ ] Verify CORS settings allow your domain

### Step 5: Database Migrations
Ensure all migrations are run:
- [ ] `setup_tags.sql` - For post tagging
- [ ] `setup_comment_tags.sql` - For comment tagging
- [ ] Any other migration files

---

## Post-Deployment Checklist

### Immediate Checks
- [ ] Site loads at `https://yourdomain.com`
- [ ] SSL certificate is active (green lock in browser)
- [ ] Can create account and login
- [ ] Can create posts
- [ ] Images/videos upload correctly
- [ ] Comments work
- [ ] Tagging works
- [ ] Notifications work
- [ ] Search works

### Functionality Tests
- [ ] Test on mobile device
- [ ] Test on different browsers (Chrome, Firefox, Safari, Edge)
- [ ] Test logout from different pages
- [ ] Test all navigation links
- [ ] Verify @mentions are clickable
- [ ] Test copy post link functionality

### Performance Checks
- [ ] Page load times are reasonable (< 3 seconds)
- [ ] Images load correctly
- [ ] No console errors
- [ ] Check Vercel Analytics (if enabled)

### Security Checks
- [ ] HTTPS is enforced
- [ ] Environment variables are not exposed in client code
- [ ] RLS policies are working correctly
- [ ] No sensitive data in browser console

---

## Scalability & User Capacity

### Vercel Free Tier Limits

**Bandwidth:**
- 100 GB/month
- **Estimated capacity**: ~10,000-50,000 page views/month (depending on media)

**Serverless Function Execution:**
- 100 GB-hours/month
- **Estimated capacity**: ~100,000-500,000 function invocations/month

**Build Time:**
- 6,000 build minutes/month
- **Estimated capacity**: ~100-200 deployments/month

### Vercel Pro Tier ($20/month)

**Bandwidth:**
- 1 TB/month
- **Estimated capacity**: ~100,000-500,000 page views/month

**Serverless Function Execution:**
- 1,000 GB-hours/month
- **Estimated capacity**: ~1,000,000-5,000,000 function invocations/month

### Supabase Free Tier Limits

**Database:**
- 500 MB database size
- 2 GB database bandwidth/month
- **Estimated capacity**: ~1,000-5,000 users with moderate activity

**Storage:**
- 1 GB file storage
- 2 GB storage bandwidth/month
- **Estimated capacity**: ~100-500 posts with images/videos

**Auth:**
- 50,000 monthly active users
- **Estimated capacity**: 50,000 users can sign up

**API Requests:**
- Unlimited (with rate limiting)
- **Estimated capacity**: Millions of requests/month

### Supabase Pro Tier ($25/month)

**Database:**
- 8 GB database size
- 50 GB database bandwidth/month
- **Estimated capacity**: ~10,000-50,000 active users

**Storage:**
- 100 GB file storage
- 200 GB storage bandwidth/month
- **Estimated capacity**: ~10,000-50,000 posts with media

**Auth:**
- 50,000 monthly active users (same as free)
- **Estimated capacity**: 50,000 users

### Real-World User Capacity Estimates

#### Free Tier (Vercel + Supabase Free)
- **Concurrent Users**: 50-100 simultaneous users
- **Daily Active Users**: 500-1,000 users
- **Monthly Active Users**: 5,000-10,000 users
- **Posts**: 1,000-5,000 posts total
- **Media Storage**: ~500-1,000 images/videos

**Best for**: Small communities, personal projects, early-stage apps

#### Pro Tier (Vercel Pro + Supabase Pro)
- **Concurrent Users**: 500-1,000 simultaneous users
- **Daily Active Users**: 5,000-10,000 users
- **Monthly Active Users**: 50,000+ users
- **Posts**: 50,000-100,000 posts total
- **Media Storage**: ~10,000-50,000 images/videos

**Best for**: Growing communities, established apps, moderate traffic

#### Enterprise/Scaling Beyond
- **Concurrent Users**: 10,000+ simultaneous users
- **Daily Active Users**: 100,000+ users
- **Monthly Active Users**: 500,000+ users
- **Posts**: Millions of posts
- **Media Storage**: Unlimited (with CDN)

**Requires**: 
- Vercel Enterprise plan
- Supabase Team/Enterprise plan
- CDN for media (Cloudflare, AWS CloudFront)
- Database optimization and caching

### Performance Optimization Tips

1. **Enable Image Optimization**
   - Next.js Image component is already used
   - Consider using Supabase Storage CDN

2. **Implement Caching**
   - Use Next.js caching for static content
   - Consider Redis for frequently accessed data

3. **Database Indexing**
   - Ensure all foreign keys are indexed
   - Add indexes for frequently queried columns

4. **Pagination**
   - Currently limited to 50 posts/comments
   - Consider implementing infinite scroll

5. **Media Optimization**
   - Compress images before upload
   - Use appropriate video formats
   - Consider transcoding for videos

---

## Cost Estimates

### Free Tier (Starting Out)
- **Vercel**: $0/month
- **Supabase**: $0/month
- **Domain**: $10-15/year
- **Total**: ~$1/month (just domain)

### Pro Tier (Growing)
- **Vercel Pro**: $20/month
- **Supabase Pro**: $25/month
- **Domain**: $10-15/year
- **Total**: ~$45/month

### Enterprise (Large Scale)
- **Vercel Enterprise**: Custom pricing ($500+/month)
- **Supabase Team**: $599/month
- **Domain**: $10-15/year
- **CDN**: $50-200/month
- **Total**: ~$1,000+/month

---

## Troubleshooting

### Common Issues

#### Issue 1: "Invalid API key" errors
**Solution**: 
- Verify environment variables in Vercel
- Ensure `NEXT_PUBLIC_` prefix is correct
- Redeploy after adding variables

#### Issue 2: Cookies not working
**Solution**:
- Verify `secure: process.env.NODE_ENV === "production"` in server.ts
- Check Supabase redirect URLs include your domain
- Ensure HTTPS is enabled

#### Issue 3: Images not loading
**Solution**:
- Check Supabase Storage bucket is public
- Verify CORS settings
- Check `next.config.js` has correct Supabase hostname

#### Issue 4: Build fails
**Solution**:
- Check build logs in Vercel
- Ensure all dependencies are in `package.json`
- Verify TypeScript errors are fixed
- Check environment variables are set

#### Issue 5: Domain not working
**Solution**:
- Wait 24-48 hours for DNS propagation
- Verify DNS records are correct
- Check domain status in Vercel dashboard
- Try accessing via `www.` subdomain

#### Issue 6: Slow performance
**Solution**:
- Enable Vercel Analytics to identify bottlenecks
- Check Supabase database performance
- Optimize images and media
- Consider upgrading to Pro tier

---

## Additional Recommendations

### Monitoring
- [ ] Set up Vercel Analytics (free)
- [ ] Enable Supabase monitoring
- [ ] Set up error tracking (Sentry, LogRocket)

### Backup Strategy
- [ ] Regular database backups (Supabase Pro includes this)
- [ ] Export important data periodically
- [ ] Keep code in Git repository

### Security
- [ ] Enable 2FA on Vercel account
- [ ] Enable 2FA on Supabase account
- [ ] Regularly update dependencies
- [ ] Review RLS policies periodically

### Performance
- [ ] Monitor API response times
- [ ] Optimize database queries
- [ ] Use CDN for static assets
- [ ] Implement caching where appropriate

---

## Quick Start Checklist

- [ ] Code committed to Git
- [ ] Vercel account created
- [ ] Project imported to Vercel
- [ ] Environment variables added
- [ ] First deployment successful
- [ ] Domain purchased (optional)
- [ ] Domain added to Vercel
- [ ] DNS records configured
- [ ] Supabase redirect URLs updated
- [ ] Site tested on production domain
- [ ] All features tested
- [ ] SSL certificate verified
- [ ] Monitoring set up

---

## Support Resources

- **Vercel Docs**: https://vercel.com/docs
- **Next.js Docs**: https://nextjs.org/docs
- **Supabase Docs**: https://supabase.com/docs
- **Vercel Support**: support@vercel.com
- **Supabase Support**: support@supabase.com

---

**Last Updated**: [Current Date]
**Version**: 1.0



