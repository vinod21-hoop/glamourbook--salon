# GlamourBook Salon Booking System

A full-stack salon booking application built with Laravel and React. This project includes admin and staff management, booking and payment processing, staff analytics, and profile management with avatar upload.

## Features

- User authentication with JWT-based login
- Admin dashboard with revenue tracking and monthly analysis
- Staff management with profile pictures, experience, and login credential generation
- Staff analytics showing bookings, availability, revenue, and rating
- Booking system with slot availability and staff filtering
- Razorpay integration for online payments
- Fully responsive React frontend with modern UI
- Laravel backend with RESTful API and database migrations
- File upload support for staff avatars
- CORS configured for frontend / backend communication

## Technology Stack

- **Backend:** Laravel 11, PHP 8.2
- **Frontend:** React 19, Vite, Tailwind CSS
- **Database:** MySQL
- **Authentication:** JWT
- **Payment:** Razorpay
- **Hosting:** GitHub for code; recommended deployment via Netlify (frontend) and Railway/Render (backend)

## Repository Structure

- `backend/` — Laravel API, models, controllers, services, migrations, and backend config
- `frontend/` — React/Vite app, pages, components, and frontend services

## Setup Instructions

### Backend

1. Copy `.env.example` to `.env`
2. Configure database settings
3. Install dependencies:
   ```bash
   cd backend
   composer install
   ```
4. Generate application key:
   ```bash
   php artisan key:generate
   ```
5. Run migrations:
   ```bash
   php artisan migrate
   ```
6. Create storage symlink:
   ```bash
   php artisan storage:link
   ```
7. Start backend server:
   ```bash
   php artisan serve --host=127.0.0.1 --port=8000
   ```

### Frontend

1. Install dependencies:
   ```bash
   cd frontend
   npm install
   ```
2. Start development server:
   ```bash
   npm run dev
   ```
3. Build for production:
   ```bash
   npm run build
   ```

## Deployment Instructions

### Frontend (React) - Netlify

1. **Connect Repository:**
   - Go to [netlify.com](https://netlify.com) and sign in
   - Click "Add new site" → "Import an existing project"
   - Connect your GitHub account and select `vinod21-hoop/glamourbook--salon`

2. **Build Settings:**
   - **Base directory:** `frontend`
   - **Build command:** `npm install && npm run build`
   - **Publish directory:** `dist`

3. **Environment Variables:**
   - Add: `VITE_API_URL=https://your-backend-domain.com/api`
   - (You'll update this once backend is deployed)

4. **Deploy:** Click "Deploy site"

### Backend (Laravel) - Railway.app (Recommended)

1. **Create Railway Account:**
   - Go to [railway.app](https://railway.app) and sign in

2. **Deploy from GitHub:**
   - Click "New Project" → "Deploy from GitHub repo"
   - Select `vinod21-hoop/glamourbook--salon`
   - Railway will auto-detect Laravel and create MySQL database

3. **Environment Variables:**
   ```
   APP_ENV=production
   APP_KEY=<generate-new-key>
   APP_DEBUG=false
   APP_URL=https://your-railway-domain.up.railway.app
   DB_CONNECTION=mysql
   DB_HOST=<auto-provided>
   DB_PORT=<auto-provided>
   DB_DATABASE=<auto-provided>
   DB_USERNAME=<auto-provided>
   DB_PASSWORD=<auto-provided>
   JWT_SECRET=<generate-new-secret>
   RAZORPAY_KEY=rzp_test_SafrqbrZ6o314C
   RAZORPAY_SECRET=RxdTZfd6N8onhs3PgAGkqWe5
   FRONTEND_URL=https://your-netlify-domain.netlify.app
   ```

4. **Run Migrations:**
   - In Railway dashboard, go to your app → "Variables" tab
   - Add: `RAILWAY_RUN_MIGRATIONS=true`
   - Or run manually: `php artisan migrate --force`

5. **Storage Link:**
   - Add environment variable: `RAILWAY_RUN_STORAGE_LINK=true`
   - Or Railway will auto-run `php artisan storage:link`

### Alternative: Backend on Render

1. **Create Render Account:**
   - Go to [render.com](https://render.com) and sign in

2. **Create Web Service:**
   - Click "New" → "Web Service"
   - Connect GitHub repo: `vinod21-hoop/glamourbook--salon`
   - **Root Directory:** `backend`
   - **Runtime:** PHP
   - **Build Command:** `composer install --no-dev --optimize-autoloader`
   - **Start Command:** `php artisan serve --host=0.0.0.0 --port=$PORT`

3. **Create MySQL Database:**
   - On Render, create a new MySQL database
   - Copy the connection details

4. **Environment Variables:** (Same as Railway above, but use Render's DB details)

### Final Steps

1. **Update Frontend Environment:**
   - In Netlify, update `VITE_API_URL` to your backend URL
   - Redeploy frontend

2. **Test the Application:**
   - Frontend should load and connect to backend
   - Try creating a staff member and uploading avatar
   - Test booking flow

## Notes

- This project includes staff management, admin analytics, and booking dashboards.
- Staff avatars are stored in `storage/app/public/staff` and served via `public/storage`.
- The frontend uses a shared `adminAPI` service to manage admin routes.

## Contact

If you need help with deployment or further enhancements, feel free to ask!
