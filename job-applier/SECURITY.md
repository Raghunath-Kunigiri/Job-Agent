# 🔒 Security Setup Guide

## ⚠️ IMPORTANT: Protect Your API Keys!

Your current `config.js` file contains your actual API key, which is a security risk if you commit it to Git.

## 🛡️ Secure Setup Steps:

### 1. Create a local `.env` file:
```bash
# In your job-applier directory
cp env.example .env
```

### 2. Edit `.env` with your actual values:
```env
GEMINI_API_KEY=AIzaSyD1kgLn9YauYuf0NaKZ7Y8jnKf8CePQlzk
PORT=3000
FIRST_NAME=Raghunath
LAST_NAME=Kunigiri
EMAIL=kunigiriraghun@example.com
LOCATION=St. Louis, MO
RESUME_PATH=./RAGHUNATH_KUNIGIRI.pdf
```

### 3. Install dotenv package:
```bash
npm install dotenv
```

### 4. Update your config.js to use the safer version:
Replace your current `config.js` with the content from `config.safe.js`

### 5. Load environment variables in your server:
Add this to the top of `server.js`:
```javascript
import 'dotenv/config';
```

## 🚫 What's Protected by .gitignore:

- ✅ `.env` files (your API keys)
- ✅ `config.js` (contains sensitive info)
- ✅ Resume files (personal documents)
- ✅ `node_modules/`
- ✅ Log files
- ✅ Playwright artifacts

## 📋 Before Committing to Git:

1. ✅ Check that `.gitignore` is working
2. ✅ Verify no API keys are in tracked files
3. ✅ Run: `git status` to see what will be committed
4. ✅ Your API key should NOT appear in any tracked files

## 🔍 Quick Security Check:
```bash
# This should NOT return any results:
grep -r "AIzaSy" . --exclude-dir=node_modules
```

If this finds your API key in tracked files, remove it before committing! 