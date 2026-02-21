# 📋 Nuevas Funcionalidades en Ver Cliente

## Resumen de Cambios

Se agregaron **4 nuevos botones** en la página de ver cliente con funcionalidades adicionales:

### 1. 📄 **Historial del Cliente**
- **Ubicación**: Botón adicional (color naranja)
- **Funcionalidad**: Muestra un historial completo de:
  - Todas las ventas realizadas
  - Todos los pagos efectuados
  - Filtrado por tipo (Todo, Ventas, Pagos)
- **Modal**: `ModalHistorial.js`
- **API**: `GET /api/clientes/[clienteId]/historial`

### 2. 💳 **Historial de Pagos**
- **Ubicación**: Botón adicional (color rosa/magenta)
- **Funcionalidad**: Visualización detallada de pagos con:
  - Fecha del pago
  - Monto
  - Estado (Pagado, Pendiente, Vencido)
  - Método de pago
  - Filtros y ordenamiento
  - Resumen de totales
- **Modal**: `ModalHistorialPagos.js`
- **API**: `GET /api/clientes/[clienteId]/pagos`

### 3. 🖨️ **Imprimir Perfil (Impresora Térmica)**
- **Ubicación**: Botón adicional (color cian)
- **Funcionalidad**:
  - Conecta automáticamente con QZ Tray
  - Imprime perfil del cliente en impresora térmica
  - Muestra vista previa del formato
  - Incluye información de crédito
- **Modal**: `ModalImpresora.js`
- **Requisitos**: 
  - QZ Tray instalado (descarga desde: https://qz.io)
  - QZ ejecutándose en segundo plano
- **Características imprimibles**:
  - Nombre completo
  - Documento
  - Contacto (teléfono, email)
  - Compras totales
  - Puntos de fidelidad
  - Información de crédito

### 4. 📱 **Enviar por WhatsApp**
- **Ubicación**: Botón adicional (color verde WhatsApp)
- **Funcionalidad**:
  - Captura imagen del perfil del cliente
  - Envía por WhatsApp
  - Opciones de formato: PNG o PDF
  - Entrada manual de número de teléfono
  - Botón para abrir WhatsApp directamente
- **Modal**: `ModalWhatsApp.js`
- **API**: `POST /api/whatsapp/enviar-perfil-cliente`
- **Requiere**: `html2canvas` (ya instalado)
- **Nota**: El envío automático requiere integración con WhatsApp Business API

## Estructura de Archivos Creados

```
_Pages/admin/clientes/ver/
├── ver.js (ACTUALIZADO)
├── ver.module.css (ACTUALIZADO)
├── ModalHistorial.js (NUEVO)
├── ModalHistorialPagos.js (NUEVO)
├── ModalImpresora.js (NUEVO)
├── ModalWhatsApp.js (NUEVO)
└── modales.module.css (NUEVO)

app/api/
├── clientes/
│   └── [clienteId]/
│       ├── historial/route.js (NUEVO)
│       └── pagos/route.js (NUEVO)
└── whatsapp/
    └── enviar-perfil-cliente/route.js (NUEVO)
```

## Configuración Necesaria

### Para Imprimir (QZ Tray)
1. Descargar QZ Tray: https://qz.io/download/
2. Instalar en el servidor/cliente
3. Ejecutar QZ Tray como servicio
4. Configurar permisos en QZ Tray
5. Asegurar que el puerto 8181 esté disponible

### Para WhatsApp
**Opción 1: WhatsApp Web (Actual - Funciona sin API)**
- El botón abre WhatsApp Web o la app móvil
- No requiere configuración adicional

**Opción 2: WhatsApp Business API (Recomendado para producción)**
Requiere:
- Cuenta de WhatsApp Business
- Token de API (Twilio, Meta, MessageBird, etc.)
- Configurar en archivo `.env`:
```env
WHATSAPP_API_KEY=tu_api_key
WHATSAPP_PHONE_NUMBER=+1234567890
WHATSAPP_BUSINESS_ACCOUNT_ID=tu_account_id
```

Luego actualizar `app/api/whatsapp/enviar-perfil-cliente/route.js` con tu servicio

## Estilos de Botones

```css
.btnHistorial    - Gradiente naranja (Historial)
.btnPagos        - Gradiente rosa/magenta (Pagos)
.btnImpresora    - Gradiente cian (Impresora)
.btnWhatsApp     - Gradiente verde WhatsApp
```

## Uso de los Modales

### ModalHistorial
```jsx
import ModalHistorial from './ModalHistorial'

<ModalHistorial
  clienteId={cliente.id}
  alCerrar={() => setMostrarHistorial(false)}
  tema={tema}
/>
```

### ModalImpresora
```jsx
import ModalImpresora from './ModalImpresora'

<ModalImpresora
  cliente={cliente}
  alCerrar={() => setMostrarImpresora(false)}
  tema={tema}
/>
```

### ModalWhatsApp
```jsx
import ModalWhatsApp from './ModalWhatsApp'

<ModalWhatsApp
  cliente={cliente}
  alCerrar={() => setMostrarWhatsApp(false)}
  tema={tema}
/>
```

### ModalHistorialPagos
```jsx
import ModalHistorialPagos from './ModalHistorialPagos'

<ModalHistorialPagos
  clienteId={cliente.id}
  cliente={cliente}
  alCerrar={() => setMostrarHistorialPagos(false)}
  tema={tema}
/>
```

## Notas Técnicas

1. **Tema**: Todos los modales respetan el tema actual (light/dark)
2. **Responsive**: Los modales son responsive con breakpoints en 640px
3. **Carga de datos**: Los datos se cargan bajo demanda cuando se abre cada modal
4. **Estados**: Cada modal maneja su propio estado de carga y errores
5. **Animaciones**: Se incluyen animaciones suaves para mejor UX

## Próximas Mejoras Sugeridas

1. Agregar exportación a PDF del historial
2. Integrar con servicio de WhatsApp Business
3. Agregar descarga de reportes
4. Implementar filtros por fecha avanzados
5. Agregar notificaciones cuando se envía por WhatsApp
6. Configuración de plantillas de impresión personalizadas

## Troubleshooting

### QZ Tray no detecta impresoras
- Verificar que QZ Tray esté ejecutándose
- Revisar que la impresora esté conectada e instalada
- Reiniciar QZ Tray
- Verificar permisos del navegador

### WhatsApp abre pero no carga
- Verificar que el número teléfono incluya código de país
- En móvil, asegurar que WhatsApp esté instalado
- En desktop, usar navegador compatible (Chrome, Edge, Firefox)

### Modales no se ven correctamente
- Limpiar caché del navegador
- Verificar que `modales.module.css` esté importado
- Revisar consola para errores de JavaScript
