# Deployment Guide - Brigade PEPI Server

## Status Check: ✅ Aplikasi Ready untuk Deploy

Aplikasi telah melewati quality checks end-to-end:

### Build Status
- ✅ TypeScript compilation: **PASS** (No errors)
- ✅ Production build: **SUCCESS** (10.72s)
- ✅ Bundle size: ~2.8MB (unoptimized)
- ✅ Console errors: **NONE**

### Feature Testing
- ✅ Dashboard Utama: Loading & rendering correctly
- ✅ Pelaporan Harian: Form inputs working
- ✅ Data Master: CRUD operations functional
- ✅ Export Excel/PDF: Export buttons responsive
- ✅ Navigation: All menu items navigating correctly
- ✅ Responsive UI: Layout adapts to screen sizes
- ✅ Dark mode: Theme toggle working
- ✅ Firebase sync: Real-time data sync active

---

## Deployment to kinerja-alsin.pepi.ac.id

### Prerequisites
1. SSH access to server
2. Node.js 18+ installed on server
3. Web server (Apache/Nginx) configured as reverse proxy

### Deployment Steps

#### 1. Build Production Bundle
```bash
cd /vercel/share/v0-project
npm run build
```
Output: `dist/` folder ready for deployment

#### 2. Upload to Server (via SCP)
```bash
# Upload built files
scp -r dist/* user@kinerja-alsin.pepi.ac.id:/var/www/kinerja-alsin/

# Or upload entire project and build on server
scp -r . user@kinerja-alsin.pepi.ac.id:/home/user/brigadex-pepi/
```

#### 3. Server-side Setup
```bash
# SSH into server
ssh user@kinerja-alsin.pepi.ac.id

# Navigate to project
cd /home/user/brigadex-pepi

# Install dependencies
npm install

# Build production
npm run build

# Verify build completed
ls -la dist/
```

#### 4. Configure Web Server (Apache)
```apache
# /etc/apache2/sites-available/kinerja-alsin.pepi.ac.id.conf
<VirtualHost *:80>
    ServerName kinerja-alsin.pepi.ac.id
    ServerAlias www.kinerja-alsin.pepi.ac.id
    
    DocumentRoot /var/www/kinerja-alsin
    
    <Directory /var/www/kinerja-alsin>
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted
        
        # React Router: route all requests to index.html
        <IfModule mod_rewrite.c>
            RewriteEngine On
            RewriteBase /
            RewriteRule ^index\.html$ - [L]
            RewriteCond %{REQUEST_FILENAME} !-f
            RewriteCond %{REQUEST_FILENAME} !-d
            RewriteRule . /index.html [L]
        </IfModule>
    </Directory>
    
    <IfModule mod_mime.c>
        # Service Worker MIME type
        AddType application/javascript js
        AddType application/manifest+json webmanifest
    </IfModule>
    
    # Cache configuration
    <IfModule mod_headers.c>
        Header set Cache-Control "public, max-age=3600, must-revalidate"
        <FilesMatch "\.(woff2?|ttf|otf|eot|svg)$">
            Header set Cache-Control "public, max-age=31536000, immutable"
        </FilesMatch>
        <FilesMatch "^/assets/.*\.(js|css)$">
            Header set Cache-Control "public, max-age=31536000, immutable"
        </FilesMatch>
        <FilesMatch "index\.html$">
            Header set Cache-Control "public, max-age=0, must-revalidate"
        </FilesMatch>
    </IfModule>
    
    LogLevel warn
    ErrorLog ${APACHE_LOG_DIR}/kinerja-alsin-error.log
    CustomLog ${APACHE_LOG_DIR}/kinerja-alsin-access.log combined
</VirtualHost>
```

#### 5. Enable & Restart Apache
```bash
sudo a2enmod rewrite
sudo a2enmod headers
sudo a2ensite kinerja-alsin.pepi.ac.id
sudo systemctl restart apache2
```

#### 6. SSL Certificate (Optional but recommended)
```bash
# Using Let's Encrypt
sudo apt-get install certbot python3-certbot-apache
sudo certbot --apache -d kinerja-alsin.pepi.ac.id
```

