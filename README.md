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

## Deployment Recommendations

- Host the React frontend on **Netlify**
- Host the Laravel backend on **Railway.app** or **Render**
- Use **MySQL** on Railway or **PlanetScale** for production database
- Update frontend API base URL to the deployed backend endpoint

## Notes

- This project includes staff management, admin analytics, and booking dashboards.
- Staff avatars are stored in `storage/app/public/staff` and served via `public/storage`.
- The frontend uses a shared `adminAPI` service to manage admin routes.

## Contact

If you need help with deployment or further enhancements, feel free to ask!
