# SUPABASE + VERCEL MAINTENANCE GUIDE

## Panduan Operasional & Troubleshooting Production

---

## MONITORING DASHBOARD

### Supabase Monitoring
**URL:** https://app.supabase.com/project/[project-id]/

1. **Database Health**
   - CPU usage
   - Memory usage
   - Storage usage
   - Active connections

2. **Query Performance**
   - Slow queries
   - Query count
   - Database load

3. **Authentication**
   - Active users
   - Sign-ups
   - Failed logins

### Vercel Monitoring
**URL:** https://vercel.com/dashboard/

1. **Deployment Status**
   - Build success/failure
   - Deployment time
   - Error rate

2. **Performance Analytics**
   - Page load time (LCP, FCP)
   - First Input Delay (INP)
   - Cumulative Layout Shift (CLS)

3. **Edge Requests**
   - Request volume
   - Cache hit rate
   - Region distribution

---

## DAILY MAINTENANCE (5 minutes)

### Morning Check
```bash
# 1. Check Supabase status
# URL: https://status.supabase.com

# 2. Check Vercel status
# URL: https://vercel-status.com

# 3. Monitor application logs
# Check browser console for errors in production
# Navigate to: https://brigadex-pepi.vercel.app
# Open DevTools (F12) → Console
```

### Before Major Operations
```bash
# 1. Backup database (automatic daily)
# Supabase Dashboard → Backups → automatic daily backup

# 2. Check connection pool
# SELECT count(*) FROM pg_stat_activity;
# Run in Supabase SQL Editor
```

---

## WEEKLY MAINTENANCE (30 minutes)

### Monday Morning Review
```
1. Review last week's metrics
   - Uptime: Target 99.9%
   - Error rate: Target < 0.1%
   - Performance: Target LCP < 2.5s

2. Check for failed deployments
   - Vercel Dashboard → Deployments
   - Review error logs

3. Database health check
   - Storage usage growth
   - Slow queries log
   - Connection count trends
```

### SQL Health Check
**Run in Supabase SQL Editor:**
```sql
-- 1. Check table sizes
SELECT 
  schemaname, 
  tablename, 
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- 2. Check for missing indexes
SELECT 
  tablename, 
  COUNT(*) as columns_without_index
FROM pg_tables 
LEFT JOIN pg_indexes ON pg_tables.tablename = pg_indexes.tablename
WHERE pg_tables.schemaname = 'public' 
GROUP BY tablename;

-- 3. Check for dead tuples
SELECT 
  schemaname, 
  tablename, 
  n_live_tup, 
  n_dead_tup,
  ROUND(100 * n_dead_tup / NULLIF(n_live_tup + n_dead_tup, 0), 2) AS dead_ratio
FROM pg_stat_user_tables 
WHERE n_dead_tup > 1000;
```

### Vacuum & Analyze
**Run if needed (high dead tuple ratio):**
```sql
-- Clean up dead tuples
VACUUM ANALYZE public.daily_reports;
VACUUM ANALYZE public.alsintan;
VACUUM ANALYZE public.service_records;
```

---

## MONTHLY MAINTENANCE (1 hour)

### First Monday of Month

#### 1. Performance Review
```
- Average page load time
- Error rate
- 404 errors
- Real-time latency
```

#### 2. Security Audit
```sql
-- Check user activity
SELECT user_id, action, COUNT(*) 
FROM public.audit_logs 
WHERE created_at > NOW() - INTERVAL '1 month'
GROUP BY user_id, action
ORDER BY COUNT(*) DESC;

-- Check failed logins
SELECT email, COUNT(*) as failed_attempts
FROM auth.audit_log_entries 
WHERE event = 'token_refreshed' 
AND created_at > NOW() - INTERVAL '1 month'
GROUP BY email
ORDER BY COUNT(*) DESC;
```

#### 3. Database Optimization
```sql
-- Analyze all tables
ANALYZE;

-- Reindex if needed
REINDEX DATABASE "postgres";
```

