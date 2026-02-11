# 🔧 Solución Estratégica al Error 413 en Producción

## 📋 Diagnóstico del Problema

El error **413 (Request Entity Too Large)** ocurre cuando el **servidor web** (nginx/Apache) rechaza la petición **antes** de que llegue a Next.js.

**Flujo del error:**
```
Cliente → Nginx/Apache → ❌ 413 Error → Next.js nunca recibe la petición
```

---

## 🔍 Paso 1: Identificar tu Servidor Web

### Verificar qué servidor web estás usando:

```bash
# Verificar si nginx está corriendo
sudo systemctl status nginx

# Verificar si apache está corriendo
sudo systemctl status apache2

# Verificar puertos abiertos
sudo netstat -tlnp | grep :80
sudo netstat -tlnp | grep :443
```

**Resultado esperado:**
- Si ves `nginx` → Usas Nginx
- Si ves `apache2` → Usas Apache
- Si no ves ninguno → Next.js está expuesto directamente (poco común)

---

## 🚀 Paso 2: Configurar Nginx (Si usas Nginx)

### 2.1. Encontrar tu archivo de configuración

```bash
# Buscar archivos de configuración
ls -la /etc/nginx/sites-available/
ls -la /etc/nginx/sites-enabled/

# O verificar configuración principal
cat /etc/nginx/nginx.conf | grep -A 5 "http {"
```

### 2.2. Editar configuración

**Opción A: Configuración global (recomendado)**

```bash
sudo nano /etc/nginx/nginx.conf
```

Agregar dentro del bloque `http {`:

```nginx
http {
    # ... otras configuraciones ...
    
    # Aumentar límite de body size globalmente
    client_max_body_size 50M;
    
    # Aumentar timeouts para procesamiento largo
    proxy_read_timeout 600s;
    proxy_connect_timeout 600s;
    proxy_send_timeout 600s;
    
    # Buffer sizes para archivos grandes
    client_body_buffer_size 128k;
    proxy_buffer_size 4k;
    proxy_buffers 4 32k;
    proxy_busy_buffers_size 64k;
}
```

**Opción B: Configuración específica para tu sitio**

```bash
sudo nano /etc/nginx/sites-available/punto-de-venta
# o el nombre de tu archivo de configuración
```

Agregar dentro del bloque `server {`:

```nginx
server {
    listen 80;
    server_name tu-dominio.com;
    
    # Límite específico para este sitio
    client_max_body_size 50M;
    
    # Timeouts
    proxy_read_timeout 600s;
    proxy_connect_timeout 600s;
    proxy_send_timeout 600s;
    
    # Configuración específica para API de importación
    location /api/productos/upload {
        client_max_body_size 50M;
        proxy_read_timeout 600s;
        
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    location /api/productos/upload/chunk {
        client_max_body_size 10M;  # Chunks de 5MB, con margen
        proxy_read_timeout 300s;
        
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
    
    # Resto de la configuración...
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 2.3. Verificar y aplicar configuración

```bash
# Verificar que la sintaxis sea correcta
sudo nginx -t

# Si todo está bien, recargar nginx
sudo systemctl reload nginx

# O reiniciar si es necesario
sudo systemctl restart nginx
```

---

## 🚀 Paso 3: Configurar Apache (Si usas Apache)

### 3.1. Encontrar tu archivo de configuración

```bash
# Buscar archivos de configuración
ls -la /etc/apache2/sites-available/
ls -la /etc/apache2/sites-enabled/
```

### 3.2. Editar configuración

```bash
sudo nano /etc/apache2/sites-available/punto-de-venta.conf
# o el nombre de tu archivo
```

Agregar dentro del bloque `<VirtualHost>`:

```apache
<VirtualHost *:80>
    ServerName tu-dominio.com
    
    # Aumentar límite de body size (50MB)
    LimitRequestBody 52428800
    
    # Aumentar timeouts (10 minutos)
    Timeout 600
    
    # Configuración específica para API de importación
    <Location "/api/productos/upload">
        LimitRequestBody 52428800  # 50MB
        Timeout 600
    </Location>
    
    <Location "/api/productos/upload/chunk">
        LimitRequestBody 10485760  # 10MB (chunks de 5MB con margen)
        Timeout 300
    </Location>
    
    # Proxy a Next.js
    ProxyPreserveHost On
    ProxyPass / http://localhost:3000/
    ProxyPassReverse / http://localhost:3000/
    
    # Headers
    ProxyPassReverse / http://localhost:3000/
    RequestHeader set X-Forwarded-Proto "http"
    RequestHeader set X-Forwarded-Port "80"
</VirtualHost>
```

### 3.3. Habilitar módulos necesarios

```bash
# Habilitar módulos de proxy
sudo a2enmod proxy
sudo a2enmod proxy_http
sudo a2enmod headers
```

### 3.4. Verificar y aplicar configuración

```bash
# Verificar configuración
sudo apache2ctl configtest

# Si todo está bien, recargar Apache
sudo systemctl reload apache2

# O reiniciar si es necesario
sudo systemctl restart apache2
```

---

## 💾 Paso 4: Aumentar Memoria del VPS (Si es necesario)

### 4.1. Verificar memoria actual

```bash
# Ver memoria disponible
free -h

