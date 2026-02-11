# Debug: Error 500 en Chunks de Next.js

## Problema

Los chunks de Next.js (`/_next/static/chunks/*.js`) están retornando error 500 en producción:
- `86f3d50639532d21.js` → 500 Internal Server Error
- `b446b81f49e81f47.js` → 500 Internal Server Error

## Hipótesis Generadas

### Hipótesis A: Los chunks no existen en el servidor
**Descripción**: Los archivos de chunks no fueron generados durante el build o fueron eliminados.
**Evidencia esperada**: El endpoint `/api/debug/chunks` retorna que los chunks no existen.

### Hipótesis B: Error en el servidor Next.js al servir chunks
**Descripción**: El servidor Next.js está lanzando un error al intentar servir los archivos.
**Evidencia esperada**: Logs del servidor muestran errores al servir chunks.

### Hipótesis C: Problema de configuración de Nginx
**Descripción**: La configuración de Nginx para chunks está causando el error 500.
**Evidencia esperada**: Los logs de Nginx muestran errores de proxy_pass o problemas de configuración.

### Hipótesis D: Problema de permisos de archivos
**Descripción**: Los archivos existen pero el proceso de Node.js no tiene permisos para leerlos.
**Evidencia esperada**: El endpoint de diagnóstico muestra que los archivos existen pero no son legibles.

### Hipótesis E: Conflicto entre location blocks de Nginx
**Descripción**: El location block específico para chunks está en conflicto con el location block general.
**Evidencia esperada**: Los logs de Nginx muestran que el request no llega al servidor Next.js.

## Instrumentación Agregada

1. **Endpoint de diagnóstico**: `/api/debug/chunks`
   - Verifica si los chunks existen
   - Lista chunks disponibles
   - Verifica permisos

2. **Servidor personalizado con logging**: `server.js`
   - Registra todos los requests a chunks
   - Registra errores del servidor

3. **Middleware con logging**: `middleware.js`
   - Registra requests generales (no chunks estáticos)

## Pasos de Diagnóstico

### 1. Verificar chunks en el servidor

Conectarse al servidor y ejecutar:

```bash
# Verificar si los chunks existen
curl https://isiweek.com/api/debug/chunks

# Verificar un chunk específico
curl "https://isiweek.com/api/debug/chunks?chunk=86f3d50639532d21.js"
```

### 2. Verificar logs de PM2

```bash
# Ver logs en tiempo real
pm2 logs punto-venta-2025 --lines 100

# Ver logs de errores
pm2 logs punto-venta-2025 --err --lines 100
```

### 3. Verificar logs de Nginx

```bash
# Ver logs de acceso
sudo tail -f /var/log/nginx/access.log | grep chunks

# Ver logs de error
sudo tail -f /var/log/nginx/error.log
```

### 4. Verificar existencia física de archivos

```bash
# Conectarse al servidor
ssh deploy@isiweek.com

# Verificar directorio de chunks
ls -la /var/www/punto_de_venta_2025/current/.next/static/chunks/ | head -20

# Verificar permisos
ls -la /var/www/punto_de_venta_2025/current/.next/static/chunks/86f3d50639532d21.js
```

### 5. Verificar configuración de Nginx

```bash
# Ver configuración actual
sudo cat /etc/nginx/sites-available/punto-venta-2025 | grep -A 10 "chunks"

# Verificar sintaxis
sudo nginx -t
```

## Soluciones Potenciales

### Solución 1: Rebuild completo

Si los chunks no existen:

```bash
cd /var/www/punto_de_venta_2025/current
npm run build
pm2 reload punto-venta-2025
```

### Solución 2: Corregir configuración de Nginx

Si el problema es Nginx, verificar que el location block esté correcto:

```nginx
location ~* \/_next\/static\/chunks\/.*\.js$ {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto https;
    
    # NO agregar headers aquí si Next.js ya los maneja
    # Esto puede causar conflictos
}
```

### Solución 3: Corregir permisos

```bash
# Dar permisos de lectura al usuario de Node.js
sudo chown -R $(whoami):$(whoami) /var/www/punto_de_venta_2025/current/.next
chmod -R 755 /var/www/punto_de_venta_2025/current/.next
```

### Solución 4: Eliminar location block específico de Nginx

Si el location block está causando problemas, eliminarlo y dejar que Next.js maneje los chunks directamente:

```bash
# Editar configuración de Nginx
sudo nano /etc/nginx/sites-available/punto-venta-2025

# Eliminar o comentar el bloque:
# location ~* \/_next\/static\/chunks\/.*\.js$ { ... }

# Recargar Nginx
sudo nginx -t
sudo systemctl reload nginx
```

## Análisis de Logs

Después de ejecutar los pasos de diagnóstico, analizar los logs en:
- `c:\Users\unsaa\WebstormProjects\punto_de_venta_rd\.cursor\debug.log` (logs del servidor personalizado)
- Logs de PM2 en el servidor
- Logs de Nginx en el servidor

Buscar entradas con:
- `hypothesisId: 'A'` → Chunks no existen
- `hypothesisId: 'B'` → Error en servidor Next.js
- `hypothesisId: 'C'` → Error en Nginx

## Notas Importantes

1. El servidor personalizado (`server.js`) ahora está activo y registra todos los requests a chunks
2. El endpoint `/api/debug/chunks` está disponible para diagnóstico
3. Los logs se escriben en el archivo de debug local durante desarrollo
4. En producción, verificar logs de PM2 y Nginx directamente en el servidor

