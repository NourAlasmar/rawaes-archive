#!/bin/sh
set -e

cd /var/www/html

echo "🚀 Starting روائس Archive System..."

# Create .env file if missing (Coolify passes env vars directly, but Laravel needs the file)
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    touch .env
fi

# Wait for database
if [ -n "$DB_HOST" ]; then
    echo "⏳ Waiting for database at $DB_HOST..."
    timeout=60
    while ! nc -z "$DB_HOST" "${DB_PORT:-3306}" 2>/dev/null; do
        timeout=$((timeout - 1))
        if [ $timeout -le 0 ]; then
            echo "⚠️ Database not reachable after 60s, continuing anyway..."
            break
        fi
        sleep 1
    done
    echo "✅ Database reachable"
fi

# Generate app key only if missing
if [ -z "$APP_KEY" ] || [ "$APP_KEY" = "base64:" ]; then
    echo "🔑 Generating APP_KEY..."
    APP_KEY=$(php -r "echo 'base64:'.base64_encode(random_bytes(32));")
    export APP_KEY
    echo "APP_KEY=$APP_KEY" >> .env
    echo "⚠️ Generated APP_KEY — add it to Coolify env vars: $APP_KEY"
fi

# Run migrations
echo "📦 Running migrations..."
php artisan migrate --force 2>&1 || echo "⚠️ Migration failed (will retry on next boot)"

# Seed if database is empty
USER_COUNT=$(php artisan tinker --execute="echo App\Models\User::count();" 2>/dev/null | tail -1 || echo "0")
if [ "$USER_COUNT" = "0" ]; then
    echo "🌱 Seeding initial data..."
    php artisan db:seed --class=RawaesSeeder --force 2>&1 || echo "⚠️ Seeding skipped"
fi

# Storage link
php artisan storage:link 2>/dev/null || true

# Cache config/routes/views for production
echo "⚡ Optimizing..."
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Permissions
chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache
chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache

echo "✅ Ready!"

exec "$@"
