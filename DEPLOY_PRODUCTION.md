# 🚀 Guía de Despliegue en Producción

## ⚠️ Problema: Indicador "N" de Next.js en Producción

El indicador "N" de Next.js aparece cuando la aplicación detecta que está en modo desarrollo. Esto puede ocurrir si:

1. `NODE_ENV` no está configurado como `production`
2. El servidor está ejecutándose con `next dev` en lugar de `next start` o `node server.js`
3. La variable de entorno no está siendo leída correctamente

## ✅ Soluciones Implementadas

### 1. CSS para Ocultar el Indicador

Se agregó CSS en `app/globals.css` para ocultar el indicador de desarrollo de Next.js en todos los casos.

### 2. Configuración del Servidor

Asegúrate de configurar `NODE_ENV=production` antes de ejecutar el servidor.

## 📋 Pasos para Despliegue Correcto

### Opción 1: Usando `node server.js`

```bash
# 1. Construir la aplicación
npm run build

# 2. Ejecutar en producción
NODE_ENV=production node server.js
```

### Opción 2: Usando PM2 (Recomendado)

```bash
# 1. Construir la aplicación
npm run build

# 2. Iniciar con PM2
pm2 start server.js --name "punto-venta" --env production

# O crear un archivo ecosystem.config.js:
```

**ecosystem.config.js:**
```javascript
module.exports = {
  apps: [{
    name: 'punto-venta',
    script: 'server.js',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
  }]
}
```

Luego ejecutar:
```bash
pm2 start ecosystem.config.js
```

### Opción 3: Usando `next start`

```bash
# 1. Construir la aplicación
npm run build

# 2. Ejecutar en producción
NODE_ENV=production npm run start:next
```

## 🔍 Verificación

Para verificar que está en modo producción:

1. **Revisa los logs del servidor:**
   - No debería aparecer "ready - started server on..."
   - Debería aparecer "> Ready on http://localhost:3000" (sin indicadores de desarrollo)

2. **Inspecciona el código fuente en el navegador:**
   - No debería haber referencias a `__next-dev-overlay`
   - El indicador "N" no debería aparecer

3. **Verifica las variables de entorno:**
   ```bash
   # En el servidor
   echo $NODE_ENV
   # Debería mostrar: production
   ```

## 🛠️ Solución de Problemas

### Si el indicador "N" sigue apareciendo:

1. **Verifica que NODE_ENV esté configurado:**
   ```bash
   # En el servidor
   printenv | grep NODE_ENV
   ```

2. **Reconstruye la aplicación:**
   ```bash
   rm -rf .next
   npm run build
   NODE_ENV=production node server.js
   ```

3. **Limpia la caché del navegador:**
   - Presiona `Ctrl+Shift+R` (Windows/Linux) o `Cmd+Shift+R` (Mac)
   - O abre en modo incógnito

4. **Verifica que no estés usando `next dev`:**
   - Asegúrate de usar `node server.js` o `next start`, nunca `next dev`

## 📝 Notas Importantes

- El CSS agregado oculta el indicador, pero es mejor solucionar la causa raíz configurando `NODE_ENV=production`
- En algunos casos, el indicador puede aparecer brevemente antes de que el CSS se cargue
- Si usas un servicio de hosting (Vercel, Netlify, etc.), generalmente configuran `NODE_ENV=production` automáticamente

