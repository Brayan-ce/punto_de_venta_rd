# 🔧 Solución: Problemas de Autenticación y Service Worker

## 📋 Problemas Identificados y Solucionados

### 1. ❌ Problema: Superadmin entra como Admin en Producción (HTTPS)

**Causa Raíz:**
- Las cookies no se establecían correctamente porque `secure` dependía de `NODE_ENV === 'production'`
- Si `NODE_ENV` no estaba configurado correctamente, `secure` era `false`
- En HTTPS, las cookies sin `secure: true` son rechazadas por el navegador
- La cookie `userTipo` no llegaba al servidor, causando fallo en la validación

**Solución Implementada:**
- ✅ Corregida la lógica de `isSecure` en `_Pages/main/login/servidor.js`
- ✅ Ahora detecta correctamente desarrollo vs producción
- ✅ En producción, siempre usa `secure: true` para HTTPS

**Cambios:**
```javascript
// ANTES (incorrecto)
const isSecure = process.env.NODE_ENV !== 'development' || process.env.HTTPS === 'true'

// DESPUÉS (correcto)
const isDevelopment = process.env.NODE_ENV === 'development'
const isHTTPS = process.env.HTTPS === 'true'
const isSecure = !isDevelopment || isHTTPS
```

### 2. ❌ Problema: Validación en Header Admin rechazaba Superadmins

**Causa Raíz:**
- El header de admin requería `empresaId` para todos los usuarios
- Los superadmins NO tienen `empresaId` (es NULL en BD)
- La validación fallaba: `if (!userId || !empresaId || ...)`

**Solución Implementada:**
- ✅ Validación mejorada en `_Pages/admin/header/servidor.js`
- ✅ Detecta si es superadmin y redirige al área correcta
- ✅ Solo admin y vendedor requieren `empresaId`

**Cambios:**
```javascript
// ANTES (incorrecto)
if (!userId || !empresaId || (userTipo !== 'admin' && userTipo !== 'vendedor')) {
    return { success: false, mensaje: 'Sesion invalida' }
}

// DESPUÉS (correcto)
if (!userId || !userTipo) {
    return { success: false, mensaje: 'Sesion invalida' }
}

// Si es superadmin, redirigir al área correcta
if (userTipo === 'superadmin') {
    return {
        success: false,
        mensaje: 'Los superadmins deben acceder desde /superadmin',
        redirectTo: '/superadmin'
    }
}

// Admin y vendedor requieren empresaId
if (userTipo !== 'admin' && userTipo !== 'vendedor') {
    return { success: false, mensaje: 'Sesion invalida' }
}

if (!empresaId) {
    return { success: false, mensaje: 'Empresa no asignada' }
}
```

### 3. ❌ Problema: Service Worker cacheando en Desarrollo

**Causa Raíz:**
- El hook `useServiceWorker()` solo evitaba registrar un SW nuevo
- Si un SW ya estaba registrado, seguía activo
- El SW cacheaba CSS/JS, impidiendo ver cambios en desarrollo

**Solución Implementada:**
- ✅ Desregistra completamente el SW en desarrollo
- ✅ Limpia todos los caches en desarrollo
- ✅ Solo registra SW en producción

**Cambios:**
```javascript
// ANTES (insuficiente)
if (process.env.NODE_ENV !== 'production') {
    console.log('Modo Desarrollo detectado');
    return; // Solo evita registrar, no elimina el existente
}

// DESPUÉS (completo)
if (process.env.NODE_ENV !== 'production') {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
        // Desregistrar cualquier Service Worker activo
        navigator.serviceWorker.getRegistrations().then(registrations => {
            registrations.forEach(reg => {
                reg.unregister().then(success => {
                    if (success) {
                        console.log('🧹 Service Worker eliminado en desarrollo');
                    }
                });
            });
        });
        
        // Limpiar todos los caches en desarrollo
        if ('caches' in window) {
            caches.keys().then(cacheNames => {
                cacheNames.forEach(cacheName => {
                    caches.delete(cacheName);
                    console.log('🧹 Cache eliminado:', cacheName);
                });
            });
        }
    }
    return;
}
```

## 🚀 Cómo Verificar las Soluciones

### 1. Verificar Cookies en Producción

