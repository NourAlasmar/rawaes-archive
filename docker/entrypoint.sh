#!/bin/sh
set -e

cd /var/www/html

echo "🚀 Starting روائس Archive System..."

# Wait for database (optional)
if [ -n "$DB_HOST" ]; then
    echo "⏳ Waiting for database at $DB_HOST..."
    timeout=60
    while ! nc -z "$DB_HOST" "${DB_PORT:-3306}" 2>/dev/null; do
        timeout=$((timeout - 1))
        if [ $timeout -le 0 ]; then
            echo "❌ Database not reachable"
            exit 1
        fi
        sleep 1
    done
    echo "✅ Database ready"
fi

# Generate app key if missing
if [ -z "$APP_KEY" ] || [ "$APP_KEY" = "base64:" ]; then
    echo "🔑 Generating APP_KEY..."
    php artisan key:generate --force
fi

# Run migrations
echo "📦 Running migrations..."
php artisan migrate --force || echo "⚠️ Migration failed (will retry)"

# Create storage link
php artisan storage:link 2>/dev/null || true

# Cache for production
echo "⚡ Caching config/routes/views..."
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Ensure permissions
chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache
chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache

echo "✅ Ready! Starting supervisor..."

exec "$@"
