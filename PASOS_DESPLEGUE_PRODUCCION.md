# 🚀 Pasos para Despliegue en Producción

## 📋 Situación Actual

Has hecho `git pull` y estás ejecutando `npm run build`. Estos son los pasos siguientes:

---

## ✅ Paso 1: Esperar que termine el build

El build está en proceso. Espera a que termine completamente:

```bash
# Deberías ver algo como:
✓ Compiled successfully
✓ Linting and checking validity of types
✓ Collecting page data
✓ Generating static pages
✓ Finalizing page optimization

Route (app)                              Size     First Load JS
┌ ○ /                                     ... kB         ... kB
└ ○ /login                                ... kB         ... kB
...
```

**⚠️ Si hay errores**, corrígelos antes de continuar.

---

## ✅ Paso 2: Verificar NODE_ENV

Asegúrate de que `NODE_ENV=production` esté configurado:

```bash
# Verificar variable de entorno
echo $NODE_ENV

# Si no muestra "production", configurarlo:
export NODE_ENV=production

# O agregarlo permanentemente al .env.local:
echo "NODE_ENV=production" >> .env.local
```

---

## ✅ Paso 3: Reiniciar el Servidor

### Opción A: Si usas PM2 (Recomendado)

```bash
# Ver procesos actuales
pm2 list

# Reiniciar la aplicación con variables de entorno actualizadas
pm2 restart punto-venta-2025 --update-env

# O si no tienes nombre específico:
pm2 restart all --update-env

# Ver logs para verificar que inició correctamente
pm2 logs punto-venta-2025 --lines 50
```

### Opción B: Si usas node directamente

```bash
# Detener el proceso actual (Ctrl+C o kill)
# Luego iniciar:
NODE_ENV=production node server.js
```

### Opción C: Si usas systemd

```bash
sudo systemctl restart punto-venta-2025
sudo systemctl status punto-venta-2025
```

---

## ✅ Paso 4: Verificar que el Servidor Inició Correctamente

```bash
# Ver logs de PM2
pm2 logs punto-venta-2025 --err --lines 20

# O verificar que el puerto está escuchando
netstat -tulpn | grep :3000
# O
ss -tulpn | grep :3000
```

**Deberías ver:**
- ✅ "Ready on http://localhost:3000" (sin indicadores de desarrollo)
- ✅ Sin errores de cookies o autenticación
- ✅ Sin errores de Service Worker

---

## ✅ Paso 5: Verificar en el Navegador

### 5.1. Limpiar Cache del Navegador

**IMPORTANTE:** Después del deploy, los usuarios deben limpiar cookies o usar modo incógnito.

**Opción A: Modo Incógnito (Recomendado para pruebas)**
- Abre una ventana de incógnito
- Ve a `https://isiweek.com`
- Inicia sesión con el superadmin

**Opción B: Limpiar Cookies Manualmente**
1. Abre DevTools (F12)
2. Ve a **Application** → **Cookies** → `https://isiweek.com`
3. Click derecho → **Clear**
4. Recarga la página (Ctrl+Shift+R)

**Opción C: Desde la Consola del Navegador**
```javascript
// Limpiar todas las cookies
document.cookie.split(";").forEach(c => {
    document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
});
location.reload();
```

### 5.2. Verificar Cookies

En DevTools → Application → Cookies:
- ✅ `userId` existe
- ✅ `userTipo` existe y tiene el valor correcto (`superadmin`, `admin`, o `vendedor`)
- ✅ `empresaId` existe (excepto para superadmin)
- ✅ Todas tienen **Secure** marcado ✅

### 5.3. Verificar Autenticación

1. **Inicia sesión con superadmin**
2. **Debería redirigir a `/superadmin`** ✅
3. **NO debería aparecer en `/admin`** ✅

### 5.4. Verificar Service Worker

En DevTools → Application → Service Workers:
- ✅ Debe estar registrado (en producción)
- ✅ Versión debe ser `isiweek-pos-v1.0.6` o superior
- ✅ Estado: "activated and is running"

---

## ✅ Paso 6: Verificar que NO Aparece el Indicador "N"

1. Recarga la página (F5)
2. **NO debe aparecer el indicador "N" de Next.js** ✅
3. Si aparece, verifica:
   - `NODE_ENV=production` está configurado
   - El build fue exitoso
   - Las cookies tienen `secure: true`

---

## ✅ Paso 7: Probar Funcionalidades Críticas

### 7.1. Login de Superadmin
- ✅ Inicia sesión con superadmin
- ✅ Debe redirigir a `/superadmin`
- ✅ Debe mostrar el header de superadmin

### 7.2. Login de Admin
- ✅ Inicia sesión con admin
- ✅ Debe redirigir a `/admin`
- ✅ Debe mostrar el header de admin

### 7.3. Service Worker (PWA)
- ✅ Debe funcionar offline
- ✅ Debe cachear recursos correctamente
- ✅ NO debe cachear HTML de desarrollo

---

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
   echo $NODE_ENV
   # Debe mostrar: production
   ```

3. **Cierra sesión y vuelve a iniciar:**
   - Las cookies viejas pueden tener `secure: false`
   - Necesitas nuevas cookies con `secure: true`

### Si los cambios no se reflejan:

1. **Limpia el cache del Service Worker:**
   ```javascript
   // En la consola del navegador
   caches.keys().then(names => names.forEach(n => caches.delete(n)));
   navigator.serviceWorker.getRegistrations().then(regs => regs.forEach(r => r.unregister()));
   location.reload();
   ```

2. **Verifica que el build fue exitoso:**
   ```bash
   # Revisar logs del build
   tail -n 100 ~/.pm2/logs/punto-venta-2025-out.log
   ```

### Si hay errores en los logs:

```bash
# Ver errores de PM2
pm2 logs punto-venta-2025 --err --lines 50

# Ver errores del sistema
journalctl -u punto-venta-2025 -n 50
```

---

## 📝 Checklist Final

Antes de considerar el despliegue completo:

- [ ] Build completado sin errores
- [ ] `NODE_ENV=production` configurado
- [ ] Servidor reiniciado correctamente
- [ ] Cookies se establecen con `secure: true`
- [ ] Superadmin entra en `/superadmin`
- [ ] Admin entra en `/admin`
- [ ] No aparece el indicador "N" de Next.js
- [ ] Service Worker funciona correctamente
- [ ] No hay errores en los logs

---

## 🎯 Comandos Rápidos de Referencia

```bash
# 1. Build
npm run build

# 2. Verificar NODE_ENV
echo $NODE_ENV

# 3. Reiniciar PM2
pm2 restart punto-venta-2025 --update-env

# 4. Ver logs
pm2 logs punto-venta-2025 --lines 50

# 5. Ver estado
pm2 status

# 6. Verificar puerto
netstat -tulpn | grep :3000
```

---

## ✅ Resultado Esperado

Después de completar todos los pasos:

- ✅ Superadmin entra correctamente en `/superadmin`
- ✅ Admin entra correctamente en `/admin`
- ✅ Las cookies funcionan correctamente en HTTPS
- ✅ No aparece el indicador "N" de Next.js
- ✅ Service Worker funciona para PWA offline-first
- ✅ Los cambios se reflejan correctamente

---

**Última actualización:** Guía de despliegue post-build  
**Próximo paso:** Esperar que termine el build y seguir los pasos 2-7

