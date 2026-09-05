# 🔧 Solución al Error 413 en Producción

## 📋 Problema

El error **413 (Request Entity Too Large)** ocurre cuando el archivo Excel excede el límite de tamaño configurado en el servidor web (nginx, Apache, etc.) **antes** de que llegue a Next.js.

### Síntomas

```
Failed to load resource: the server responded with a status of 413 ()
Error al importar: SyntaxError: Unexpected token '<', "<html>..." is not valid JSON
```

El servidor web rechaza la petición y devuelve HTML (página de error) en lugar de JSON, causando el error de parsing.

---

## ✅ Soluciones Aplicadas en el Código

### 1. Aumento del Límite en el Código

- **Límite aumentado**: De 10MB a **20MB**
- **Validación mejorada**: El frontend valida antes de enviar
- **Manejo de errores**: Detecta respuestas HTML y muestra mensaje claro

### 2. Configuración de Next.js

- **Runtime**: Configurado para Node.js
- **Timeout**: 5 minutos máximo para procesar
- **Manejo de FormData**: Optimizado para archivos grandes

---

## 🚀 Configuración Requerida en Producción

### Opción 1: Si usas Nginx (Recomendado)

Edita tu configuración de nginx (`/etc/nginx/sites-available/tu-sitio`):

```nginx
server {
    # ... otras configuraciones ...
    
    # Aumentar límite de body size para importaciones
    client_max_body_size 20M;
    
    # Aumentar timeout para procesamiento largo
    proxy_read_timeout 300s;
    proxy_connect_timeout 300s;
    proxy_send_timeout 300s;
    
    location /api/productos/importar {
        # Límite específico para esta ruta (opcional, más permisivo)
        client_max_body_size 20M;
        proxy_read_timeout 300s;
        
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**Después de editar:**
```bash
sudo nginx -t  # Verificar configuración
sudo systemctl reload nginx  # Recargar nginx
```

### Opción 2: Si usas Apache

Edita tu configuración de Apache (`/etc/apache2/sites-available/tu-sitio.conf`):

```apache
<VirtualHost *:80>
    # ... otras configuraciones ...
    
    # Aumentar límite de body size
    LimitRequestBody 20971520  # 20MB en bytes
    
    # Aumentar timeout
    Timeout 300
    
    <Location "/api/productos/importar">
        LimitRequestBody 20971520  # 20MB específico para esta ruta
        Timeout 300
    </Location>
</VirtualHost>
```

**Después de editar:**
```bash
sudo apache2ctl configtest  # Verificar configuración
sudo systemctl reload apache2  # Recargar Apache
```

### Opción 3: Si usas PM2 directamente (sin proxy)

Si ejecutas Next.js directamente con PM2 sin nginx/Apache, el límite viene de Node.js/Next.js:

**Crear archivo `ecosystem.config.js`:**

```javascript
module.exports = {
  apps: [{
    name: 'punto-de-venta',
    script: 'server.js',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      // Next.js respeta estas variables
      BODY_SIZE_LIMIT: '20mb'
    },
    max_memory_restart: '1G',
    instances: 1,
    exec_mode: 'fork'
  }]
}
```

**Iniciar con PM2:**
```bash
pm2 start ecosystem.config.js
pm2 save
```

---

## 🔍 Verificar la Configuración

### 1. Verificar límite actual de nginx

```bash
nginx -T 2>/dev/null | grep client_max_body_size
```

### 2. Probar con curl

```bash
# Crear un archivo de prueba de 15MB
dd if=/dev/zero of=test.xlsx bs=1M count=15

# Intentar subirlo (debería funcionar ahora)
curl -X POST http://tu-dominio.com/api/productos/importar \
  -F "file=@test.xlsx" \
  -H "Cookie: userId=xxx; empresaId=xxx"
```

### 3. Revisar logs

```bash
# Logs de nginx
sudo tail -f /var/log/nginx/error.log

# Logs de la aplicación
pm2 logs punto-de-venta
```

---

## 📊 Límites Configurados

| Componente | Límite Anterior | Límite Actual |
|------------|----------------|---------------|
| Frontend validación | 10MB | **20MB** |
| Backend validación | 10MB | **20MB** |
| Nginx (requiere config) | ~1MB (default) | **20MB** (configurar) |
| Apache (requiere config) | ~2MB (default) | **20MB** (configurar) |
| Timeout | 60s (default) | **300s (5 min)** |

---

## ⚠️ Notas Importantes

1. **El código ya está actualizado** - Solo necesitas configurar el servidor web
2. **Reinicia el servidor** después de cambiar la configuración
3. **Verifica los logs** si sigue fallando
4. **Considera comprimir Excel** si los archivos son muy grandes (>15MB)

---

## 🆘 Si el Problema Persiste

1. **Verifica qué servidor web usas:**
   ```bash
   # Ver si nginx está corriendo
   sudo systemctl status nginx
   
   # Ver si apache está corriendo
   sudo systemctl status apache2
   ```

2. **Revisa los logs del servidor web:**
   ```bash
   # Nginx
   sudo tail -f /var/log/nginx/error.log
   
   # Apache
   sudo tail -f /var/log/apache2/error.log
   ```

3. **Verifica el tamaño real del archivo:**
   ```bash
   ls -lh archivo.xlsx
   ```

4. **Contacta al administrador del servidor** si no tienes acceso root

---

**Última actualización:** 2026-01-21

