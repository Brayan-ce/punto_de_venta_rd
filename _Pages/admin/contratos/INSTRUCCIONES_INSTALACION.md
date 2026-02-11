# 🚀 Instrucciones de Instalación Rápida

## ⚡ Pasos para Activar el Sistema de PDF

### 1️⃣ Instalar Playwright

Abre tu terminal en la raíz del proyecto y ejecuta:

```bash
npm install playwright
```

### 2️⃣ Instalar el Navegador Chromium

```bash
npx playwright install chromium
```

### 3️⃣ Verificar la Instalación

Ejecuta tu servidor de desarrollo:

```bash
npm run dev
```

### 4️⃣ Probar la Funcionalidad

1. Ve a cualquier contrato: `/admin/contratos/ver/[id]`
2. Haz clic en el botón de menú (⋮) en la esquina superior derecha
3. Prueba las siguientes opciones:
   - ✅ **Imprimir**: Debería abrir una nueva ventana con el PDF
   - ✅ **Descargar PDF**: Debería descargar el archivo PDF
   - ✅ **Compartir**: Debería abrir un modal con opciones
   - ✅ **Enviar por WhatsApp**: Debería abrir WhatsApp con el mensaje
   - ✅ **Enviar Notificación**: Debería abrir modal de notificaciones

## 📋 Archivos Creados/Modificados

### ✅ Nuevos Archivos

```
_Pages/admin/contratos/
├── templates/
│   └── contratoTemplate.js          ← Plantilla HTML del contrato
├── api/
│   ├── generar-pdf/
│   │   └── route.js                 ← API para generar PDF
│   ├── notificaciones/
│   │   └── route.js                 ← API para notificaciones
│   └── enviar-email/
│       └── route.js                 ← API para enviar email
└── ver/
    └── [id]/
        └── acciones.js              ← Funciones de acciones
```

### ✅ Archivos Modificados

```
_Pages/admin/contratos/
├── servidor.js                      ← Agregada función obtenerDatosCompletosContrato
└── ver/
    └── [id]/
        ├── ver.js                   ← Agregadas funciones y modales
        └── ver.module.css           ← Agregados estilos para modales
```

## 🎯 Funcionalidades Disponibles

### 1. Imprimir Contrato
- Abre el PDF en una nueva ventana
- Activa automáticamente el diálogo de impresión del navegador
- El usuario puede seleccionar la impresora o guardar como PDF

### 2. Descargar PDF
- Genera el PDF en el servidor
- Descarga automáticamente al dispositivo del usuario
- Nombre del archivo: `Contrato_[NUMERO].pdf`

### 3. Compartir por WhatsApp
- Genera un mensaje formateado con los detalles del contrato
- Si el cliente tiene teléfono, abre WhatsApp directo a ese número
- Si no, abre WhatsApp para que el usuario seleccione el contacto

### 4. Enviar por Email
- Genera el PDF del contrato
- Lo adjunta a un email profesional
- **Nota**: Requiere configurar servicio de email (ver abajo)

### 5. Enviar Notificación
- Permite seleccionar tipo de notificación:
  - Contrato Creado
  - Recordatorio de Pago
  - Cuota Vencida
- **Nota**: Requiere configurar servicio de SMS/Push (ver abajo)

## 🔧 Configuración Opcional (Servicios Externos)

### Para Envío de Emails (SendGrid)

1. Crear cuenta en [SendGrid](https://sendgrid.com/)
2. Obtener API Key
3. Agregar a `.env`:

```env
SENDGRID_API_KEY=tu_api_key_aqui
```

4. Descomentar código en `_Pages/admin/contratos/api/enviar-email/route.js` (líneas 75-95)

### Para SMS/WhatsApp (Twilio)

1. Crear cuenta en [Twilio](https://www.twilio.com/)
2. Obtener credenciales
3. Agregar a `.env`:

```env
TWILIO_ACCOUNT_SID=tu_account_sid
TWILIO_AUTH_TOKEN=tu_auth_token
TWILIO_PHONE_NUMBER=tu_numero_twilio
```

4. Descomentar código en `_Pages/admin/contratos/api/notificaciones/route.js`

## ⚠️ Notas Importantes

### Funcionamiento Actual (Sin Servicios Externos)

- ✅ **Imprimir**: Funciona completamente
- ✅ **Descargar PDF**: Funciona completamente
- ✅ **Compartir WhatsApp**: Funciona completamente (abre WhatsApp Web/App)
- ⚠️ **Enviar Email**: Simula el envío (logs en consola)
- ⚠️ **Notificaciones**: Simula el envío (logs en consola)

### Para Producción

Si deseas que el envío de emails y notificaciones funcione realmente:

1. Configura los servicios externos (SendGrid, Twilio, etc.)
2. Descomenta el código correspondiente en los archivos API
3. Agrega las variables de entorno necesarias

## 🎨 Personalización del Contrato

### Modificar Diseño

Edita `_Pages/admin/contratos/templates/contratoTemplate.js`:

- **Logo de la empresa**: Línea ~100
- **Colores**: Buscar `#0ea5e9` y reemplazar
- **Fuentes**: Línea ~30 (`font-family`)
- **Cláusulas legales**: Líneas ~800-900

### Agregar Campos

1. Modifica la función `obtenerDatosCompletosContrato` en `servidor.js`
2. Actualiza la plantilla en `contratoTemplate.js`
3. Los datos estarán disponibles automáticamente

## 📱 Responsive

El sistema funciona en:
- ✅ Desktop
- ✅ Tablet
- ✅ Móvil

Los modales y botones se adaptan automáticamente al tamaño de pantalla.

## 🐛 Solución de Problemas Comunes

### "Error: Cannot find module 'playwright'"

```bash
npm install playwright
```

### "Error: Browser not found"

```bash
npx playwright install chromium
```

### El PDF no tiene estilos

Verifica que `printBackground: true` esté en las opciones de PDF (ya está configurado).

### Ventanas emergentes bloqueadas

El navegador puede bloquear las ventanas emergentes. Pide al usuario que permita ventanas emergentes para el sitio.

## ✅ Checklist de Verificación

- [ ] Playwright instalado (`npm list playwright`)
- [ ] Chromium instalado (`npx playwright install chromium`)
- [ ] Servidor corriendo (`npm run dev`)
- [ ] Probado "Imprimir" en un contrato
- [ ] Probado "Descargar PDF" en un contrato
- [ ] Probado "Compartir por WhatsApp"
- [ ] Modales abren correctamente
- [ ] PDF se genera con todos los datos

## 📞 Soporte

Si encuentras algún problema:

1. Revisa los logs de la consola del navegador (F12)
2. Revisa los logs del servidor (terminal)
3. Verifica que Playwright esté instalado correctamente
4. Consulta el archivo `README_PDF.md` para más detalles

---

**¡Listo para usar!** 🎉

El sistema está completamente funcional para imprimir, descargar y compartir contratos.
Para activar el envío real de emails y notificaciones, configura los servicios externos mencionados arriba.

