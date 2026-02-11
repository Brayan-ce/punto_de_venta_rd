# 📦 Chunked Upload - Solución para Archivos Grandes

## 📋 Resumen

Sistema de **subida por chunks (partes)** que divide automáticamente archivos grandes en partes de 5MB para evitar el error 413 en producción.

---

## 🎯 Problema Resuelto

**Error en Producción:**
```
413 Payload Too Large
El archivo es demasiado grande (máximo 50MB)
```

**Causa:**
- Nginx/Apache rechaza archivos grandes antes de llegar a Next.js
- Límite de `client_max_body_size` en servidor web

**Solución:**
- ✅ Divide archivo automáticamente en chunks de 5MB
- ✅ Sube chunks secuencialmente
- ✅ Une chunks en el backend
- ✅ Transparente para el usuario

---

## 🔧 Cómo Funciona

### Flujo Automático

```
1. Usuario selecciona archivo Excel (ej: 30MB)
   ↓
2. Sistema detecta tamaño:
   - < 10MB → Subida directa
   - ≥ 10MB → Chunked upload
   ↓
3. Divide en chunks de 5MB:
   - Chunk 0: 0-5MB
   - Chunk 1: 5-10MB
   - Chunk 2: 10-15MB
   - ...
   ↓
4. Sube cada chunk secuencialmente
   ↓
5. Backend une chunks cuando llega el último
   ↓
6. Guarda archivo completo
   ↓
7. Retorna fileId para procesar
```

---

## 📊 Características

### ✅ Automático
- No requiere acción del usuario
- Detecta tamaño y decide automáticamente
- Transparente en la UI

### ✅ Progreso Real
- Muestra progreso total (0-100%)
- Actualiza durante cada chunk
- Feedback continuo

### ✅ Resiliente
- Valida integridad de chunks
- Limpia chunks temporales
- Maneja errores por chunk

### ✅ Seguro
- Chunks de 5MB (seguro para nginx/Apache)
- Validación de tamaño total
- Verificación de integridad

---

## 🔄 Endpoints

### 1. Upload Normal (archivos < 10MB)
```
POST /api/productos/upload
Body: FormData { file: File }
```

### 2. Upload por Chunks (archivos ≥ 10MB)
```
POST /api/productos/upload/chunk
Body: FormData {
  chunk: Blob,
  chunkIndex: number,
  totalChunks: number,
  fileId: string,
  fileName: string,
  fileSize: number
}
```

**Respuesta (chunk intermedio):**
```json
{
  "success": true,
  "chunkIndex": 0,
  "totalChunks": 6,
  "isComplete": false
}
```

**Respuesta (último chunk):**
```json
{
  "success": true,
  "fileId": "abc123...",
  "fileName": "productos.xlsx",
  "size": 31457280,
  "isComplete": true
}
```

---

## 🎨 UI Mejorada

### Mensaje Dinámico

**Archivo pequeño:**
```
Subiendo archivo...
██████████░░░░░░░░ 50%
```

**Archivo grande:**
```
Subiendo archivo en partes... (6 partes)
██████████░░░░░░░░ 50%
```

### Progreso Total

- Calcula progreso basado en bytes totales
- Actualiza durante cada chunk
- Muestra porcentaje real

---

## 📁 Almacenamiento Temporal

### Chunks Temporales

**Ubicación:**
- Desarrollo: `public/temp/excel/chunks/`
- Producción: `/var/data/pdv_temp/excel/chunks/`

**Nomenclatura:**
```
{fileId}_chunk_0
{fileId}_chunk_1
{fileId}_chunk_2
...
```

**Limpieza:**
- Se eliminan automáticamente después de unir
- Se limpian en caso de error
- No persisten en el sistema

---

## ⚙️ Configuración

### Tamaño de Chunk

```javascript
const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB
```