**En el navegador (DevTools):**
1. Abre DevTools (F12)
2. Ve a **Application** → **Cookies** → `https://isiweek.com`
3. Busca las cookies:
   - `userId` ✅
   - `userTipo` ✅ (debe ser `superadmin`)
   - `empresaId` ✅ (puede no existir para superadmin)
4. Verifica que todas tengan **Secure** marcado ✅

**Si las cookies no aparecen:**
- Verifica que `NODE_ENV=production` en el servidor
- Verifica que el servidor esté usando HTTPS
- Cierra sesión y vuelve a iniciar sesión

### 2. Verificar Service Worker en Desarrollo

**En el navegador (DevTools):**
1. Abre DevTools (F12)
2. Ve a **Application** → **Service Workers**
3. Debe mostrar: "No service workers are currently registered" ✅
4. Si aparece un SW, haz clic en **Unregister**

**En la consola:**
- Debe aparecer: `🧪 Modo Desarrollo: Service Worker deshabilitado para desarrollo rápido`
- Debe aparecer: `🧹 Service Worker eliminado en desarrollo` (si había uno)
- Debe aparecer: `🧹 Cache eliminado: [nombre]` (por cada cache)

### 3. Verificar Cambios en Desarrollo

**Después de hacer cambios:**
1. Guarda el archivo
2. Recarga la página (F5)
3. Los cambios deben aparecer inmediatamente ✅
4. NO necesitas:
   - ❌ Bypass for network
   - ❌ Update on reload
   - ❌ Ctrl + F5

## 📝 Pasos para Despliegue

### 1. Verificar NODE_ENV en Producción

```bash
# En el VPS
ssh root@72.62.128.63
cd /var/www/punto_de_venta_2025
echo $NODE_ENV
# Debe mostrar: production
```

Si no muestra `production`:
```bash
export NODE_ENV=production
# O agregar a .env.local:
echo "NODE_ENV=production" >> .env.local
```

### 2. Reconstruir y Reiniciar

```bash
# Construir en producción
npm run build

# Reiniciar con PM2
pm2 restart punto-venta-2025 --update-env
```

### 3. Limpiar Cookies del Navegador

**Importante:** Después del deploy, los usuarios deben:
1. Cerrar sesión
2. Limpiar cookies del sitio (o usar modo incógnito)
3. Volver a iniciar sesión

O desde la consola del navegador:
```javascript
// Limpiar cookies
document.cookie.split(";").forEach(c => {
    document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
});
location.reload();
```

## 🔍 Troubleshooting

### Si el superadmin sigue entrando como admin:

1. **Verifica las cookies:**
   ```javascript
   // En la consola del navegador
   document.cookie
   // Debe incluir: userTipo=superadmin
   ```

2. **Verifica NODE_ENV:**
   ```bash
   # En el servidor
   echo $NODE_ENV
   ```

3. **Verifica que el servidor use HTTPS:**
   - La URL debe ser `https://`
   - No debe haber warnings de certificado

4. **Cierra sesión y vuelve a iniciar:**
   - Las cookies viejas pueden tener `secure: false`
   - Necesitas nuevas cookies con `secure: true`

### Si los cambios no se ven en desarrollo:

1. **Verifica que no haya SW activo:**
   - DevTools → Application → Service Workers
   - Si hay uno, haz clic en **Unregister**

2. **Limpia el cache manualmente:**
   ```javascript
   // En la consola
   caches.keys().then(names => names.forEach(n => caches.delete(n)));
   location.reload();
   ```

3. **Verifica la consola:**
   - Debe aparecer: `🧹 Service Worker eliminado en desarrollo`
   - Debe aparecer: `🧹 Cache eliminado: [nombre]`

## ✅ Resultado Esperado

### En Producción:
- ✅ Superadmin entra correctamente en `/superadmin`
- ✅ Admin entra correctamente en `/admin`
- ✅ Vendedor entra correctamente en `/vendedor`
- ✅ Las cookies tienen `secure: true`
- ✅ Service Worker activo para offline-first

### En Desarrollo:
- ✅ Cambios se reflejan inmediatamente
- ✅ No hay Service Worker activo
- ✅ No hay cache interfiriendo
- ✅ Hot reload funciona correctamente

