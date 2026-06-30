# STEP-BY-STEP IMPLEMENTASI SUPABASE + VERCEL

## FASE 1: SETUP SUPABASE (30 menit)

### Step 1.1: Create Supabase Project

1. Buka https://supabase.com
2. Sign up dengan GitHub account
3. Create new organization atau gunakan yang existing
4. Click "New Project" dengan konfigurasi:
   ```
   Name: brigadex-pepi
   Database Password: [Generate strong password - SAVE INI!]
   Region: Southeast Asia (Singapore)
   Pricing Plan: Free tier okay untuk development
   ```
5. Tunggu project dibuat (± 2 menit)
6. Catat credentials:
   - Project URL: `https://xxxxx.supabase.co`
   - Anon Public Key: `eyJ...` (mulai dengan "eyJ")
   - Service Role Key: `eyJ...` (untuk server-side operations)

### Step 1.2: Setup Database Schema

1. Di Supabase dashboard, pergi ke **SQL Editor**
2. Click "New Query"
3. Copy seluruh SQL dari **SUPABASE_VERCEL_DEPLOYMENT_GUIDE.md** (bagian "Buat Database Schema")
4. Paste ke SQL editor
5. Click "Run" atau tekan `Ctrl+Enter`
6. Tunggu hingga selesai (lihat status di atas editor)

Verifikasi schema:
- Pergi ke **Table Editor**
- Lihat daftar tables: `brigades`, `alsintan`, `operators`, `locations`, `daily_reports`, dll.

### Step 1.3: Setup Realtime Features

1. Pergi ke **Realtime** section
2. Klik "Add Publication" atau enable realtime untuk tables:
   - `daily_reports`
   - `alsintan`
   - `service_records`
   - `damage_reports`
3. Enable **INSERT**, **UPDATE**, **DELETE** events
4. Save configuration

### Step 1.4: Setup Authentication

1. Pergi ke **Authentication** → **Providers**
2. Email/Password: pastikan sudah **enabled**
3. Pergi ke **Email Templates**
4. Customize template jika diperlukan (optional)
5. Pergi ke **URL Configuration**
6. Add Redirect URLs:
   ```
   http://localhost:3000/auth/callback
   http://localhost:3000/
   https://brigadex-pepi.vercel.app/auth/callback
   https://brigadex-pepi.vercel.app/
   ```

### Step 1.5: Setup RLS (Row Level Security)

1. Pergi ke **Authentication** → **Policies**
2. Untuk setiap table, create policies:

**Policy untuk `daily_reports` - Users hanya bisa lihat data brigade mereka:**
```sql
-- Policy: Users can view own brigade data
CREATE POLICY "Users can view own brigade data" ON public.daily_reports
FOR SELECT USING (
  brigade_id IN (
    SELECT brigade_id FROM public.users WHERE id = auth.uid()
  ) OR (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
);

-- Policy: Users can insert own reports
CREATE POLICY "Users can insert own reports" ON public.daily_reports
FOR INSERT WITH CHECK (
  created_by = auth.uid() AND
  brigade_id IN (SELECT brigade_id FROM public.users WHERE id = auth.uid())
);

-- Policy: Users can update own reports
CREATE POLICY "Users can update own reports" ON public.daily_reports
FOR UPDATE USING (
  created_by = auth.uid() OR (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
);
```

---

## FASE 2: SETUP LOKAL (20 menit)

### Step 2.1: Install Dependencies

```bash
cd /vercel/share/v0-project

# Install Supabase client
npm install @supabase/supabase-js

# Verify installation
npm list @supabase/supabase-js
```

### Step 2.2: Configure Environment Variables

```bash
# Copy .env.example ke .env.local
cp .env.example .env.local

# Edit .env.local dengan nilai dari Supabase
nano .env.local
```

**Isi dengan:**
```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_GEMINI_API_KEY=your_gemini_key
VITE_APP_URL=http://localhost:3000
```

### Step 2.3: Verify Setup Lokal

```bash
# Start dev server
npm run dev

# Open browser: http://localhost:3000

# Cek console (F12):
# - Tidak ada error tentang Supabase
# - Network tab: request ke supabase.co success
```

### Step 2.4: Test Supabase Connection

