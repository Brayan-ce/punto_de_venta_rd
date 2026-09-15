# 📊 Documentación Técnica: Importación de Productos desde Excel

## 📋 Índice

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Arquitectura de la Solución](#arquitectura-de-la-solución)
3. [Estructura del Excel](#estructura-del-excel)
4. [Pipeline de Procesamiento](#pipeline-de-procesamiento)
5. [Limpieza y Normalización de Datos](#limpieza-y-normalización-de-datos)
6. [Validación de Datos](#validación-de-datos)
7. [Reglas de Negocio](#reglas-de-negocio)
8. [Manejo de Errores](#manejo-de-errores)
9. [API Endpoints](#api-endpoints)
10. [Componentes UI](#componentes-ui)

---

## 🎯 Resumen Ejecutivo

Sistema profesional de importación masiva de productos desde archivos Excel con:

- ✅ **Limpieza automática** de datos sucios
- ✅ **Validación robusta** por fila
- ✅ **Transacciones seguras** en base de datos
- ✅ **Manejo de errores** detallado
- ✅ **Reglas de negocio** implementadas
- ✅ **UI intuitiva** con feedback en tiempo real

### Tecnologías Utilizadas

- **Next.js 16** (App Router)
- **xlsx** (lectura de Excel)
- **MySQL2** (base de datos)
- **React** (interfaz de usuario)

---

## 🏗️ Arquitectura de la Solución

```
┌─────────────────┐
│   Frontend      │
│  (React UI)     │
└────────┬────────┘
         │ POST /api/productos/importar
         ▼
┌─────────────────┐
│   API Route     │
│  (Next.js)      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Servicio       │
│  Importación    │
└────────┬────────┘
         │
         ├─► Limpieza de Datos
         ├─► Validación
         ├─► Procesamiento
         └─► Inserción BD
```

### Estructura de Archivos

```
lib/
├── utils/
│   └── normalizadores.js          # Funciones de limpieza
└── services/
    └── excel/
        └── importarProductos.js   # Lógica de importación

app/
└── api/
    └── productos/
        └── importar/
            └── route.js           # Endpoint API

_Pages/admin/productos/
├── ImportarProductos.js          # Componente UI
└── productos.js                  # Integración
```

---

## 📄 Estructura del Excel

### Formato Esperado

El archivo Excel debe seguir esta estructura:

| Columna | Nombre | Descripción | Ejemplo |
|---------|--------|-------------|---------|
| A (0) | REFERENCIA | Código único del producto | `7501206635186` |
| B (1) | PRODUCTO | Nombre del producto | `SILICON TRANSPARENTE ABRO` |
| C (2) | EXISTENCIAS | Stock actual (puede ser negativo) | `2,00` o `-5,00` |
| D (3) | COSTO | Precio de compra | `100,00` |
| E (4) | PRECIO I | Precio de venta principal | `140,00` |
| F (5) | PRECIO II | Precio mayorista (opcional) | `0,00` |
| G (6) | PRECIO III | Precio oferta (opcional) | `0,00` |
| H (7) | PRECIO IV | Precio adicional (opcional) | `0,00` |

### Encabezados del Archivo

- **Filas 1-15**: Encabezado institucional (ignoradas)
- **Fila 16**: Encabezados de columnas
- **Fila 17+**: Datos de productos

### Ejemplo de Fila

```
790920049967 | SILICON TRANSPARENTE ABRO | 2,00 | 100,00 | 140,00 | 0,00 | 0,00 | 0,00
```

---

## 🔄 Pipeline de Procesamiento

### 1. Lectura del Excel

```javascript
const workbook = XLSX.read(buffer, { type: "buffer" });
const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
```

### 2. Extracción de Datos

- Ignora filas 1-16 (encabezados)
- Extrae solo filas con datos (fila 17+)
- Filtra filas completamente vacías

### 3. Normalización

Cada fila pasa por:

```javascript
normalizarFila(row) → {
  codigo: "790920049967",
  nombre: "SILICON TRANSPARENTE ABRO",
  existencia: 2.00,
  costo: 100.00,
  precio1: 140.00,
  // ...
}
```

### 4. Validación

```javascript
validarFila(fila) → null | "Error: ..."
```

### 5. Procesamiento

- Buscar producto existente por código
- Crear nuevo o actualizar existente
- Registrar movimiento de inventario

### 6. Inserción en BD

- Transacción MySQL
- Rollback si hay >50% de errores
- Commit si todo está bien

---

## 🧼 Limpieza y Normalización de Datos

### Funciones de Limpieza

#### `limpiarTexto(valor)`

**Problemas que resuelve:**
- Espacios múltiples
- Saltos de línea
- Mayúsculas inconsistentes

**Ejemplo:**
```javascript
"  Silicon  Transparente  " → "SILICON TRANSPARENTE"
```

#### `limpiarNumero(valor)`

**Problemas que resuelve:**
- Símbolos de moneda (`RD$`, `$`)
- Separadores de miles (`,`)
- Espacios

**Ejemplo:**
```javascript
"RD$ 1,250.50" → 1250.50
"  450 " → 450
```

#### `limpiarCodigo(valor)`

**Problemas que resuelve:**
- Caracteres especiales
- Espacios
- Minúsculas

**Ejemplo:**
```javascript
" prod-001 " → "PROD001"
```

### Pipeline de Limpieza

```
Valor crudo del Excel
    ↓
limpiarTexto() / limpiarNumero() / limpiarCodigo()
    ↓
Valor normalizado
    ↓
Validación
    ↓
Inserción BD
```

---

## ✅ Validación de Datos

### Reglas de Validación

| Campo | Validación | Mensaje de Error |
|-------|------------|------------------|
| `codigo` | No vacío | "Código de producto vacío" |
| `nombre` | No vacío | "Nombre de producto vacío" |
| `costo` | ≥ 0 | "Costo no puede ser negativo" |
| `precio1` | > 0 | "Precio I debe ser mayor a cero" |
| `precio1` | ≥ `costo` | "Precio I es menor que el costo" |

### Separación de Válidas e Inválidas

```javascript
const { validas, errores } = validarFilas(filasNormalizadas);
```

**Resultado:**
- `validas`: Array de filas que pasaron validación
- `errores`: Array de objetos con `{ fila, codigo, nombre, error }`

---

## 📐 Reglas de Negocio

### 1. Existencia Negativa = Venta Sin Asistencia

**Regla:**
- Si `existencia < 0` → Tipo de movimiento: `"salida"`
- **NO afecta el stock físico** del producto
- Se registra en `movimientos_inventario` para auditoría

**Implementación:**
```javascript
if (existencia < 0) {
    tipo = "salida";
    // Stock NO cambia
}
```

### 2. Existencia Positiva = Ingreso

**Regla:**
- Si `existencia > 0` → Tipo de movimiento: `"entrada"`
- **SÍ afecta el stock físico**
- Incrementa el stock del producto

**Implementación:**
```javascript
if (existencia > 0) {
    tipo = "entrada";
    stockNuevo = stockAnterior + existencia;
}
```

### 3. Productos Existentes

**Regla:**
- Si el código ya existe → **Actualizar** producto
- Si el código no existe → **Crear** nuevo producto

**Búsqueda:**
```sql
SELECT * FROM productos 
WHERE empresa_id = ? 
AND (codigo_barras = ? OR sku = ?)
```

### 4. Mapeo de Precios

| Precio Excel | Campo BD | Descripción |
|--------------|----------|-------------|
| PRECIO I | `precio_venta` | Precio principal |
| PRECIO II | `precio_mayorista` | Precio mayorista |
| PRECIO III | `precio_oferta` | Precio oferta |
| PRECIO IV | - | No se usa |

---

## ⚠️ Manejo de Errores

### Niveles de Error

1. **Validación de Archivo**
   - Tipo incorrecto → Error 400
   - Tamaño excedido → Error 400

2. **Validación de Filas**
   - Errores por fila → Se reportan individualmente
   - No bloquea la importación completa

3. **Procesamiento**
   - Error al crear/actualizar producto → Se registra en errores
   - Error en transacción → Rollback completo

### Política de Rollback

**Rollback automático si:**
- Tasa de error > 50% del total
- Error crítico en transacción

**Commit si:**
- Tasa de error ≤ 50%
- Al menos una fila válida procesada

### Reporte de Errores

```javascript
{
  success: false,
  mensaje: "Demasiados errores...",
  estadisticas: {
    total: 100,
    procesados: 45,
    errores: 55
  },
  errores: [
    { fila: 17, codigo: "ABC123", nombre: "Producto X", error: "..." }
  ]
}
```

---

## 🔌 API Endpoints

### POST `/api/productos/importar`

**Autenticación:** Requerida (cookie `userId`, `empresaId`)

**Permisos:** Solo `admin`

**Request:**
```javascript
FormData {
  file: File (Excel .xlsx o .xls)
}
```

**Response (Éxito):**
```json
{
  "success": true,
  "mensaje": "Importación completada: 50 productos procesados...",
  "estadisticas": {
    "total": 50,
    "procesados": 48,
    "creados": 30,
    "actualizados": 18,
    "errores": 2
  },
  "errores": null
}
```

**Response (Error):**
```json
{
  "success": false,
  "mensaje": "Error al procesar el archivo...",
  "estadisticas": { ... },
  "errores": [ ... ]
}
```

---

## 🎨 Componentes UI

### `ImportarProductos`

**Ubicación:** `_Pages/admin/productos/ImportarProductos.js`

**Props:**
- `onImportarCompleto`: Callback cuando la importación termina

**Funcionalidades:**
- Modal de importación
- Selección de archivo
- Preview de archivo seleccionado
- Progreso de importación
- Estadísticas de resultado
- Lista de errores (expandible)

**Estados:**
- `mostrarModal`: Controla visibilidad del modal
- `archivo`: Archivo seleccionado
- `procesando`: Estado de carga
- `resultado`: Resultado de la importación
- `mostrarErrores`: Controla visibilidad de errores

---

## 📊 Estadísticas de Importación

### Campos Reportados

| Campo | Descripción |
|-------|-------------|
| `total` | Total de filas en el Excel |
| `procesados` | Filas procesadas exitosamente |
| `creados` | Productos nuevos creados |
| `actualizados` | Productos existentes actualizados |
| `errores` | Cantidad de errores encontrados |

---

## 🔒 Seguridad

### Validaciones de Seguridad

1. **Autenticación**
   - Verifica `userId` y `empresaId` en cookies
   - Solo usuarios `admin` pueden importar

2. **Validación de Archivo**
   - Tipo: Solo `.xlsx` y `.xls`
   - Tamaño: Máximo 10MB

3. **SQL Injection**
   - Uso de prepared statements
   - Parámetros escapados automáticamente

4. **Aislamiento de Datos**
   - Solo productos de la empresa del usuario
   - Transacciones aisladas

---

## 🧪 Casos de Prueba

### Caso 1: Importación Exitosa
- ✅ Archivo válido
- ✅ Todas las filas válidas
- ✅ Productos nuevos creados
- ✅ Movimientos registrados

### Caso 2: Productos Existentes
- ✅ Código existe → Actualiza
- ✅ Precios actualizados
- ✅ Stock ajustado

### Caso 3: Existencia Negativa
- ✅ Tipo: `salida`
- ✅ Stock NO cambia
- ✅ Movimiento registrado

### Caso 4: Errores de Validación
- ✅ Filas inválidas reportadas
- ✅ Filas válidas procesadas
- ✅ Importación parcial exitosa

### Caso 5: Rollback por Muchos Errores
- ✅ >50% errores → Rollback
- ✅ Ningún cambio en BD
- ✅ Errores reportados

---

## 📝 Notas Técnicas

### Decimales en Stock

El campo `stock` es `DECIMAL(13,3)` en MySQL:
- Permite hasta 9,999,999,999.999
- Maneja decimales (libras, pies, yardas)
- MySQL maneja automáticamente el formato

### Transacciones

```javascript
await connection.beginTransaction();
// ... procesamiento ...
await connection.commit(); // o rollback()
```

### Performance

- **Batch processing**: Procesa filas una por una
- **Transacción única**: Todo o nada
- **Índices**: Búsqueda rápida por código

---

## 🚀 Mejoras Futuras

- [ ] Importación incremental (solo cambios)
- [ ] Preview antes de importar
- [ ] Plantilla Excel descargable
- [ ] Importación asíncrona (background jobs)
- [ ] Logs detallados por importación
- [ ] Reversión de importaciones

---

## 📞 Soporte

Para problemas o preguntas sobre la importación, consultar:
- Este documento
- Código fuente comentado
- Logs del servidor

---

**Última actualización:** 2026-01-21  
**Versión:** 1.0.0