**Por qué 5MB:**
- ✅ Seguro para nginx/Apache (límite típico: 1-10MB)
- ✅ Balance entre cantidad de requests y tamaño
- ✅ Suficientemente grande para eficiencia

### Umbral de Chunked Upload

```javascript
if (fileSize < 10 * 1024 * 1024) {
    // Subida directa
} else {
    // Chunked upload
}
```

**Por qué 10MB:**
- Archivos pequeños: más rápido con upload directo
- Archivos grandes: necesario chunked upload

---

## 🔍 Validaciones

### Frontend
- ✅ Tamaño del archivo
- ✅ Tipo de archivo (.xlsx, .xls)
- ✅ Progreso de cada chunk

### Backend
- ✅ Tamaño de cada chunk (máx 5MB)
- ✅ Integridad (todos los chunks presentes)
- ✅ Tamaño total reconstruido
- ✅ Tamaño máximo final (100MB)

---

## 🚨 Manejo de Errores

### Error en Chunk Individual
```
- Limpia chunks anteriores
- Retorna error específico
- Usuario puede reintentar
```

### Chunk Faltante
```
- Detecta chunks faltantes
- Limpia chunks existentes
- Retorna error descriptivo
```

### Tamaño Incorrecto
```
- Valida tamaño reconstruido
- Compara con fileSize original
- Retorna error si no coincide
```

---

## 📈 Rendimiento

### Comparación

| Método | Archivo 30MB | Archivo 50MB | Archivo 100MB |
|--------|--------------|--------------|---------------|
| **Upload directo** | ❌ 413 Error | ❌ 413 Error | ❌ 413 Error |
| **Chunked upload** | ✅ 6 chunks | ✅ 10 chunks | ✅ 20 chunks |

### Tiempos Estimados

- **Chunk de 5MB**: ~2-5 segundos (depende de conexión)
- **Archivo de 30MB**: ~12-30 segundos (6 chunks)
- **Archivo de 50MB**: ~20-50 segundos (10 chunks)

---

## 🛠️ Solución de Problemas

### Error: "Chunk X no encontrado"
**Causa:** Un chunk falló al subir  
**Solución:** Reintentar la importación

### Error: "Tamaño no coincide"
**Causa:** Chunk corrupto o incompleto  
**Solución:** Verificar conexión y reintentar

### Error: "Timeout al subir chunk"
**Causa:** Conexión lenta o inestable  
**Solución:** Verificar conexión a internet

---

## 🔐 Seguridad

### Validaciones
- ✅ Autenticación requerida
- ✅ Solo admin puede importar
- ✅ Validación de tipo de archivo
- ✅ Límite de tamaño máximo (100MB)

### Limpieza
- ✅ Chunks temporales se eliminan
- ✅ Archivos expiran después de 24h
- ✅ No quedan archivos huérfanos

---

## 📝 Notas Técnicas

### Por qué funciona

1. **Chunks pequeños**: 5MB es seguro para cualquier servidor web
2. **Subida secuencial**: Evita saturar el servidor
3. **Unión en backend**: Más seguro y controlado
4. **Progreso real**: Usuario ve avance continuo

### Límites Actuales

- **Chunk size**: 5MB (configurable)
- **Archivo máximo**: 100MB (configurable)
- **Timeout por chunk**: 2 minutos
- **Total chunks**: Ilimitado (teóricamente)

---

## 🚀 Mejoras Futuras (Opcional)

### Upload Paralelo
```javascript
// Subir múltiples chunks en paralelo (más rápido)
await Promise.all(chunks.map(uploadChunk))
```

### Retry Automático
```javascript
// Reintentar chunks fallidos automáticamente
if (error) {
    await retryChunk(chunkIndex, maxRetries = 3)
}
```

### Compresión
```javascript
// Comprimir chunks antes de subir
const compressed = await compressChunk(chunk)
```

---

**Última actualización:** 2026-01-21  
**Versión:** 1.0.0 (Chunked Upload)

