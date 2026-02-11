#!/bin/bash

# Script de deploy mejorado para Punto de Venta RD
# Este script se ejecuta en el VPS después de git pull
# Arquitectura: releases/ + symlinks + migraciones versionadas

set -e  # Salir si hay error

# ============================================
# CONFIGURACIÓN
# ============================================
APP_NAME="punto-venta-2025"
BASE_DIR="/var/www/punto_de_venta_2025"
REPO_DIR="$BASE_DIR/repo"
RELEASES="$BASE_DIR/releases"
SHARED="$BASE_DIR/shared"
DATE=$(date +%Y%m%d_%H%M%S)
NEW_RELEASE="$RELEASES/$DATE"

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# ============================================
# FUNCIONES
# ============================================
log_info() {
    echo -e "${GREEN}ℹ️  $1${NC}"
}

log_warn() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# ============================================
# VALIDACIONES INICIALES
# ============================================
log_info "🚀 Iniciando deploy $DATE"

# Verificar que existe el directorio del repo
if [ ! -d "$REPO_DIR" ]; then
    log_error "Directorio repo no encontrado: $REPO_DIR"
    exit 1
fi

# Verificar que existe shared
if [ ! -d "$SHARED" ]; then
    log_warn "Directorio shared no existe, creándolo..."
    mkdir -p "$SHARED"
    mkdir -p "$SHARED/uploads"
    mkdir -p "$SHARED/public/images/productos"
fi

# Verificar que existe .env en shared
if [ ! -f "$SHARED/.env" ]; then
    log_error "Archivo .env no encontrado en $SHARED/.env"
    log_error "Crea el archivo .env con las variables de entorno necesarias"
    exit 1
fi

# ============================================
# ACTUALIZAR CÓDIGO DESDE GIT
# ============================================
log_info "📥 Actualizando código desde Git..."
cd "$REPO_DIR"
git fetch origin
git pull origin main || git pull origin master

# ============================================
# CREAR NUEVO RELEASE
# ============================================
log_info "📦 Creando nuevo release: $NEW_RELEASE"
mkdir -p "$NEW_RELEASE"

# Copiar código (excluyendo node_modules, .next, .env)
rsync -a \
  --exclude=node_modules \
  --exclude=.next \
  --exclude=.env \
  --exclude=.env.local \
  --exclude=.git \
  --exclude=uploads \
  --exclude='public/images/productos' \
  "$REPO_DIR/" "$NEW_RELEASE/"

# ============================================
# CONFIGURAR SYMLINKS
# ============================================
log_info "🔗 Configurando symlinks..."

# .env desde shared
ln -sfn "$SHARED/.env" "$NEW_RELEASE/.env"

# uploads desde shared
ln -sfn "$SHARED/uploads" "$NEW_RELEASE/uploads"

# Imágenes de productos desde shared
mkdir -p "$NEW_RELEASE/public/images"
ln -sfn "$SHARED/public/images/productos" "$NEW_RELEASE/public/images/productos"

# ============================================
# INSTALAR DEPENDENCIAS Y BUILD
# ============================================
log_info "📚 Instalando dependencias..."
cd "$NEW_RELEASE"
npm ci --production --silent

log_info "🔨 Compilando aplicación Next.js..."
npm run build

# Verificar que el build fue exitoso
if [ ! -d ".next" ]; then
    log_error "Build falló: directorio .next no encontrado"
    exit 1
fi

log_info "✅ Build completado exitosamente"

# ============================================
# MIGRACIONES DE BASE DE DATOS (VERSIONADAS)
# ============================================
if [ -d "_DB" ] && [ "$(ls -A _DB/*.sql 2>/dev/null)" ]; then
    log_info "🗄️  Verificando migraciones pendientes..."
    
    # Cargar variables de entorno desde shared/.env
    export $(grep -v '^#' "$SHARED/.env" | xargs)
    
    # Verificar que existen las variables de DB
    if [ -z "$DB_USER" ] || [ -z "$DB_PASSWORD" ] || [ -z "$DB_NAME" ]; then
        log_warn "Variables de DB no encontradas, saltando migraciones"
    else
        # Verificar que existe la tabla de migraciones
        MIGRATIONS_TABLE_EXISTS=$(mysql -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" \
            -se "SELECT 1 FROM information_schema.tables WHERE table_schema='$DB_NAME' AND table_name='migrations'" 2>/dev/null || echo "")
        
        if [ -z "$MIGRATIONS_TABLE_EXISTS" ]; then
            log_warn "Tabla migrations no existe. Creándola..."
            mysql -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < "$NEW_RELEASE/_DB/migrations_table.sql" 2>/dev/null || \
            log_warn "No se pudo crear la tabla migrations. Ejecuta manualmente: _DB/migrations_table.sql"
        fi
        
        # Ejecutar migraciones pendientes
        for file in _DB/*.sql; do
            # Saltar migrations_table.sql (ya se ejecutó arriba)
            if [[ "$(basename $file)" == "migrations_table.sql" ]]; then
                continue
            fi
            
            MIG_NAME=$(basename "$file")
            
            # Verificar si la migración ya se ejecutó
            MIG_EXISTS=$(mysql -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" \
                -se "SELECT 1 FROM migrations WHERE name='$MIG_NAME'" 2>/dev/null || echo "")
            
            if [ -z "$MIG_EXISTS" ]; then
                log_info "  → Ejecutando migración: $MIG_NAME"
                
                if mysql -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < "$file" 2>/dev/null; then
                    # Registrar migración ejecutada
                    mysql -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" \
                        -e "INSERT INTO migrations(name) VALUES('$MIG_NAME')" 2>/dev/null || true
                    log_info "  ✅ Migración $MIG_NAME completada"
                else
                    log_error "  ❌ Error ejecutando migración $MIG_NAME"
                    # No salimos aquí, continuamos con otras migraciones
                fi
            else
                log_info "  ⏭️  Migración $MIG_NAME ya ejecutada, omitiendo"
            fi
        done
    fi
else
    log_info "⏭️  No hay migraciones pendientes"
fi

# ============================================
# ACTUALIZAR SYMLINK CURRENT
# ============================================
log_info "🔄 Actualizando symlink current..."
ln -sfn "$NEW_RELEASE" "$BASE_DIR/current"

# ============================================
# REINICIAR APLICACIÓN CON PM2
# ============================================
log_info "🔄 Reiniciando aplicación con PM2..."

# Verificar si PM2 está corriendo
if pm2 list | grep -q "$APP_NAME"; then
    log_info "  → Recargando aplicación existente..."
    pm2 reload "$APP_NAME" --update-env
else
    log_info "  → Iniciando nueva instancia..."
    cd "$BASE_DIR/current"
    pm2 start npm --name "$APP_NAME" -- start
fi

# Guardar configuración de PM2
pm2 save

# ============================================
# LIMPIEZA DE RELEASES ANTIGUOS (opcional)
# ============================================
# Mantener solo los últimos 5 releases
log_info "🧹 Limpiando releases antiguos..."
cd "$RELEASES"
ls -t | tail -n +6 | xargs -r rm -rf

# ============================================
# FINALIZACIÓN
# ============================================
log_info "✅ Deploy completado exitosamente"
log_info "📊 Release activo: $NEW_RELEASE"
log_info "🔗 Symlink: $BASE_DIR/current -> $NEW_RELEASE"

# Mostrar estado de PM2
log_info "📈 Estado de la aplicación:"
pm2 status "$APP_NAME"

echo ""
log_info "🎉 ¡Deploy finalizado! La aplicación está en producción."

