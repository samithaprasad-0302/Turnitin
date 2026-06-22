# Deployment Guide

## Prerequisites
- Node.js v14+ and npm
- MySQL server
- A web server (Nginx, Apache) or cloud platform
- Domain name (optional)
- SSL certificate (for production)

## Backend Deployment

### Option 1: Deploy on Linux Server (Ubuntu)

1. **Install Node.js and npm**
```bash
curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo apt-get install -y nodejs
```

2. **Install MySQL**
```bash
sudo apt-get install mysql-server
```

3. **Clone/Upload project**
```bash
git clone <repository> plagiarism-checker
cd plagiarism-checker/backend
```

4. **Install dependencies and setup**
```bash
npm install --production
cp .env.example .env
# Edit .env with production values
```

5. **Create database**
```bash
mysql -u root -p < database/schema.sql
```

6. **Use PM2 for process management**
```bash
npm install -g pm2
pm2 start src/server.js --name "plagiarism-api"
pm2 save
pm2 startup
```

7. **Setup Nginx reverse proxy**
```bash
sudo apt-get install nginx
sudo nano /etc/nginx/sites-available/default
```

Add this configuration:
```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

8. **Setup SSL with Let's Encrypt**
```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d api.yourdomain.com
```

### Option 2: Deploy on Heroku

1. **Install Heroku CLI**
```bash
npm install -g heroku
heroku login
```

2. **Create Heroku app**
```bash
cd backend
heroku create your-app-name
```

3. **Set environment variables**
```bash
heroku config:set DB_HOST=your_db_host
heroku config:set DB_USER=your_db_user
heroku config:set DB_PASSWORD=your_db_password
heroku config:set DB_NAME=your_db_name
heroku config:set JWT_SECRET=your_secret_key
```

4. **Deploy**
```bash
git push heroku main
```

### Option 3: Deploy on AWS EC2

1. **Launch EC2 instance**
   - Choose Ubuntu 20.04 LTS
   - t2.micro or larger
   - Allow ports 80, 443, 3306 in security group

2. **Connect and setup**
```bash
ssh -i your-key.pem ubuntu@your-instance-ip
sudo apt update
sudo apt install nodejs npm mysql-server nginx
```

3. **Follow the Linux setup steps above**

## Frontend Deployment

### Option 1: Deploy on Vercel

1. **Push code to GitHub**
```bash
git push origin main
```

2. **Import project in Vercel**
   - Go to vercel.com
   - Import GitHub repository
   - Set build command: `npm run build`
   - Set output directory: `build`

3. **Add environment variables**
```
REACT_APP_API_URL=https://api.yourdomain.com/api
```

### Option 2: Deploy on Netlify

1. **Connect GitHub**
   - Go to netlify.com
   - Connect GitHub account
   - Select repository

2. **Configure build settings**
   - Build command: `npm run build`
   - Publish directory: `build`

3. **Add environment variables**
```
REACT_APP_API_URL=https://api.yourdomain.com/api
```

### Option 3: Deploy on AWS S3 + CloudFront

1. **Build the app**
```bash
npm run build
```

2. **Create S3 bucket**
```bash
aws s3 mb s3://your-bucket-name
```

3. **Upload files**
```bash
aws s3 sync build/ s3://your-bucket-name/
```

4. **Create CloudFront distribution**
   - Set S3 bucket as origin
   - Set default root object to index.html

### Option 4: Traditional Hosting

1. **Build the app**
```bash
npm run build
```

2. **Upload to hosting provider**
   - FTP/SFTP the `build` folder contents to your server
   - Configure web server to serve `index.html` for all routes

## Production Checklist

### Backend
- [ ] Use HTTPS/SSL
- [ ] Set strong JWT secret
- [ ] Configure database backups
- [ ] Enable error logging
- [ ] Set up monitoring
- [ ] Configure CORS properly
- [ ] Enable rate limiting
- [ ] Setup environment variables
- [ ] Test all API endpoints
- [ ] Configure email service

### Frontend
- [ ] Build optimization
- [ ] Minification
- [ ] Configure API URL
- [ ] Setup analytics
- [ ] Configure error tracking
- [ ] Test on multiple browsers
- [ ] Mobile responsiveness check
- [ ] Performance optimization

## Database Backup

### Automated backup (Linux)
```bash
# Create backup script
sudo nano /usr/local/bin/backup-mysql.sh
```

```bash
#!/bin/bash
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
mysqldump -u root -p$MYSQL_PASSWORD --all-databases > /backup/mysql_$TIMESTAMP.sql
```

```bash
# Make executable
sudo chmod +x /usr/local/bin/backup-mysql.sh

# Add to crontab (daily at 2 AM)
sudo crontab -e
# Add: 0 2 * * * /usr/local/bin/backup-mysql.sh
```

## Monitoring & Maintenance

### Log monitoring
```bash
# Backend logs
pm2 logs plagiarism-api

# Check system resources
top
df -h
```

### Performance monitoring
- Use New Relic, DataDog, or similar tools
- Monitor API response times
- Track database performance
- Monitor server resources

### Security updates
```bash
# Ubuntu updates
sudo apt update
sudo apt upgrade

# Node.js packages
npm audit
npm update
```

## Troubleshooting

### Database connection issues
- Check database is running: `systemctl status mysql`
- Verify credentials in .env
- Check firewall rules

### Memory issues
- Increase swap: `sudo fallocate -l 4G /swapfile`
- Monitor with: `free -h`

### Email not sending
- Verify SMTP credentials
- Check firewall port 587
- Enable "Less secure apps" (Gmail)

## Performance Optimization

### Backend
- Use database indexing
- Implement caching (Redis)
- Enable gzip compression
- Optimize queries
- Use connection pooling

### Frontend
- Code splitting
- Lazy loading
- Image optimization
- Minification
- CDN for static assets

## Rollback Procedure

```bash
# Rollback to previous version
git log --oneline
git revert <commit-hash>
npm run build
pm2 restart all
```

## Support Resources

- Node.js docs: https://nodejs.org/docs/
- Express docs: https://expressjs.com/
- React docs: https://react.dev/
- MySQL docs: https://dev.mysql.com/doc/
