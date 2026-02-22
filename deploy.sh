#!/bin/bash

echo "🚀 Iniciando deploy..."

cd /var/www/punto_de_venta_2025 || exit

git reset --hard HEAD
git pull origin main

rm -rf .next

npm install
npm run build

pm2 restart punto-venta-2025

echo "✅ Deploy terminado"