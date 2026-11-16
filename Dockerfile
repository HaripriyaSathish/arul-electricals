# =====================================================================
# ARUL ELECTRICAL — one container = React website + admin + PHP API
# Used by Render (free web service). Database: Neon PostgreSQL via DATABASE_URL.
# =====================================================================

# ---------- 1. Build the React frontend ----------
FROM node:22-alpine AS frontend
WORKDIR /app
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY frontend/ ./
# .env.production sets VITE_API_URL to "" so the site calls the API on the same domain
RUN npm run build

# ---------- 2. PHP 8.2 + Apache ----------
FROM php:8.2-apache

RUN apt-get update \
 && apt-get install -y --no-install-recommends libpq-dev libpng-dev libjpeg62-turbo-dev libwebp-dev \
 && docker-php-ext-configure gd --with-jpeg --with-webp \
 && docker-php-ext-install -j"$(nproc)" pdo_pgsql pdo_mysql gd \
 && a2enmod rewrite headers \
 && rm -rf /var/lib/apt/lists/*

COPY deploy/apache.conf /etc/apache2/sites-available/000-default.conf
COPY deploy/php.ini /usr/local/etc/php/conf.d/zz-app.ini
COPY deploy/start.sh /usr/local/bin/start.sh

COPY backend/ /var/www/backend/
COPY --from=frontend /app/dist/ /var/www/html/

RUN sed -i 's/\r$//' /usr/local/bin/start.sh \
 && chmod +x /usr/local/bin/start.sh \
 && rm -f /var/www/backend/.env \
 && mkdir -p /var/www/backend/uploads/media /var/www/backend/logs \
 && chown -R www-data:www-data /var/www/backend/uploads /var/www/backend/logs

ENV PORT=10000
EXPOSE 10000
CMD ["/usr/local/bin/start.sh"]
