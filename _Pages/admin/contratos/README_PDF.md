# 📄 Sistema de Generación de PDF para Contratos

Sistema profesional de generación, impresión y compartir contratos de financiamiento en formato PDF.

## 🎯 Características Implementadas

### ✅ Generación de PDF
- ✅ Plantilla HTML profesional con diseño legal
- ✅ Generación server-side con Playwright
- ✅ Formato A4 con márgenes profesionales
- ✅ Incluye todos los datos del contrato, cliente, empresa
- ✅ Cronograma de pagos completo
- ✅ Cláusulas legales para República Dominicana
- ✅ Secciones de firma para todas las partes

### ✅ Funcionalidades de Acciones
- ✅ **Imprimir**: Abre el PDF en nueva ventana para impresión
- ✅ **Descargar PDF**: Descarga el contrato en formato PDF
- ✅ **Compartir por WhatsApp**: Envía resumen del contrato por WhatsApp
- ✅ **Enviar por Email**: Envía el PDF adjunto por correo electrónico
- ✅ **Enviar Notificaciones**: Sistema de notificaciones al cliente

### ✅ UI/UX Profesional
- ✅ Modales interactivos para compartir y notificar
- ✅ Botones con iconos y estados de carga
- ✅ Diseño responsive y accesible
- ✅ Soporte para tema claro y oscuro
- ✅ Animaciones suaves y feedback visual

## 📦 Instalación

### 1. Instalar Playwright

```bash
npm install playwright
# o
yarn add playwright
```

### 2. Instalar navegador Chromium

```bash
npx playwright install chromium
```

### 3. Variables de Entorno (Opcional)

Para funcionalidades de email y notificaciones, configurar en `.env`:

```env
# SendGrid (para emails)
SENDGRID_API_KEY=tu_api_key_aqui

# Twilio (para SMS/WhatsApp)
TWILIO_ACCOUNT_SID=tu_account_sid
TWILIO_AUTH_TOKEN=tu_auth_token
TWILIO_PHONE_NUMBER=tu_numero_twilio

# Firebase (para push notifications)
FIREBASE_PROJECT_ID=tu_project_id
FIREBASE_PRIVATE_KEY=tu_private_key
FIREBASE_CLIENT_EMAIL=tu_client_email
```

## 🚀 Uso

### Desde el Módulo Ver Contrato

1. Navegar a `/admin/contratos/ver/[id]`
2. Hacer clic en el botón de menú (⋮) en la esquina superior derecha
3. Seleccionar la acción deseada:
   - **Imprimir**: Abre vista de impresión del navegador
   - **Descargar PDF**: Descarga el archivo PDF
   - **Compartir**: Abre modal con opciones de compartir
   - **Enviar por WhatsApp**: Envía mensaje directo por WhatsApp
   - **Enviar Notificación**: Abre modal para seleccionar tipo de notificación

### Programáticamente

```javascript
import {
    imprimirContrato,
    descargarPDF,
    compartirWhatsApp,
    enviarNotificacion,
    enviarPorEmail
} from './_Pages/admin/contratos/ver/[id]/acciones'

// Imprimir contrato
await imprimirContrato(contratoId)

// Descargar PDF
await descargarPDF(contratoId, numeroContrato)

// Compartir por WhatsApp
compartirWhatsApp(contratoData)

// Enviar notificación
await enviarNotificacion(contratoId, 'recordatorio')

// Enviar por email
await enviarPorEmail(contratoId, 'cliente@email.com')
```

## 🏗️ Arquitectura

```
Contrato (DB)
   ↓
obtenerDatosCompletosContrato() [servidor.js]
   ↓
generarHTMLContrato() [contratoTemplate.js]
   ↓
Playwright (Chromium) [route.js]
   ↓
PDF Buffer
   ↓
Response (inline/attachment)
```

### Archivos Principales

```
app/api/contratos/
├── [id]/
│   └── pdf/
│       └── route.js                 # API para generar PDF
├── notificaciones/
│   └── route.js                     # API para notificaciones
└── enviar-email/
    └── route.js                     # API para enviar por email

_Pages/admin/contratos/
├── templates/
│   └── contratoTemplate.js          # Plantilla HTML del contrato
├── ver/
│   └── [id]/
│       ├── ver.js                   # Componente principal
│       ├── ver.module.css           # Estilos
│       └── acciones.js              # Funciones de acciones
└── servidor.js                      # Funciones server-side
```

## 🎨 Personalización

### Modificar Plantilla del Contrato

Editar `_Pages/admin/contratos/templates/contratoTemplate.js`:

```javascript
export function generarHTMLContrato(datos) {
    const { contrato, empresa, cliente, cuotas, activos } = datos
    
    // Personalizar HTML y estilos aquí
    return `
        <!DOCTYPE html>
        <html>
        ...
        </html>
    `
}
```

### Ajustar Estilos del PDF

Los estilos CSS dentro de la plantilla HTML controlan la apariencia del PDF:

```css
@page {
    size: A4;
    margin: 20mm 15mm;
}

body {
    font-family: 'Arial', 'Helvetica', sans-serif;
    font-size: 11pt;
    line-height: 1.6;
}
```

### Configurar Opciones de PDF

