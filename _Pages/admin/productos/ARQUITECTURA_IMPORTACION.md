# 🏗️ Arquitectura de Importación de Productos - Solución Profesional

## 📋 Resumen Ejecutivo

Sistema de importación de productos con **arquitectura escalable** que separa el **upload** del **procesamiento**, eliminando errores 413 y timeouts.

### 🎯 Problema Resuelto

**Antes:**
- ❌ Upload + procesamiento en una sola petición
- ❌ Error 413 en producción (archivos grandes)
- ❌ Timeouts en procesamiento largo
- ❌ UX bloqueante

**Ahora:**
- ✅ Upload rápido (solo guarda archivo)
- ✅ Procesamiento asíncrono (jobs)
- ✅ Sin límites HTTP estrictos
- ✅ UX no bloqueante con progreso

---

## 🏗️ Arquitectura Implementada

```
┌─────────────┐
│  Frontend   │
└──────┬──────┘
       │
       │ 1. POST /api/productos/upload
       │    (Solo guarda archivo)
       ▼
┌─────────────────┐
│ Storage Temporal│
│  (filesystem)   │
└──────┬──────────┘
       │
       │ 2. POST /api/productos/procesar
       │    { fileId: "xxx" }
       ▼
┌─────────────────┐
│  Job Service    │
│  (asíncrono)    │
└──────┬──────────┘
       │
       │ 3. Procesa en background
       ▼
┌─────────────────┐
│  Base de Datos  │
│  (productos)    │
└─────────────────┘
```

---

## 📁 Estructura de Archivos

```
lib/services/excel/
├── storageService.js      # Guarda/lee archivos temporales
├── jobService.js          # Gestiona jobs asíncronos
└── importarProductos.js  # Lógica de importación (existente)

app/api/productos/
├── upload/
│   └── route.js          # POST: Subir archivo (sin procesar)
├── procesar/
│   └── route.js          # POST: Iniciar procesamiento
└── importar/estado/
    └── [jobId]/
        └── route.js      # GET: Estado del job

_DB/
└── migracion_importaciones_productos.sql  # Tabla de jobs
```

---

## 🔄 Flujo Completo

### Paso 1: Upload del Archivo

**Endpoint:** `POST /api/productos/upload`

**Request:**
```javascript
FormData {
  file: File (Excel)
}
```

**Response:**
```json
{
  "success": true,
  "fileId": "abc123...",
  "fileName": "productos.xlsx",
  "size": 15728640,
  "expiresAt": 1734567890000
}
```

**Características:**
- ✅ Solo guarda el archivo
- ✅ No procesa Excel
- ✅ Responde rápido (< 1 segundo)
- ✅ Evita error 413

### Paso 2: Iniciar Procesamiento

**Endpoint:** `POST /api/productos/procesar`

**Request:**
```json
{
  "fileId": "abc123..."
}
```

**Response:**
```json
{
  "success": true,
  "jobId": 42,
  "mensaje": "Importación iniciada...",
  "estado": "processing"
}
```

**Características:**
- ✅ Crea job en BD
- ✅ Inicia procesamiento asíncrono
- ✅ Responde inmediatamente (202 Accepted)
- ✅ No bloquea la petición HTTP

### Paso 3: Verificar Estado

**Endpoint:** `GET /api/productos/importar/estado/[jobId]`

**Response:**
```json
{
  "success": true,
  "id": 42,
  "estado": "processing" | "completed" | "failed",
  "estadisticas": {
    "total": 1000,
    "procesados": 750,
    "creados": 500,
    "actualizados": 250,
    "errores": 0
  },
  "mensaje": "...",
  "errores": null
}
```

**Características:**
- ✅ Polling cada 2 segundos
- ✅ Muestra progreso en tiempo real
- ✅ Actualiza UI automáticamente

---

## 🗄️ Base de Datos

### Tabla: `importaciones_productos`