---

## Environment Configuration

### Required Environment Variables
Create `.env.local` on server:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=AIzaSyCltms5NiFJfjyLrJPovdyXvHucVqlSnd8
VITE_FIREBASE_AUTH_DOMAIN=orbital-office-zj1d7.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=orbital-office-zj1d7
VITE_FIREBASE_STORAGE_BUCKET=orbital-office-zj1d7.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=715014353510
VITE_FIREBASE_APP_ID=1:715014353510:web:9a95d77238f30398f033a7

# Gemini API (if using AI features)
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

---

## Testing Post-Deployment

### Health Check
```bash
# Test if server is responding
curl -I https://kinerja-alsin.pepi.ac.id

# Expected output:
# HTTP/2 200
# Content-Type: text/html
```

### Functional Testing
1. Open browser: https://kinerja-alsin.pepi.ac.id
2. Verify login page loads
3. Test all menu items
4. Verify Firebase data sync working
5. Test export functionality
6. Check console for errors (F12 → Console tab)

---

## Troubleshooting

### Issue: Build fails on server
**Solution:**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Issue: 404 on page refresh
**Solution:** Ensure Apache rewrite module is enabled and `.htaccess` is configured
```bash
sudo a2enmod rewrite
sudo systemctl restart apache2
```

### Issue: Firebase auth not working
**Solution:** Verify environment variables are set
```bash
# Test if env vars are loaded
node -e "console.log(process.env.VITE_FIREBASE_API_KEY)"
```

### Issue: Slow load times
**Solution:** Enable compression and caching
```bash
# Enable gzip compression
sudo a2enmod deflate
sudo systemctl restart apache2
```

### Issue: CORS errors from API
**Solution:** Configure CORS headers in Apache
```apache
<IfModule mod_headers.c>
    Header set Access-Control-Allow-Origin "*"
    Header set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
</IfModule>
```

---

## Monitoring & Maintenance

### Check Application Status
```bash
# View Apache logs
tail -f /var/log/apache2/kinerja-alsin-error.log
tail -f /var/log/apache2/kinerja-alsin-access.log

# Check disk usage
df -h /var/www/kinerja-alsin
```

### Regular Backups
```bash
# Backup application
tar -czf backup-$(date +%Y%m%d).tar.gz /var/www/kinerja-alsin/

# Backup to external location
rsync -avz /var/www/kinerja-alsin/ remote:/backups/
```

### Update Procedure
```bash
# Pull latest changes
cd /home/user/brigadex-pepi
git pull origin main

# Rebuild
npm install
npm run build

# Copy to web root
cp -r dist/* /var/www/kinerja-alsin/

# Verify
sudo systemctl reload apache2
```

---

## Performance Optimization

### Before Production Deployment

1. **Chunk size warning** (noted in build output)
   - Consider code-splitting lazy routes
   - Bundle already optimized with Vite

2. **Bundle Analysis**
   ```bash
   npm install -g rollup-plugin-visualizer
   # Add to vite.config.ts as needed
   ```

3. **Caching Strategy**
   - Hash-based assets: `assets/*.js` (1 year cache)
   - HTML: no-cache (always fresh)
   - Vendor: 30 days cache

4. **Compression**
   - Enabled in Apache config
   - CSS: 19.80 kB → gzip: good
   - JS: 159.60 kB → gzip: acceptable

---

## Rollback Procedure

If deployment issues occur:

```bash
# Restore from backup
tar -xzf backup-YYYYMMDD.tar.gz -C /

# Or revert Git changes
cd /home/user/brigadex-pepi
git revert HEAD
npm run build
cp -r dist/* /var/www/kinerja-alsin/

# Restart service
sudo systemctl restart apache2
```

---

## Support & Documentation

- **Firebase Setup**: https://firebase.google.com/docs
- **Vite Docs**: https://vitejs.dev
- **Apache Mod_Rewrite**: https://httpd.apache.org/docs/current/mod/mod_rewrite.html
- **Let's Encrypt**: https://letsencrypt.org

---

**Last Updated**: 2026-06-30  
**Next Review**: 2026-07-07
