#!/bin/sh
# Render tells the app which port to listen on through $PORT (10000 by default).
set -e
PORT="${PORT:-10000}"
sed -i "s/^Listen .*/Listen ${PORT}/" /etc/apache2/ports.conf
echo "Starting Apache on port ${PORT}"
exec apache2-foreground