```sql
CREATE TABLE `importaciones_productos` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `empresa_id` INT(11) NOT NULL,
  `usuario_id` INT(11) NOT NULL,
  `file_id` VARCHAR(64) NOT NULL,
  `estado` ENUM('pending', 'processing', 'completed', 'failed', 'cancelled'),
  `estadisticas` JSON DEFAULT NULL,
  `mensaje` TEXT DEFAULT NULL,
  `errores` JSON DEFAULT NULL,
  `fecha_creacion` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `fecha_actualizacion` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_empresa` (`empresa_id`),
  KEY `idx_estado` (`estado`)
);
```

---

## 📦 Almacenamiento Temporal

### Ubicación

**Desarrollo:**
```
public/temp/excel/
```

**Producción:**
```
/var/data/pdv_temp/excel/
```

### Características

- ✅ Archivos con ID único
- ✅ Expiración automática (24 horas)
- ✅ Limpieza periódica
- ✅ Sin límite de tamaño (hasta 50MB configurado)

---

## 🎨 Frontend (UI)

### Estados del Componente

```javascript
{
  subiendo: false,        // Upload en progreso
  procesando: false,      // Procesamiento en progreso
  fileId: null,           // ID del archivo subido
  jobId: null,            // ID del job de procesamiento
  estadoJob: null,        // Estado actual del job
  resultado: null         // Resultado final
}
```

### Flujo de Usuario

1. **Seleccionar archivo** → Validación (tipo, tamaño)
2. **Clic en "Subir y Procesar"** → Upload rápido
3. **Procesamiento automático** → Polling de estado
4. **Ver progreso** → Barra de progreso animada
5. **Resultado final** → Estadísticas y errores

---

## 🔧 Configuración Requerida

### 1. Ejecutar Migración SQL

```bash
mysql -u usuario -p base_datos < _DB/migracion_importaciones_productos.sql
```

### 2. Crear Directorio Temporal

**Desarrollo:**
```bash
mkdir -p public/temp/excel
chmod 755 public/temp/excel
```

**Producción:**
```bash
sudo mkdir -p /var/data/pdv_temp/excel
sudo chown www-data:www-data /var/data/pdv_temp/excel
sudo chmod 755 /var/data/pdv_temp/excel
```

### 3. Configurar Nginx (Opcional pero Recomendado)

Aunque el nuevo flujo reduce la necesidad, aún es bueno tener límites razonables:

```nginx
# Para upload (puede ser más permisivo)
location /api/productos/upload {
    client_max_body_size 50M;
    proxy_read_timeout 60s;
}

# Para procesar (no necesita límite de body)
location /api/productos/procesar {
    proxy_read_timeout 300s;
}
```

---

## 🚀 Ventajas de esta Arquitectura

### ✅ Escalabilidad

- **Sin límites HTTP estrictos**: El upload es rápido, no necesita límites altos
- **Procesamiento independiente**: No bloquea el servidor HTTP
- **Jobs asíncronos**: Puede procesar múltiples importaciones en paralelo

### ✅ UX Mejorada

- **Feedback inmediato**: Usuario ve progreso en tiempo real
- **No bloqueante**: Puede cerrar el modal y volver después
- **Manejo de errores**: Errores claros y específicos

### ✅ Robustez

- **Recuperación de errores**: Si falla, el job queda registrado
- **Limpieza automática**: Archivos temporales se eliminan solos
- **Auditoría**: Historial completo de importaciones

---

## 🔄 Migración desde Sistema Anterior

### Compatibilidad

El endpoint anterior (`/api/productos/importar`) **sigue funcionando** para compatibilidad, pero se recomienda migrar al nuevo flujo.

### Plan de Migración

1. ✅ **Fase 1**: Implementar nuevo sistema (completado)
2. ⏳ **Fase 2**: Probar en staging
3. ⏳ **Fase 3**: Migrar frontend al nuevo flujo
4. ⏳ **Fase 4**: Deprecar endpoint antiguo (opcional)

---

## 📊 Comparación: Antes vs Ahora

| Aspecto | Antes | Ahora |
|---------|-------|-------|
| **Límite de tamaño** | 10MB (causaba 413) | 50MB (sin problemas) |
| **Tiempo de respuesta** | 30-300s (bloqueante) | < 1s (upload) + async |
| **Manejo de errores** | Todo o nada | Parcial con reporte |
| **UX** | Bloqueante | No bloqueante |
| **Escalabilidad** | Limitada | Alta |
| **Timeout** | Frecuente | Raro |

---

## 🛠️ Mejoras Futuras (Opcional)

### Nivel 3: Storage Externo

- [ ] Subida directa a S3/MinIO
- [ ] URLs firmadas para upload
- [ ] Sin pasar por Next.js

### Jobs Avanzados

- [ ] Cola de jobs (Bull, Agenda.js)
- [ ] Workers dedicados
- [ ] Priorización de jobs

### Notificaciones

- [ ] Email cuando termine
- [ ] Notificación en app
- [ ] Webhook callbacks

---

## 📝 Notas Técnicas

### Por qué funciona mejor

1. **Upload rápido**: Solo guarda bytes, no procesa
2. **Sin límites estrictos**: El servidor web no rechaza uploads rápidos
3. **Procesamiento asíncrono**: No bloquea el thread HTTP
4. **Jobs trackeables**: Puedes ver el progreso

### Límites Actuales

- **Upload**: 50MB (configurable)
- **Tiempo de procesamiento**: 5 minutos máximo
- **Expiración de archivos**: 24 horas
- **Polling**: Cada 2 segundos

---

**Última actualización:** 2026-01-21  
**Versión:** 2.0.0 (Arquitectura Profesional)