En `_Pages/admin/contratos/api/generar-pdf/route.js`:

```javascript
const pdfBuffer = await page.pdf({
    format: 'A4',              // Tamaño del papel
    margin: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm'
    },
    printBackground: true,     // Incluir colores de fondo
    preferCSSPageSize: true    // Usar tamaño CSS
})
```

## 🔌 Integraciones

### SendGrid (Email)

```javascript
// En _Pages/admin/contratos/api/enviar-email/route.js
import sgMail from '@sendgrid/mail'

sgMail.setApiKey(process.env.SENDGRID_API_KEY)

const msg = {
    to: email,
    from: empresa.email,
    subject: `Contrato ${contrato.numero_contrato}`,
    html: generarHTMLEmail(contrato, cliente, empresa),
    attachments: [{
        content: pdfBase64,
        filename: nombreArchivo,
        type: 'application/pdf',
        disposition: 'attachment'
    }]
}

await sgMail.send(msg)
```

### Twilio (SMS/WhatsApp)

```javascript
// En _Pages/admin/contratos/api/notificaciones/route.js
import twilio from 'twilio'

const client = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
)

await client.messages.create({
    body: mensaje,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: cliente.telefono
})
```

### WhatsApp Business API

```javascript
// Para WhatsApp Business API oficial
await client.messages.create({
    body: mensaje,
    from: 'whatsapp:+1234567890',
    to: `whatsapp:${cliente.telefono}`
})
```

## 🔒 Seguridad

### Validaciones Implementadas

- ✅ Verificación de sesión de usuario
- ✅ Validación de permisos por empresa
- ✅ Sanitización de parámetros
- ✅ Validación de formato de email
- ✅ Control de acceso a contratos por empresa

### Mejores Prácticas

1. **No guardar PDFs en la base de datos**: Los PDFs se generan on-demand
2. **Usar transacciones**: Para operaciones que modifican múltiples tablas
3. **Logging**: Registrar todas las acciones de generación y envío
4. **Rate limiting**: Implementar límites de generación por usuario/IP
5. **Validar datos**: Siempre validar datos antes de generar PDF

## 📊 Rendimiento

### Optimizaciones

- **Playwright headless**: Modo sin interfaz gráfica para mayor velocidad
- **Conexión reutilizable**: Pool de conexiones a la base de datos
- **Caché de plantillas**: Las plantillas HTML se compilan una vez
- **Lazy loading**: Los navegadores se inician solo cuando se necesitan

### Tiempos Estimados

- Generación de PDF: ~2-3 segundos
- Descarga: Inmediata (streaming)
- Envío por email: ~1-2 segundos adicionales
- Notificación SMS: ~1 segundo

## 🐛 Troubleshooting

### Error: "Playwright not found"

```bash
npm install playwright
npx playwright install chromium
```

### Error: "Cannot find module 'playwright'"

Verificar que Playwright esté en `dependencies` y no en `devDependencies`:

```json
{
  "dependencies": {
    "playwright": "^1.40.0"
  }
}
```

### Error: "Browser not found"

```bash
npx playwright install chromium --force
```

### PDF sin estilos o imágenes

Asegurarse de usar `printBackground: true` en las opciones de PDF:

```javascript
await page.pdf({
    printBackground: true,
    preferCSSPageSize: true
})
```

### Problemas de memoria en producción

Configurar límites de Playwright:

```javascript
const browser = await chromium.launch({
    headless: true,
    args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu'
    ]
})
```

## 🚀 Despliegue en Producción

### Vercel

Agregar a `vercel.json`:

```json
{
  "functions": {
    "api/**/*.js": {
      "memory": 1024,
      "maxDuration": 30
    }
  }
}
```

### Docker

Incluir en `Dockerfile`:

```dockerfile
FROM node:18-alpine

# Instalar dependencias de Playwright
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont

ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
ENV PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium-browser

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .

CMD ["npm", "start"]
```

### Variables de Entorno en Producción

```env
NODE_ENV=production
PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium-browser
```

## 📝 TODO / Mejoras Futuras

- [ ] Implementar firma digital con DocuSign/Adobe Sign
- [ ] Agregar watermark opcional a los PDFs
- [ ] Soporte para múltiples idiomas
- [ ] Plantillas personalizables por empresa
- [ ] Historial de PDFs generados
- [ ] Analíticas de apertura de emails
- [ ] Confirmación de lectura de WhatsApp
- [ ] Generación de PDFs en batch
- [ ] Compresión de PDFs para reducir tamaño
- [ ] Preview del PDF antes de descargar

## 📚 Referencias

- [Playwright Documentation](https://playwright.dev/)
- [PDF Generation Best Practices](https://playwright.dev/docs/api/class-page#page-pdf)
- [SendGrid API](https://docs.sendgrid.com/)
- [Twilio WhatsApp API](https://www.twilio.com/docs/whatsapp)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)

## 🤝 Soporte

Para problemas o preguntas:
1. Revisar la sección de Troubleshooting
2. Verificar los logs del servidor
3. Consultar la documentación de Playwright
4. Contactar al equipo de desarrollo

---

**Versión**: 1.0.0  
**Última actualización**: Enero 2026  
**Autor**: Sistema de Punto de Venta RD

