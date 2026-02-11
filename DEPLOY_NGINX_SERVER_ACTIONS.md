# Configuración de Nginx para Server Actions

## Problema

Después de un deploy, el navegador puede tener código JavaScript antiguo con hashes de Server Actions obsoletos, causando errores `UnrecognizedActionError` hasta que el usuario refresca manualmente.

## Solución Multi-Nivel

La solución implementada incluye:

1. **Headers HTTP** en Next.js para no-cache de chunks JS
2. **Service Worker** configurado con `NetworkFirst` para chunks JS (ya aplicado en código)
3. **Nginx** en producción para reforzar no-cache (requiere configuración manual)
4. **Hook de retry** automático como fallback (ya aplicado en código)

Esta sección documenta solo la configuración de **Nginx** que requiere cambios manuales en el servidor.

## Pasos para aplicar en producción

### 1. Editar configuración de Nginx

```bash
sudo nano /etc/nginx/sites-available/punto-venta-2025
```

### 2. Agregar regla ANTES del bloque `location / {`

Busca la sección donde están los bloques de imágenes (después de `/images/obras/` y `/documents/obras/`) y **antes** del bloque `location / {`, agrega:

```nginx
# ================================
# NO CACHEAR ARCHIVOS JS DE NEXT.JS (Server Actions)
# ================================
location ~* \/_next\/static\/chunks\/.*\.js$ {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto https;
    
    # Forzar no-cache
    add_header Cache-Control "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0";
    add_header Pragma "no-cache";
    expires -1;
}
```

### 3. Verificar sintaxis

```bash
sudo nginx -t
```

**Debe mostrar:**
```
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

### 4. Recargar Nginx

```bash
sudo systemctl reload nginx
```

### 5. Verificar estado

```bash
sudo systemctl status nginx
```

## Ubicación en el archivo

La regla debe estar en este orden:

1. Bloques de imágenes (`/images/productos/`, `/images/clientes/`, etc.)
2. **Bloque de JS (nuevo)** ← Aquí
3. Bloque `location / {` (proxy a Next.js)

## Notas importantes

- Esta configuración solo afecta archivos JS en `/_next/static/chunks/`
- Otros assets estáticos siguen siendo cacheados normalmente
- No afecta el desarrollo local (solo producción)
- El hook `useServerActionRetry` proporciona un fallback automático si aún ocurre el error
- **PWA:** La configuración del Service Worker también fue ajustada para usar `NetworkFirst` en chunks JS, evitando conflictos con el caché del navegador

## Verificación

Después de aplicar los cambios, prueba:

1. Hacer un deploy nuevo
2. Abrir la aplicación sin refrescar
3. Intentar cargar productos
4. No debería aparecer el error `UnrecognizedActionError`

Si aún aparece el error, el hook automáticamente recargará la página una vez.

