#!/bin/bash

# Script de configuración inicial del VPS
# Ejecutar UNA SOLA VEZ en el VPS para preparar el entorno
# Uso: bash setup-vps.sh

set -e

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}🚀 Configuración inicial del VPS para CI/CD${NC}"
echo ""

# Verificar que se ejecuta como usuario deploy (no root)
if [ "$EUID" -eq 0 ]; then
    echo -e "${RED}❌ No ejecutes este script como root${NC}"
    echo "Ejecuta como usuario 'deploy' o tu usuario normal"
    exit 1
fi

BASE_DIR="/var/www/punto_de_venta_2025"
REPO_URL=""  # Se pedirá al usuario

# Solicitar URL del repositorio
read -p "📦 URL del repositorio Git (ej: https://github.com/usuario/repo.git): " REPO_URL

if [ -z "$REPO_URL" ]; then
    echo -e "${RED}❌ URL del repositorio requerida${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}📁 Creando estructura de directorios...${NC}"

# Crear directorios
sudo mkdir -p "$BASE_DIR"/{repo,releases,shared}
sudo mkdir -p "$BASE_DIR/shared"/{uploads,public/images/productos}

# Dar permisos
sudo chown -R $USER:$USER "$BASE_DIR"

echo -e "${GREEN}✅ Directorios creados${NC}"

# Clonar repositorio
echo ""
echo -e "${YELLOW}📥 Clonando repositorio...${NC}"
cd "$BASE_DIR"

if [ -d "repo/.git" ]; then
    echo -e "${YELLOW}⚠️  Repositorio ya existe, saltando clonado${NC}"
else
    git clone "$REPO_URL" repo
    echo -e "${GREEN}✅ Repositorio clonado${NC}"
fi

# Copiar script de deploy
echo ""
echo -e "${YELLOW}📄 Instalando script de deploy...${NC}"
if [ -f "repo/deploy.sh" ]; then
    cp repo/deploy.sh "$BASE_DIR/deploy.sh"
    chmod +x "$BASE_DIR/deploy.sh"
    echo -e "${GREEN}✅ Script de deploy instalado${NC}"
else
    echo -e "${RED}❌ No se encontró deploy.sh en el repositorio${NC}"
fi

# Crear .env si no existe
echo ""
if [ ! -f "$BASE_DIR/shared/.env" ]; then
    echo -e "${YELLOW}⚙️  Configurando .env...${NC}"
    echo "Creando archivo .env en shared/"
    echo ""
    echo "Por favor, proporciona las siguientes variables:"
    read -p "DB_HOST [localhost]: " DB_HOST
    DB_HOST=${DB_HOST:-localhost}
    
    read -p "DB_PORT [3306]: " DB_PORT
    DB_PORT=${DB_PORT:-3306}
    
    read -p "DB_USER: " DB_USER
    
    read -sp "DB_PASSWORD: " DB_PASSWORD
    echo ""
    
    read -p "DB_NAME [punto_venta_rd]: " DB_NAME
    DB_NAME=${DB_NAME:-punto_venta_rd}
    
    read -p "NEXT_PUBLIC_APP_URL [http://72.62.128.63:3000]: " APP_URL
    APP_URL=${APP_URL:-http://72.62.128.63:3000}
    
    cat > "$BASE_DIR/shared/.env" <<EOF
# Configuración de Base de Datos
DB_HOST=$DB_HOST
DB_PORT=$DB_PORT
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASSWORD
DB_NAME=$DB_NAME

# Configuración de Next.js
NEXT_PUBLIC_APP_URL=$APP_URL
VPS_UPLOAD_URL=http://72.62.128.63/uploads
VPS_IMAGE_BASE_URL=http://72.62.128.63
EOF
    
    chmod 600 "$BASE_DIR/shared/.env"
    echo -e "${GREEN}✅ Archivo .env creado${NC}"
else
    echo -e "${YELLOW}⚠️  .env ya existe, saltando creación${NC}"
fi

# Crear tabla de migraciones
echo ""
echo -e "${YELLOW}🗄️  Creando tabla de migraciones...${NC}"
if [ -f "repo/_DB/migrations_table.sql" ]; then
    read -sp "Contraseña MySQL para $DB_USER: " MYSQL_PASS
    echo ""
    
    if mysql -u"$DB_USER" -p"$MYSQL_PASS" "$DB_NAME" < repo/_DB/migrations_table.sql 2>/dev/null; then
        echo -e "${GREEN}✅ Tabla de migraciones creada${NC}"
    else
        echo -e "${YELLOW}⚠️  No se pudo crear la tabla de migraciones automáticamente${NC}"
        echo "Ejecuta manualmente: mysql -u $DB_USER -p $DB_NAME < repo/_DB/migrations_table.sql"
    fi
else
    echo -e "${YELLOW}⚠️  No se encontró migrations_table.sql${NC}"
fi

echo ""
echo -e "${GREEN}✅ Configuración inicial completada${NC}"
echo ""
echo "📋 Próximos pasos:"
echo "1. Migrar imágenes y uploads existentes a $BASE_DIR/shared/"
echo "2. Probar deploy manualmente: cd $BASE_DIR && bash deploy.sh"
echo "3. Configurar secretos en GitHub Actions"
echo ""
echo "📖 Revisa METODOLOGIA_CICD_MEJORADA.md para más detalles"

