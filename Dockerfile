FROM php:8.2-apache

ENV DEBIAN_FRONTEND=noninteractive

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
        bash \
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

RUN a2enmod rewrite

RUN sed -i 's|DocumentRoot /var/www/html|DocumentRoot /app/backend/public|g' /etc/apache2/sites-available/000-default.conf \
    && sed -i 's|<Directory /var/www/html>|<Directory /app/backend/public>|g' /etc/apache2/apache2.conf \
    && printf '<Directory /app/backend/public>\n    AllowOverride All\n    Require all granted\n</Directory>\n' \
       >> /etc/apache2/sites-available/000-default.conf

RUN curl -fsSL https://nodejs.org/dist/v20.11.1/node-v20.11.1-linux-x64.tar.xz \
    | tar -xJ -C /usr/local --strip-components=1

WORKDIR /app

COPY . /app

RUN cd backend && composer update --no-dev --optimize-autoloader

RUN cd backend && rm -rf node_modules package-lock.json && npm install
RUN cd backend && npm run build || true

RUN cd backend && if [ ! -f .env ]; then cp .env.example .env; fi
RUN cd backend && php artisan key:generate --force

RUN cd backend \
    && mkdir -p storage/framework/sessions \
    && mkdir -p storage/framework/views \
    && mkdir -p storage/framework/cache \
    && mkdir -p storage/logs \
    && mkdir -p bootstrap/cache \
    && chmod -R 775 storage \
    && chmod -R 775 bootstrap/cache \
    && chown -R www-data:www-data /app/backend/storage /app/backend/bootstrap/cache

WORKDIR /app/backend

EXPOSE 80