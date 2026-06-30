# PANDUAN LENGKAP: SUPABASE + VERCEL DEPLOYMENT
## Brigade PEPI - Aplikasi Kinerja Alsintan

---

## 📋 DAFTAR ISI
1. [Overview Arsitektur](#overview-arsitektur)
2. [Setup Supabase](#setup-supabase)
3. [Migrasi Data dari Firebase](#migrasi-data-dari-firebase)
4. [Konfigurasi Aplikasi](#konfigurasi-aplikasi)
5. [Setup Vercel Deployment](#setup-vercel-deployment)
6. [Testing & Verification](#testing--verification)
7. [Monitoring & Maintenance](#monitoring--maintenance)

---

## OVERVIEW ARSITEKTUR

### Current Stack (Firebase)
```
Frontend (React + Vite)
    ↓
Firebase Firestore (NoSQL)
Firebase Authentication
Firebase Realtime Sync
```

### Target Stack (Supabase + Vercel)
```
Frontend (React + Vite) → Vercel CDN
    ↓
Supabase (PostgreSQL)
Supabase Auth (Row Level Security)
Real-time Subscriptions
    ↓
Vercel Edge Middleware
```

### Keuntungan Supabase + Vercel
- ✅ PostgreSQL relational database (lebih scalable)
- ✅ Real-time capabilities seperti Firebase
- ✅ Row Level Security (RLS) untuk data protection
- ✅ Vercel global CDN dengan auto-scaling
- ✅ Deployment otomatis dari Git
- ✅ Preview environment untuk testing
- ✅ Zero-cold-start functions
- ✅ Analytics & monitoring terintegrasi

---

## SETUP SUPABASE

### Step 1: Create Supabase Project

1. **Buka https://supabase.com**
2. **Sign up / Login** dengan akun GitHub
3. **Create Organization** (jika belum ada)
4. **New Project** dengan konfigurasi:
   - Name: `brigadex-pepi`
   - Region: `Southeast Asia (Singapore)` (terdekat dengan Indonesia)
   - Database Password: Generate secure password (simpan di tempat aman!)

```
Contoh URL Project:
https://xxxxxxxxxxxxxx.supabase.co
Project Reference: xxxxxxxxxxxxxx
```

### Step 2: Buat Database Schema

Masuk ke **SQL Editor** di Supabase dashboard dan jalankan SQL berikut:

```sql
-- ============================================
-- 1. AUTHENTICATION & ROLES
-- ============================================

-- Table untuk Users (extended dari Supabase auth.users)
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'operator', -- 'admin', 'supervisor', 'operator', 'viewer'
  brigade_id UUID,
  status VARCHAR(50) DEFAULT 'active', -- 'active', 'inactive', 'suspended'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP WITH TIME ZONE
);

-- ============================================
-- 2. MASTER DATA
-- ============================================

-- Brigades (Satuan Alsintan)
CREATE TABLE public.brigades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  location VARCHAR(255),
  head_name VARCHAR(255),
  head_phone VARCHAR(20),
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Alsintan (Alat Sarana & Infra)
CREATE TABLE public.alsintan (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brigade_id UUID NOT NULL REFERENCES public.brigades(id) ON DELETE CASCADE,
  code VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(100), -- 'excavator', 'wheel_loader', 'dozer', 'grader', 'vibrator', 'truck', etc.
  specification TEXT,
  purchase_date DATE,
  cost DECIMAL(15, 2),
  condition VARCHAR(50) DEFAULT 'good', -- 'good', 'moderate', 'poor'
  status VARCHAR(50) DEFAULT 'operational',
  last_maintenance_date DATE,
  next_maintenance_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(brigade_id, code)
);

-- Operators (Operator Alsintan)
CREATE TABLE public.operators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brigade_id UUID NOT NULL REFERENCES public.brigades(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  license_number VARCHAR(100),
  license_type VARCHAR(100),
  license_expiry DATE,
  phone VARCHAR(20),
  email VARCHAR(255),
  experience_years INTEGER,
  status VARCHAR(50) DEFAULT 'active',
  certification_file_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Locations (Lokasi Kerja)
CREATE TABLE public.locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  region VARCHAR(100),
  district VARCHAR(100),
  coordinates POINT, -- PostgreSQL POINT type for latitude, longitude
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 3. OPERATIONAL REPORTS
-- ============================================

-- Daily Reports (Laporan Harian)
CREATE TABLE public.daily_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brigade_id UUID NOT NULL REFERENCES public.brigades(id) ON DELETE CASCADE,
  alsintan_id UUID NOT NULL REFERENCES public.alsintan(id) ON DELETE CASCADE,
  operator_id UUID NOT NULL REFERENCES public.operators(id) ON DELETE CASCADE,
  location_id UUID REFERENCES public.locations(id),
  report_date DATE NOT NULL,
  work_hours DECIMAL(5, 2),
  work_description TEXT NOT NULL,
  fuel_consumption DECIMAL(10, 2),
  maintenance_notes TEXT,
  issues_found TEXT,
  status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'submitted', 'verified', 'approved'
  verified_by UUID REFERENCES public.users(id),
  verified_at TIMESTAMP WITH TIME ZONE,
  created_by UUID NOT NULL REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Service & Maintenance Records
CREATE TABLE public.service_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alsintan_id UUID NOT NULL REFERENCES public.alsintan(id) ON DELETE CASCADE,
  service_date DATE NOT NULL,
  service_type VARCHAR(100), -- 'routine', 'repair', 'overhaul', 'inspection'
  description TEXT NOT NULL,
  technician_name VARCHAR(255),
  parts_replaced TEXT,
  cost DECIMAL(15, 2),
  status VARCHAR(50) DEFAULT 'completed',
  notes TEXT,
  created_by UUID NOT NULL REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Damage Reports (Laporan Kerusakan)
CREATE TABLE public.damage_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alsintan_id UUID NOT NULL REFERENCES public.alsintan(id) ON DELETE CASCADE,
  report_date DATE NOT NULL,
  severity VARCHAR(50), -- 'minor', 'moderate', 'severe'
  description TEXT NOT NULL,
  estimated_cost DECIMAL(15, 2),
  repair_status VARCHAR(50) DEFAULT 'reported', -- 'reported', 'assigned', 'in_progress', 'completed'
  assigned_to UUID REFERENCES public.users(id),
  photos_url TEXT[], -- Array of photo URLs
  created_by UUID NOT NULL REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 4. WEEKLY/MONTHLY SUMMARIES
-- ============================================

CREATE TABLE public.weekly_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brigade_id UUID NOT NULL REFERENCES public.brigades(id) ON DELETE CASCADE,
  week_starting DATE NOT NULL,
  total_hours DECIMAL(10, 2),
  total_fuel_consumption DECIMAL(10, 2),
  total_operations INTEGER,
  maintenance_count INTEGER,
  damage_count INTEGER,
  summary_data JSONB, -- Flexible data storage
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(brigade_id, week_starting)
);

CREATE TABLE public.monthly_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brigade_id UUID NOT NULL REFERENCES public.brigades(id) ON DELETE CASCADE,
  month_year DATE NOT NULL, -- First day of month
  total_hours DECIMAL(10, 2),
  total_fuel_consumption DECIMAL(10, 2),
  total_operations INTEGER,
  maintenance_cost DECIMAL(15, 2),
  damage_cost DECIMAL(15, 2),
  efficiency_percentage DECIMAL(5, 2),
  summary_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(brigade_id, month_year)
);

-- ============================================
-- 5. AUDIT & LOGS
-- ============================================

CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id),
  action VARCHAR(100),
  table_name VARCHAR(100),
  record_id UUID,
  changes JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 6. INDEXES untuk Performance
-- ============================================

CREATE INDEX idx_daily_reports_brigade_date ON public.daily_reports(brigade_id, report_date DESC);
CREATE INDEX idx_daily_reports_status ON public.daily_reports(status);
CREATE INDEX idx_alsintan_brigade ON public.alsintan(brigade_id);
CREATE INDEX idx_alsintan_status ON public.alsintan(status);
CREATE INDEX idx_service_records_alsintan_date ON public.service_records(alsintan_id, service_date DESC);
CREATE INDEX idx_damage_reports_alsintan_date ON public.damage_reports(alsintan_id, report_date DESC);
CREATE INDEX idx_audit_logs_user_date ON public.audit_logs(user_id, created_at DESC);

-- ============================================
-- 7. ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brigades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alsintan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.damage_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see their own data + data from their brigade
CREATE POLICY "Users can view own brigade data" ON public.daily_reports
FOR SELECT USING (
  brigade_id IN (
    SELECT brigade_id FROM public.users WHERE id = auth.uid()
  ) OR auth.jwt() -> 'app_metadata' ->> 'role' = 'admin'
);

CREATE POLICY "Users can insert own reports" ON public.daily_reports
FOR INSERT WITH CHECK (
  created_by = auth.uid() AND
  brigade_id IN (
    SELECT brigade_id FROM public.users WHERE id = auth.uid()
  )
);

-- Similar policies for other tables...
-- (You can customize based on your role-based access control)

-- ============================================
-- 8. SAMPLE DATA (Optional)
-- ============================================

-- Insert sample brigades
INSERT INTO public.brigades (code, name, location, head_name, head_phone, status)
VALUES
  ('BRG001', 'Brigade Medan', 'Medan, Sumatera Utara', 'Budi Hartono', '08123456789', 'active'),
  ('BRG002', 'Brigade Bandung', 'Bandung, Jawa Barat', 'Siti Nurhaliza', '08234567890', 'active'),
  ('BRG003', 'Brigade Surabaya', 'Surabaya, Jawa Timur', 'Agus Setiawan', '08345678901', 'active');

-- Insert sample locations
INSERT INTO public.locations (code, name, region, district, address)
VALUES
  ('LOC001', 'Jalan Gatot Subroto', 'Medan', 'Medan Petisah', 'Jl. Gatot Subroto, Medan'),
  ('LOC002', 'Jalan Sudirman', 'Bandung', 'Bandung Pusat', 'Jl. Sudirman, Bandung'),
  ('LOC003', 'Jalan Raya Darmo', 'Surabaya', 'Surabaya Pusat', 'Jl. Raya Darmo, Surabaya');

```

### Step 3: Enable Real-time Features

Di Supabase Dashboard:
1. Pergi ke **Realtime** section
2. Pilih tables yang ingin real-time:
   - `daily_reports`
   - `alsintan`
   - `operators`
3. Enable **Broadcast**, **Presence**, dan **Postgres Changes**

### Step 4: Setup Authentication

Di **Authentication** section:
1. **Providers**: Enable Email/Password
2. **Email Templates**: Customize jika perlu
3. **Redirect URLs**: 
   ```
   http://localhost:3000/auth/callback
   https://brigadex-pepi.vercel.app/auth/callback
   ```

---

## MIGRASI DATA DARI FIREBASE

### Step 1: Export Data dari Firebase

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login ke Firebase
firebase login

# Export Firestore ke JSON
firebase firestore:export ./firestore_backup

# File akan tersimpan di ./firestore_backup/firestore_export/
```

### Step 2: Script Konversi & Import ke Supabase

**File: `scripts/migrate-firebase-to-supabase.js`**

```javascript
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function migrateData() {
  try {
    console.log('🚀 Starting Firebase to Supabase migration...\n');

    // Read Firebase exported data
    const brigadesFile = path.join(__dirname, '../firestore_backup/brigades.json');
    const brigades = JSON.parse(fs.readFileSync(brigadesFile, 'utf8'));

    console.log(`📦 Found ${brigades.length} brigades`);

    // Migrate brigades
    for (const brigade of brigades) {
      const { error } = await supabase
        .from('brigades')
        .upsert({
          id: brigade.id,
          code: brigade.code,
          name: brigade.name,
          location: brigade.location,
          head_name: brigade.headName,
          head_phone: brigade.headPhone,
          status: brigade.status || 'active',
          created_at: brigade.createdAt,
          updated_at: brigade.updatedAt,
        });

      if (error) {
        console.error(`❌ Error migrating brigade ${brigade.code}:`, error);
      } else {
        console.log(`✅ Migrated brigade: ${brigade.code}`);
      }
    }

    console.log('\n✨ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrateData();
```

### Step 3: Jalankan Migration Script

```bash
# Set environment variables
export SUPABASE_SERVICE_ROLE_KEY="your_supabase_service_role_key"

# Run migration
node scripts/migrate-firebase-to-supabase.js
```

---

## KONFIGURASI APLIKASI

### Step 1: Update Environment Variables

**File: `.env.local`**
```env
# Supabase
VITE_SUPABASE_URL=https://xxxxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Gemini AI
VITE_GEMINI_API_KEY=your_gemini_api_key

# App
VITE_APP_URL=http://localhost:3000
```

### Step 2: Buat Supabase Client Library

**File: `src/lib/supabase.ts`**

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Real-time subscription helper
export const subscribeToRealtimeChanges = (
  table: string,
  callback: (payload: any) => void
) => {
  const subscription = supabase
    .channel(`public:${table}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: table,
      },
      (payload) => {
        callback(payload);
      }
    )
    .subscribe();

  return subscription;
};

// Authentication helpers
export const signUp = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${import.meta.env.VITE_APP_URL}/auth/callback`,
    },
  });
  return { data, error };
};

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};
```

### Step 3: Update LoginView untuk Supabase Auth

**File: `src/components/LoginView.tsx`** (Replace Firebase auth dengan Supabase)

Lihat bagian **Kode Implementasi Supabase** di bawah.

### Step 4: Update Data Fetching Components

Update semua components yang fetch data dari Firebase untuk menggunakan Supabase queries.

---

## SETUP VERCEL DEPLOYMENT

### Step 1: Push ke GitHub

```bash
cd /vercel/share/v0-project

# Initialize/update Git
git add -A
git commit -m "feat: prepare for Supabase and Vercel deployment

- Add Supabase schema and migration guide
- Add environment variable configuration
- Add Supabase client library
- Update authentication to use Supabase Auth
- Add real-time subscriptions
- Add RLS policies for data security

Co-authored-by: v0agent <it+v0agent@vercel.com>"

git push origin upload-to-pepi-server
```

### Step 2: Connect ke Vercel

1. **Buka https://vercel.com**
2. **Sign up / Login** dengan GitHub account
3. **Import Project**:
   - Repository: `sahaif4/brigadex-pepi`
   - Branch: `upload-to-pepi-server`
4. **Configure Project**:
   - Framework Preset: `Vite`
   - Build Command: `npm run build`
   - Output Directory: `dist`

### Step 3: Set Environment Variables di Vercel

Di Vercel Dashboard → Project Settings → Environment Variables:

```
VITE_SUPABASE_URL=https://xxxxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_GEMINI_API_KEY=your_gemini_api_key
VITE_APP_URL=https://brigadex-pepi.vercel.app
```

### Step 4: Deploy

```bash
# Create PR atau push ke main untuk trigger deployment otomatis
# Vercel akan:
# 1. Build aplikasi
# 2. Run tests (jika ada)
# 3. Deploy ke staging URL
# 4. Deploy ke production jika PR di-merge
```

---

## KODE IMPLEMENTASI SUPABASE

### Update Authentication

**File: `src/lib/auth.ts`** (New file)

```typescript
import { supabase } from './supabase';

export interface AuthUser {
  id: string;
  email: string;
  fullName?: string;
  role?: string;
  brigadeId?: string;
}

export const auth = {
  async signUp(email: string, password: string, fullName: string) {
    try {
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (signUpError) throw signUpError;

      // Insert user profile
      if (authData.user) {
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: authData.user.id,
            email: authData.user.email,
            full_name: fullName,
            role: 'operator',
            status: 'active',
          });

        if (profileError) throw profileError;
      }

      return { success: true, user: authData.user };
    } catch (error) {
      return { success: false, error };
    }
  },

  async signIn(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Update last_login
      if (data.user) {
        await supabase
          .from('users')
          .update({ last_login: new Date().toISOString() })
          .eq('id', data.user.id);
      }

      return { success: true, user: data.user };
    } catch (error) {
      return { success: false, error };
    }
  },

  async signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return { success: true };
    } catch (error) {
      return { success: false, error };
    }
  },

  async getCurrentUser(): Promise<AuthUser | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return null;

      // Fetch user profile
      const { data: profile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      return {
        id: user.id,
        email: user.email || '',
        fullName: profile?.full_name,
        role: profile?.role,
        brigadeId: profile?.brigade_id,
      };
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  },

  onAuthStateChange(callback: (user: AuthUser | null) => void) {
    return supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const currentUser = await this.getCurrentUser();
        callback(currentUser);
      } else {
        callback(null);
      }
    });
  },
};
```

### Fetch Data Helper

**File: `src/lib/db.ts`** (New file)

```typescript
import { supabase } from './supabase';

export const db = {
  // Brigades
  brigades: {
    async getAll() {
      const { data, error } = await supabase
        .from('brigades')
        .select('*')
        .eq('status', 'active')
        .order('name');
      
      if (error) throw error;
      return data;
    },

    async getById(id: string) {
      const { data, error } = await supabase
        .from('brigades')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    },

    async create(brigade: any) {
      const { data, error } = await supabase
        .from('brigades')
        .insert([brigade])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },

    async update(id: string, updates: any) {
      const { data, error } = await supabase
        .from('brigades')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
  },

  // Daily Reports
  dailyReports: {
    async getByBrigadeAndDate(brigadeId: string, date: string) {
      const { data, error } = await supabase
        .from('daily_reports')
        .select(`
          *,
          brigade:brigades(*),
          alsintan(*),
          operator:operators(*),
          location:locations(*)
        `)
        .eq('brigade_id', brigadeId)
        .eq('report_date', date)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },

    async getByDateRange(brigadeId: string, startDate: string, endDate: string) {
      const { data, error } = await supabase
        .from('daily_reports')
        .select('*')
        .eq('brigade_id', brigadeId)
        .gte('report_date', startDate)
        .lte('report_date', endDate)
        .order('report_date', { ascending: false });
      
      if (error) throw error;
      return data;
    },

    async create(report: any) {
      const { data, error } = await supabase
        .from('daily_reports')
        .insert([report])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },

    async update(id: string, updates: any) {
      const { data, error } = await supabase
        .from('daily_reports')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
  },

  // Real-time subscriptions
  subscribe(table: string, callback: (payload: any) => void) {
    return supabase
      .channel(`public:${table}:*`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: table,
        },
        callback
      )
      .subscribe();
  },
};
```

---

## TESTING & VERIFICATION

### Step 1: Test Lokal

```bash
# Install dependencies
npm install

# Set environment variables
cp .env.example .env.local
# Edit .env.local dengan Supabase credentials

# Start dev server
npm run dev

# Test di browser: http://localhost:3000
```

### Step 2: Test Functionalities

Checklist testing:
- [ ] Login dengan email/password
- [ ] Create user profile di Supabase
- [ ] View brigades dari database
- [ ] Create daily report
- [ ] Real-time update ketika data berubah
- [ ] Export data ke Excel/PDF
- [ ] Role-based access control
- [ ] Audit logs recorded

### Step 3: Test Production Build

```bash
# Build for production
npm run build

# Preview production build lokal
npm run preview

# Check bundle size
npm run build -- --debug
```

---

## MONITORING & MAINTENANCE

### Vercel Analytics

1. **Vercel Dashboard** → Project → Analytics
2. Monitor:
   - Page load times
   - First Contentful Paint (FCP)
   - Largest Contentful Paint (LCP)
   - Cumulative Layout Shift (CLS)

### Supabase Monitoring

1. **Supabase Dashboard** → Database
2. Monitor:
   - Query performance
   - Connection count
   - Storage usage
   - Realtime events

### Set Up Alerts

**Vercel**:
- Email alerts jika deployment failed

**Supabase**:
- Setup database backups (automatic daily)
- Monitor resource usage

### Maintenance Schedule

```
Harian:
- Check error logs
- Monitor active users

Mingguan:
- Review performance metrics
- Check for failed deployments

Bulanan:
- Database optimization
- Backup verification
- Security audit
```

---

## TROUBLESHOOTING

### Issue: "Invalid JWT token"
**Solution**: Pastikan VITE_SUPABASE_ANON_KEY benar dan belum expired

### Issue: "Row-level security violation"
**Solution**: Check RLS policies di Supabase dan pastikan user memiliki access

### Issue: "Real-time updates tidak bekerja"
**Solution**: 
1. Enable realtime di Supabase dashboard
2. Check connection status
3. Restart browser

### Issue: "Build failed di Vercel"
**Solution**:
1. Check build logs di Vercel
2. Ensure semua environment variables set
3. Run `npm run build` lokal untuk debug

---

## NEXT STEPS

1. ✅ Create Supabase project
2. ✅ Create database schema
3. ✅ Migrate data from Firebase
4. ✅ Update aplikasi untuk Supabase
5. ✅ Deploy ke Vercel
6. ✅ Setup monitoring & alerts
7. ✅ Document processes

---

## CONTACT & SUPPORT

- **Supabase Docs**: https://supabase.com/docs
- **Vercel Docs**: https://vercel.com/docs
- **React Query Docs**: https://tanstack.com/query/latest