#### 4. Backup Verification
- Verify backup files exist (automatic)
- Test restore procedure (1x per quarter)
- Document backup retention policy

#### 5. Update Dependencies
```bash
# Check for updates
npm outdated

# Update if safe
npm update

# Test locally
npm run dev

# Build & test
npm run build

# Deploy
git add -A
git commit -m "chore: update dependencies"
git push origin main
```

---

## ERROR HANDLING & TROUBLESHOOTING

### Common Issues

#### Issue 1: "Row-level security violation"
**Symptoms:** User can't see data, permission denied error

**Diagnosis:**
```sql
-- Check user role
SELECT id, email, role, brigade_id 
FROM public.users 
WHERE id = 'user-uuid';

-- Check RLS policies
SELECT schemaname, tablename, policyname, permissive, cmd
FROM pg_policies
WHERE tablename = 'daily_reports';
```

**Solution:**
1. Verify user's role in `public.users` table
2. Verify RLS policies match role
3. Update RLS if needed
4. Clear browser cache & reload

#### Issue 2: "Real-time connection dropped"
**Symptoms:** Real-time updates stop working

**Diagnosis:**
```bash
# Check Realtime status
# Supabase Dashboard → Realtime

# Check connection in browser
# F12 → Network → find "realtime" → Status should be 101 (WebSocket)
```

**Solution:**
1. Reload page (Ctrl+Shift+R to clear cache)
2. Check browser console for errors
3. Verify network connection
4. Restart browser
5. If issue persists: Supabase status page

#### Issue 3: "Slow queries"
**Symptoms:** Page loads slowly, queries take long

**Diagnosis:**
```sql
-- Find slow queries
SELECT 
  query,
  calls,
  total_time,
  mean_time,
  max_time
FROM pg_stat_statements 
WHERE mean_time > 100
ORDER BY mean_time DESC
LIMIT 10;
```

**Solution:**
1. Add indexes to frequently queried columns
2. Optimize WHERE clauses
3. Use LIMIT for large result sets
4. Consider caching strategy

#### Issue 4: "Memory/Storage almost full"
**Symptoms:** Database running slow, warning emails from Supabase

**Diagnosis:**
```sql
-- Check storage usage
SELECT 
  pg_size_pretty(pg_database_size('postgres')) as total_size,
  pg_size_pretty(pg_tablespace_size('pg_default')) as tablespace_size;

-- Check largest tables
SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename))
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 10;
```

**Solution:**
1. Archive old data (move to archive table)
2. Delete unnecessary logs
3. Compress large columns
4. Upgrade database plan if needed

#### Issue 5: "Deployment failed on Vercel"
**Symptoms:** Build error, deployment stuck

**Diagnosis:**
1. Check Vercel Deployments page
2. Click failed deployment → read logs
3. Run locally: `npm run build`
4. Check environment variables

**Solution:**
1. Fix build errors locally
2. Test: `npm run build && npm run preview`
3. Commit & push
4. Vercel will auto-retry

---

## PERFORMANCE OPTIMIZATION

### Database Optimization
```sql
-- Add missing indexes
CREATE INDEX idx_daily_reports_brigade_date 
ON public.daily_reports(brigade_id, report_date DESC);

CREATE INDEX idx_alsintan_status 
ON public.alsintan(status);

CREATE INDEX idx_service_records_alsintan_date 
ON public.service_records(alsintan_id, service_date DESC);

-- Analyze after adding indexes
ANALYZE;
```

### Query Optimization
**Before:**
```typescript
// Fetches all data
const { data } = await supabase
  .from('daily_reports')
  .select('*')
  .eq('brigade_id', brigadeId);
```

**After:**
```typescript
// Only fetches needed columns
const { data } = await supabase
  .from('daily_reports')
  .select('id,report_date,work_hours,work_description')
  .eq('brigade_id', brigadeId)
  .eq('status', 'submitted') // Filter early
  .gte('report_date', startDate) // Use range queries
  .lte('report_date', endDate)
  .limit(100); // Paginate large result sets
```