# Ver uso de memoria
top
# o
htop
```

### 4.2. Si necesitas más memoria

**Opción A: Aumentar swap (temporal)**

```bash
# Ver swap actual
swapon --show

# Crear archivo de swap (2GB)
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Hacer permanente
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

**Opción B: Optimizar Node.js/PM2**

```bash
# Ver configuración actual de PM2
pm2 show punto-venta-2025

# Editar ecosystem.config.js
nano /var/www/punto_de_venta_2025/ecosystem.config.js
```

```javascript
module.exports = {
  apps: [{
    name: 'punto-venta-2025',
    script: 'server.js',
    instances: 1,
    exec_mode: 'fork',
    max_memory_restart: '512M',  // Reiniciar si usa más de 512MB
    env: {
      NODE_ENV: 'production',
      NODE_OPTIONS: '--max-old-space-size=512'  // Límite de heap de Node.js
    }
  }]
}
```

**Opción C: Actualizar plan del VPS**

Si el VPS tiene poca memoria (< 1GB), considera:
- Actualizar a un plan con más RAM
- O usar un servicio de hosting con más recursos

---

## 🔍 Paso 5: Verificar que Chunked Upload Funciona

### 5.1. Verificar que el endpoint existe

```bash
# Verificar que el archivo existe
ls -la /var/www/punto_de_venta_2025/app/api/productos/upload/chunk/route.js

# Verificar logs de PM2
pm2 logs punto-venta-2025 --lines 50
```

### 5.2. Probar chunked upload manualmente

```bash
# Crear archivo de prueba de 15MB
dd if=/dev/zero of=test.xlsx bs=1M count=15

# Intentar subirlo (debería dividirse en chunks automáticamente)
curl -X POST http://tu-dominio.com/api/productos/upload/chunk \
  -F "chunk=@test.xlsx" \
  -F "chunkIndex=0" \
  -F "totalChunks=3" \
  -F "fileId=test123" \
  -F "fileName=test.xlsx" \
  -F "fileSize=15728640" \
  -H "Cookie: userId=xxx; empresaId=xxx"
```

---

## 📊 Paso 6: Monitorear y Verificar

### 6.1. Ver logs en tiempo real

```bash
# Logs de nginx
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log

# Logs de apache
sudo tail -f /var/log/apache2/error.log
sudo tail -f /var/log/apache2/access.log

# Logs de PM2
pm2 logs punto-venta-2025
```

### 6.2. Verificar configuración aplicada

```bash
# Nginx: Ver configuración activa
sudo nginx -T | grep client_max_body_size

# Apache: Ver configuración activa
sudo apache2ctl -S
```

---

## ✅ Checklist de Verificación

- [ ] Identificado servidor web (nginx/apache)
- [ ] Configurado `client_max_body_size` (nginx) o `LimitRequestBody` (apache)
- [ ] Configurado timeouts aumentados
- [ ] Verificada sintaxis de configuración
- [ ] Recargado/reiniciado servidor web
- [ ] Verificado que chunked upload funciona
- [ ] Probado con archivo real
- [ ] Monitoreado logs para errores

---

## 🆘 Solución de Problemas

### Error: "nginx: [emerg] unknown directive"

**Causa:** Directiva mal escrita o en lugar incorrecto  
**Solución:** Verificar sintaxis con `sudo nginx -t`

### Error: "413 sigue apareciendo"

**Causa:** Configuración no aplicada o caché  
**Solución:**
```bash
# Reiniciar completamente
sudo systemctl restart nginx
# o
sudo systemctl restart apache2

# Limpiar caché del navegador
# Probar en modo incógnito
```

### Error: "Chunked upload no funciona"

**Causa:** Endpoint no existe o error en código  
**Solución:**
```bash
# Verificar que el archivo existe
ls -la app/api/productos/upload/chunk/route.js

# Rebuild
npm run build
pm2 restart punto-venta-2025
```

### Error: "Memoria insuficiente"

**Causa:** VPS con poca RAM  
**Solución:**
- Aumentar swap (temporal)
- Optimizar PM2 (reducir memoria)
- Actualizar plan VPS

---

## 📈 Valores Recomendados

| Componente | Valor Mínimo | Valor Recomendado |
|------------|--------------|-------------------|
| `client_max_body_size` (nginx) | 20M | **50M** |
| `LimitRequestBody` (apache) | 20971520 (20MB) | **52428800 (50MB)** |
| `proxy_read_timeout` | 300s | **600s** |
| `Timeout` (apache) | 300 | **600** |
| RAM VPS | 512MB | **1GB+** |
| Swap | 512MB | **2GB** |

---

## 🎯 Resumen Rápido

1. **Identificar servidor web:** `systemctl status nginx` o `systemctl status apache2`
2. **Configurar límite:** 50MB en nginx/apache
3. **Aumentar timeouts:** 600 segundos
4. **Recargar servidor:** `systemctl reload nginx` o `apache2`
5. **Verificar:** Probar con archivo real
6. **Monitorear:** Revisar logs

---

**Última actualización:** 2026-01-21  
**Versión:** 2.0.0 (Solución Completa Producción)


