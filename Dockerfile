FROM php:8.2-cli

ENV DEBIAN_FRONTEND=noninteractive

# Install system dependencies
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        curl \
        git \
        ca-certificates \
        unzip \
        zip \
        libzip-dev \
        libicu-dev \
        libpng-dev \
        libjpeg-dev \
        libfreetype6-dev \
        zlib1g-dev \
        libxml2-dev \
        libonig-dev \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install \
        pdo \
        pdo_mysql \
        mbstring \
        dom \
        xml \
        zip \
        intl \
        gd \
    && curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js
RUN curl -fsSL https://nodejs.org/dist/v20.11.1/node-v20.11.1-linux-x64.tar.xz \
    | tar -xJ -C /usr/local --strip-components=1

WORKDIR /app

# Copy all files
COPY . /app

# Install PHP dependencies
RUN cd backend && composer update --no-dev --optimize-autoloader

# Install Node dependencies and build
RUN cd backend && rm -rf node_modules package-lock.json && npm install
RUN cd backend && npm run build || true

# Generate .env file if it doesn't exist
RUN cd backend && if [ ! -f .env ]; then cp .env.example .env; fi

# Generate APP_KEY
RUN cd backend && php artisan key:generate --force

# Create Laravel folders and set permissions
RUN cd backend \
    && mkdir -p storage/framework/sessions \
    && mkdir -p storage/framework/views \
    && mkdir -p storage/framework/cache \
    && mkdir -p storage/logs \
    && mkdir -p bootstrap/cache \
    && chmod -R 775 storage \
    && chmod -R 775 bootstrap/cache

EXPOSE 8000

CMD ["sh", "-c", "cd backend && php artisan migrate --force && php artisan serve --host=0.0.0.0 --port=${PORT:-8000}"]