FROM php:8.2-cli

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
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install \
        pdo \
        pdo_mysql \
        mbstring \
        xml \
        zip \
        intl \
        gd \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y --no-install-recommends nodejs \
    && curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY . /app

RUN cd backend && composer install --no-dev --optimize-autoloader
RUN cd backend && rm -rf node_modules package-lock.json && npm install
RUN cd backend && npm run build

EXPOSE 8000

CMD ["sh", "-c", "cd backend && php artisan serve --host=0.0.0.0 --port=${PORT:-8000}"]