### Frontend Optimization
```typescript
// Use memoization
const MemoizedComponent = React.memo(HeavyComponent);

// Lazy load components
const ReportDetail = lazy(() => import('./ReportDetail'));

// Use proper error boundaries
<ErrorBoundary>
  <Suspense fallback={<Loading />}>
    <ReportDetail />
  </Suspense>
</ErrorBoundary>
```

---

## SECURITY MAINTENANCE

### Weekly Security Check
```sql
-- Check for suspicious activity
SELECT 
  user_id, 
  action, 
  created_at
FROM public.audit_logs
WHERE created_at > NOW() - INTERVAL '7 days'
ORDER BY created_at DESC
LIMIT 100;

-- Check user permissions
SELECT 
  id, 
  email, 
  role, 
  status
FROM public.users
WHERE status != 'active'
OR role NOT IN ('admin', 'supervisor', 'operator', 'viewer');
```

### Monthly Security Tasks
- [ ] Review user access logs
- [ ] Remove inactive users
- [ ] Update RLS policies if needed
- [ ] Check for SQL injection attempts
- [ ] Verify API key rotation schedule

### Quarterly Tasks
- [ ] Security audit
- [ ] Penetration testing (if available)
- [ ] Update security documentation
- [ ] Review database encryption status

---

## BACKUP & RECOVERY

### Automatic Backups (Supabase)
- **Frequency:** Daily automatic backups
- **Retention:** Latest 7 days
- **Location:** Supabase secure storage

**View backups:**
```
Supabase Dashboard → Backups → Automatic backups
```

### Manual Backup
```bash
# Export database
pg_dump -h xxxxx.supabase.co -U postgres -d postgres > backup.sql

# Or use Supabase CLI
supabase db pull

# Or create point-in-time backup
# Supabase Dashboard → Backups → Create backup
```

### Recovery Procedure
**If data corrupted:**
```
1. Stop application
2. Supabase Dashboard → Backups
3. Select restore point
4. Restore database
5. Run tests
6. Resume application
```

---

## INCIDENT RESPONSE

### Incident Protocol
```
1. DETECT
   - Monitor alerts
   - User reports
   - Automated monitoring

2. ASSESS
   - Check affected systems
   - Review logs
   - Determine severity

3. NOTIFY
   - Internal team
   - Users (if major)
   - Stakeholders

4. MITIGATE
   - Quick fix if possible
   - Temporary workaround
   - Monitor

5. RESOLVE
   - Root cause analysis
   - Permanent fix
   - Testing

6. COMMUNICATE
   - Post-mortem (internal)
   - Status page update
   - User notification

7. IMPROVE
   - Update runbooks
   - Add monitoring
   - Prevent recurrence
```

### Emergency Contacts
```
- Technical Lead: [name & phone]
- Database Admin: [name & phone]
- DevOps: [name & phone]
- Product Manager: [name & phone]
```

---

## REPORTING

### Weekly Report Template
```
WEEK OF: [DATE]

UPTIME
- Target: 99.9%
- Actual: [%]
- Issues: [list]

PERFORMANCE
- Average LCP: [ms]
- Error Rate: [%]
- Slow queries: [count]

SECURITY
- Failed logins: [count]
- RLS violations: [count]
- Suspicious activity: [Y/N]

BACKUPS
- Status: [OK/ERROR]
- Latest: [date/time]
- Size: [GB]

ACTIONS TAKEN
- [action 1]
- [action 2]
- [action 3]
```

### Monthly Report Template
```
MONTH: [MONTH/YEAR]

AVAILABILITY
- Uptime: [%]
- Incidents: [count]
- Avg resolution time: [minutes]

PERFORMANCE
- Avg page load: [ms]
- Peak traffic: [req/s]
- Slowest endpoint: [endpoint]

CAPACITY
- Database usage: [%]
- Storage growth: [GB]
- Connection pool: [avg/max]

GROWTH
- New users: [count]
- New reports: [count]
- Data growth: [GB]

PLANNED IMPROVEMENTS
- [improvement 1]
- [improvement 2]
```