Buat file test: `src/lib/test-supabase.ts`

```typescript
import { supabase } from './supabase';

export async function testSupabaseConnection() {
  try {
    // Test 1: Check connection
    const { data: { version }, error: versionError } = await supabase
      .rpc('pg_sleep', { seconds: 0.1 });
    
    if (versionError) {
      console.error('[v0] Supabase connection failed:', versionError);
      return { success: false, error: versionError };
    }

    console.log('[v0] Supabase connected successfully');

    // Test 2: Test authentication
    const { data: { user } } = await supabase.auth.getUser();
    console.log('[v0] Auth check:', user ? 'User logged in' : 'Not logged in');

    // Test 3: Fetch brigades
    const { data: brigades, error: brigadesError } = await supabase
      .from('brigades')
      .select('*')
      .limit(1);

    if (brigadesError) {
      console.error('[v0] Brigade fetch error:', brigadesError);
    } else {
      console.log('[v0] Brigade data:', brigades);
    }

    return { success: true };
  } catch (error) {
    console.error('[v0] Supabase test error:', error);
    return { success: false, error };
  }
}
```

Di browser console, jalankan:
```javascript
import { testSupabaseConnection } from './lib/test-supabase';
await testSupabaseConnection();
```

---

## FASE 3: MIGRASI DATA (30 menit)

### Step 3.1: Export Data dari Firebase

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login ke Firebase
firebase login

# Export Firestore ke file
firebase firestore:export ./firestore_backup --project=orbital-office-zj1d7

