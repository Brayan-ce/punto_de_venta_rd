# Solución: Columnas Faltantes en Tabla Obras

## Problema

La tabla `obras` en producción tiene una estructura básica y le faltan muchas columnas que el código espera:
- ✅ `empresa_id` - Ya agregada
- ✅ `codigo_obra` - Ya agregada  
- ❌ `proyecto_id` - **FALTA** (causa el error actual)
- ❌ Otras columnas pueden faltar también

## Solución: Migración Completa

He creado `_DB/migracion_completa_columnas_obras.sql` que agrega **TODAS** las columnas necesarias de forma segura (solo agrega si no existen).

## Pasos para Resolver

### Paso 1: Verificar columnas actuales

```bash
mysql -u brayan -p punto_venta_rd -e "DESCRIBE obras;"
```

### Paso 2: Ejecutar migración completa

```bash
cd /var/www/punto_de_venta_2025/current
mysql -u brayan -p punto_venta_rd < _DB/migracion_completa_columnas_obras.sql
```

### Paso 3: Verificar que todas las columnas fueron agregadas

```bash
mysql -u brayan -p punto_venta_rd -e "DESCRIBE obras;" | grep -E "proyecto_id|cliente_id|estado|fecha"
```

### Paso 4: Reiniciar aplicación

```bash
pm2 restart punto-venta-2025
```

### Paso 5: Verificar logs

```bash
pm2 logs punto-venta-2025 --lines 30 --err
```

## Columnas que se Agregarán

La migración agrega estas columnas si no existen:

**Relaciones:**
- `proyecto_id` - Proyecto asociado
- `cliente_id` - Cliente asociado
- `usuario_responsable_id` - Usuario responsable

**Datos básicos:**
- `nombre` - Nombre de la obra
- `descripcion` - Descripción
- `tipo_obra` - Tipo (construcción, remodelación, etc.)
- `codigo_obra` - Código único

**Ubicación:**
- `ubicacion` - Dirección
- `zona`, `municipio`, `provincia` - Ubicación geográfica
- `coordenadas_gps` - Coordenadas GPS

**Presupuesto:**
- `presupuesto_aprobado` - Presupuesto aprobado
- `costo_mano_obra`, `costo_materiales`, `costo_servicios`, etc.
- `costo_total`, `costo_ejecutado`

**Fechas:**
- `fecha_inicio` - Fecha de inicio
- `fecha_fin_estimada` - Fecha fin estimada
- `fecha_fin_real` - Fecha fin real

**Estado:**
- `estado` - Estado de la obra
- `porcentaje_avance` - Porcentaje de avance

**Configuración:**
- `max_trabajadores` - Máximo de trabajadores
- `requiere_bitacora_diaria` - Requiere bitácora

**Auditoría:**
- `creado_por` - Usuario que creó
- `fecha_creacion` - Fecha de creación
- `fecha_actualizacion` - Fecha de actualización

## Nota Importante

Esta migración es **idempotente** - puedes ejecutarla múltiples veces sin problemas. Solo agrega columnas que no existen.