---

## CHECKLISTS

### Weekly Checklist
```
[ ] Review error logs
[ ] Check uptime metrics
[ ] Verify backups
[ ] Run database health checks
[ ] Check disk space
[ ] Review slow queries
[ ] Verify SSL certificate (never expires)
[ ] Monitor API rate limits
```

### Monthly Checklist
```
[ ] Review performance trends
[ ] Security audit
[ ] Dependency updates check
[ ] Database optimization
[ ] Backup testing
[ ] User access review
[ ] Capacity planning
[ ] Documentation update
[ ] Team standup & sync
```

### Quarterly Checklist
```
[ ] Full disaster recovery test
[ ] Security penetration test
[ ] Database backup restore test
[ ] Performance optimization review
[ ] Cost analysis & optimization
[ ] Compliance audit
[ ] Architecture review
[ ] Documentation refresh
```

---

## RUNBOOKS

### Runbook 1: Restore from Backup
```
Situation: Database corrupted, need restore
Time to restore: ~30 minutes

Steps:
1. Stop application (set maintenance page)
2. Verify backup available
3. Supabase → Backups → Select backup
4. Click "Restore" button
5. Confirm restoration
6. Wait for completion
7. Test application
8. Resume application
9. Notify users

Verification:
- [ ] Login works
- [ ] Data visible
- [ ] Real-time working
- [ ] No errors in console
```

### Runbook 2: Deploy Hotfix
```
Situation: Critical bug in production, need immediate fix
Time to deploy: ~10 minutes

Steps:
1. Create hotfix branch: git checkout -b hotfix/bug-name
2. Fix bug
3. Test locally: npm run build && npm run preview
4. Commit: git commit -m "fix: critical bug"
5. Push: git push origin hotfix/bug-name
6. Create PR on GitHub
7. Request review (skip for true emergency)
8. Merge to main
9. Monitor Vercel deployment
10. Verify fix in production

Rollback if needed:
- git revert [commit-hash]
- git push origin main
```

### Runbook 3: Scale Database
```
Situation: Database at 80% capacity
Time to scale: ~1 hour

Steps:
1. Identify growth rate
2. Calculate needed capacity
3. Supabase Dashboard → Project Settings
4. Select compute tier
5. Upgrade to larger plan
6. Confirm upgrade
7. Migration starts (downtime: ~30 min)
8. Monitor migration
9. Verify application
10. Test performance
11. Update capacity plan

Monitoring during upgrade:
- [ ] Check Supabase status page
- [ ] Monitor application uptime
- [ ] Check error logs
```

---

## CONTACTS & ESCALATION

```
LEVEL 1 (Development Team)
- Handle: Minor issues, monitoring
- Response time: < 2 hours

LEVEL 2 (Technical Lead)
- Handle: Major incidents, decisions
- Response time: < 30 minutes
- Contact: [phone/email]

LEVEL 3 (Management)
- Handle: Business impact, external communication
- Response time: < 15 minutes
- Contact: [phone/email]

ESCALATION PATH:
Dev Team → Technical Lead → Management → Customer
```

---

## RESOURCES

**Official Documentation:**
- Supabase: https://supabase.com/docs
- PostgreSQL: https://www.postgresql.org/docs
- Vercel: https://vercel.com/docs

**Monitoring Tools:**
- Supabase Dashboard: https://app.supabase.com
- Vercel Dashboard: https://vercel.com/dashboard
- Uptime Robot: https://uptimerobot.com (recommended)

**Community:**
- Supabase Discord: https://discord.supabase.com
- GitHub Issues: https://github.com/sahaif4/brigadex-pepi/issues

---

**Last Updated:** 2024
**Maintained by:** Brigade PEPI Operations Team
**Next Review:** [Schedule regular review date]