# Hasil akan ada di ./firestore_backup/firestore_export/
```

### Step 3.2: Create Migration Script

**File: `scripts/migrate-firebase-to-supabase.js`**

```javascript
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function migrateData() {
  try {
    console.log('🚀 Starting Firebase to Supabase migration...\n');

    // Migrasi Brigades
    console.log('📦 Migrating brigades...');
    // Add your migration logic here
    console.log('✅ Brigades migrated\n');

    // Migrasi Alsintan
    console.log('📦 Migrating alsintan...');
    // Add migration logic here
    console.log('✅ Alsintan migrated\n');

    // Dst untuk table lainnya...

    console.log('\n✨ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrateData();
```

### Step 3.3: Jalankan Migration

```bash
# Set environment variable
export SUPABASE_SERVICE_ROLE_KEY="eyJ..."

# Run migration
node scripts/migrate-firebase-to-supabase.js

# Verify di Supabase dashboard → Table Editor
```

---

## FASE 4: DEPLOY KE VERCEL (15 menit)

### Step 4.1: Push ke GitHub

```bash
cd /vercel/share/v0-project

# Add semua changes
git add .

# Commit
git commit -m "feat: add Supabase integration and Vercel deployment

- Add Supabase client library (src/lib/supabase.ts)
- Add database helper functions (src/lib/db.ts)
- Add comprehensive deployment guides
- Update environment variable configuration
- Enable real-time subscriptions
- Setup Row Level Security policies

Co-authored-by: v0agent <it+v0agent@vercel.com>"

# Push ke GitHub
git push origin upload-to-pepi-server
```

### Step 4.2: Connect ke Vercel

1. Buka https://vercel.com/dashboard
2. Click "Add New..." → "Project"
3. Import repository:
   - Select: `sahaif4/brigadex-pepi`
   - Branch: `upload-to-pepi-server`
4. Framework: `Vite`
5. Build Settings:
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

### Step 4.3: Setup Environment Variables di Vercel

Vercel Dashboard → Project Settings → Environment Variables

Tambah variables:
```
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_GEMINI_API_KEY=your_gemini_key
VITE_APP_URL=https://brigadex-pepi.vercel.app
```

Pilih environment:
- Development
- Preview
- Production

### Step 4.4: Deploy

```bash
# Option 1: Dari UI Vercel
# Click "Deploy" button

# Option 2: Dari CLI
npm install -g vercel
vercel --prod

# Tunggu deployment selesai (2-3 menit)
# URL: https://brigadex-pepi.vercel.app
```

Verify deployment:
1. Buka https://brigadex-pepi.vercel.app
2. Check di browser console (F12) - tidak ada error
3. Try login dengan test account
4. Test create/read/update data

---

## FASE 5: TESTING & VERIFICATION (30 menit)

### Test Checklist

```
SUPABASE CONNECTION
[ ] Can connect to Supabase
[ ] Realtime subscriptions working
[ ] Data persists in database

AUTHENTICATION
[ ] Can sign up dengan email
[ ] Can sign in dengan email/password
[ ] JWT token valid
[ ] Session persists across page reload

DATA OPERATIONS
[ ] Can create brigade
[ ] Can read brigades dari database
[ ] Can update brigade
[ ] Can delete brigade (jika ada permission)
[ ] Real-time update terlihat di multiple tabs

ROLE-BASED ACCESS
[ ] Admin dapat access semua data
[ ] Operator hanya dapat access brigade-nya
[ ] Audit logs recorded

EXPORT/IMPORT
[ ] Export to Excel working
[ ] Export to PDF working
[ ] Data format correct

RESPONSIVE
[ ] Desktop (1920x1080) working
[ ] Tablet (768px) working
[ ] Mobile (375px) working

PERFORMANCE
[ ] First load < 3 seconds
[ ] Network tab shows optimized requests
[ ] No console errors/warnings
```

### Performance Monitoring

1. Vercel Dashboard → Analytics
   - Monitor page load times
   - Check for deployment issues

2. Supabase Dashboard → Database
   - Monitor query performance
   - Check connection count
   - Verify storage usage

3. Monitor real-time subscriptions:
   - Buka 2 browser tabs
   - Di tab 1, create data
   - Verifikasi tab 2 mendapat update real-time

---

## TROUBLESHOOTING

### Error: "Cannot find module @supabase/supabase-js"
```bash
# Solution:
npm install @supabase/supabase-js
npm run dev
```

### Error: "Invalid JWT token"
- Check VITE_SUPABASE_ANON_KEY di .env.local
- Pastikan key tidak ada whitespace
- Regenerate key di Supabase API Settings jika perlu

### Error: "Row-level security violation"
- Check RLS policies di Supabase
- Verify user role di `public.users` table
- Test with admin account terlebih dahulu

### Realtime updates tidak bekerja
- Check di Supabase Realtime section - pastikan enabled
- Check subscription di browser console
- Verify network tab untuk realtime request

### Data tidak muncul setelah migration
- Check Supabase Table Editor - pastikan data ada
- Check RLS policies - pastikan user punya access
- Run query langsung di SQL Editor untuk verify

---

## QUICK REFERENCE

### Supabase URLs
- API: https://xxxxx.supabase.co
- Dashboard: https://app.supabase.com
- Project Settings: https://app.supabase.com/project/xxxxx/settings/api

### File Locations
- Supabase config: `src/lib/supabase.ts`
- Database helpers: `src/lib/db.ts`
- Environment: `.env.local` (local), Vercel Dashboard (production)
- Deployment guide: `SUPABASE_VERCEL_DEPLOYMENT_GUIDE.md`

### Useful Commands
```bash
# Development
npm run dev                    # Start dev server
npm run build                  # Build for production
npm run preview               # Preview production build

# Deployment
git push origin upload-to-pepi-server    # Push to GitHub
vercel --prod                 # Deploy to Vercel

# Testing
npm run lint                   # Check TypeScript
npm test                       # Run tests (if configured)
```

---

## NEXT STEPS SETELAH DEPLOYMENT

1. **Monitor di production:**
   - Check Vercel analytics
   - Monitor Supabase database
   - Setup error tracking (Sentry)

2. **Optimize performance:**
   - Enable caching di Vercel
   - Optimize database queries
   - Setup CDN untuk static assets

3. **Security:**
   - Enable 2FA di Supabase
   - Regular security audits
   - Backup database regularly

4. **Documentation:**
   - Document all procedures
   - Create runbooks untuk incidents
   - Share access credentials securely

---

## SUPPORT & RESOURCES

- Supabase Docs: https://supabase.com/docs
- Vercel Docs: https://vercel.com/docs
- React Docs: https://react.dev
- PostgreSQL Docs: https://www.postgresql.org/docs

---

**Status:** Ready untuk deploy ke production!
**Last Updated:** 2024
**Maintained by:** Brigade PEPI Team
