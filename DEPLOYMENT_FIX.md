# 🚀 Deployment Fix Guide - Avenu Vercel

## Problem: Website Won't Load on Vercel

If your website keeps showing "avenu.sale" but never loads, the issue is likely one of these:

### 1. **Missing Environment Variables** (Most Common)

The Supabase credentials are not set on Vercel.

#### How to Fix:

1. Go to **Vercel Project Settings** → **Environment Variables**
2. Add these variables:

```
VITE_SUPABASE_URL = https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY = your-anon-key-here
VITE_AUTH_REDIRECT_URL = https://www.avenu.sale
```

3. **Get these values from Supabase:**
   - Go to [supabase.com](https://supabase.com) → Your Project
   - Click **Settings** → **API**
   - Copy the `Project URL` and `Anon Key`

4. **Redeploy on Vercel:**
   - After adding env vars, redeploy by pushing to your repo or clicking "Redeploy" in Vercel

---

### 2. **Diagnostic Information**

When the site loads, look for a small **colored box in the bottom-right corner**:

- **🟢 Green box "✓ App Ready"** = Everything is configured correctly
- **🔴 Red box "⚠ Config Issue"** = Missing environment variables

If you see the red box, copy the error message and apply the fix in step 1.

---

### 3. **What Changed in This Update**

✅ **Better error handling** - Shows "Loading…" instead of blank page  
✅ **Diagnostic indicator** - Displays config status in bottom-right  
✅ **Fallback UI** - Site works without Supabase (shows fallback catalog)  
✅ **Safety timeouts** - Never hangs indefinitely  

---

### 4. **Testing Locally**

Before deploying, test locally:

```bash
# Create .env.local with your Supabase credentials
cp .env.example .env.local

# Edit .env.local and add your Supabase URL and Anon Key
# Then start dev server:
npm run dev
```

You should see the site load with:
- The 3D crystal background
- Products from your Supabase database
- Or fallback products if Supabase isn't configured

---

### 5. **Still Not Working?**

Check the **browser console** (F12 or Cmd+Option+I):

1. Open Developer Tools
2. Go to **Console** tab
3. Look for red error messages
4. Common errors and fixes:

| Error | Fix |
|-------|-----|
| "Database request timed out" | Supabase is slow/offline - uses cached catalog |
| "Missing Supabase URL" | Set `VITE_SUPABASE_URL` in Vercel env vars |
| "CORS error" | Check Supabase auth redirect URLs |
| "ReferenceError: xxx is not defined" | Refresh page (F5) |

---

### 6. **Vercel Deployment Checklist**

- [ ] Supabase project created
- [ ] API credentials copied to `.env.example`
- [ ] Environment variables added to Vercel project settings
- [ ] Domain verified in Supabase Auth → Redirect URLs
- [ ] Code pushed to git repo connected to Vercel
- [ ] Vercel redeploy triggered (new env vars picked up)
- [ ] Visit your domain and check the diagnostic box

---

### 7. **Quick Vercel Setup**

1. **Go to Vercel:** [vercel.com/dashboard](https://vercel.com/dashboard)
2. **Click your Avenu project**
3. **Settings tab** → **Environment Variables**
4. **Add the three variables** from step 1
5. **Deployments tab** → **Redeploy**
6. **Wait ~2-3 minutes** for deployment
7. **Visit your domain** - should load with diagnostic indicator

---

### 8. **Contact Support**

If still stuck:

1. Check the **diagnostic box** (bottom-right) - what does it say?
2. Check **browser console** (F12) - any red errors?
3. Share:
   - The diagnostic message
   - The console error (if any)
   - Your domain name

Good luck! 🍪
