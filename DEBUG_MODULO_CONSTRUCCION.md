# Debug: Módulo de Construcción - Columnas Faltantes en Producción

## Problema

El módulo de construcción funciona en local pero falla en producción con errores SQL:
- `Unknown column 'o.empresa_id' in 'WHERE'`
- `Unknown column 'o.codigo_obra' in 'SELECT'`

## Causa Raíz

La tabla `obras` en producción existe pero **no tiene las columnas** `empresa_id` y `codigo_obra` que el código espera. Esto ocurre porque:

1. La migración `migracion_constructora.sql` usa `CREATE TABLE IF NOT EXISTS`
2. Si la tabla `obras` ya existía sin esas columnas, la migración no las agrega
3. El script de deploy ejecuta migraciones, pero solo crea tablas nuevas, no modifica existentes

## Hipótesis Generadas

### Hipótesis A: Columnas faltantes en tabla obras (CONFIRMADA por logs)
**Evidencia**: Los logs muestran `Unknown column 'o.empresa_id'` y `Unknown column 'o.codigo_obra'`
**Solución**: Ejecutar migración que agrega las columnas si no existen

## Solución Implementada

### 1. Endpoint de Diagnóstico
**Ruta**: `/api/debug/schema?table=obras`

Verifica el esquema de la tabla y muestra qué columnas faltan:
```bash
curl https://isiweek.com/api/debug/schema?table=obras
```

### 2. Migración para Agregar Columnas
**Archivo**: `_DB/migracion_agregar_columnas_obras.sql`

Esta migración:
- Agrega `empresa_id` si no existe
- Agrega `codigo_obra` si no existe
- Crea índices necesarios
- Genera códigos para obras existentes sin código

### 3. Instrumentación de Logging
Se agregó logging en:
- `_Pages/admin/constructora/servidor.js`
- `_Pages/admin/servicios/servidor.js`
- `_Pages/admin/obras/listar/servidor.js`

Los logs capturan errores SQL con detalles completos.

## Pasos para Resolver

### Paso 1: Verificar el Problema

Conectarse al servidor y verificar el esquema:

```bash
# Opción 1: Usar el endpoint de diagnóstico
curl https://isiweek.com/api/debug/schema?table=obras

# Opción 2: Verificar directamente en MySQL
mysql -u DB_USER -p DB_NAME -e "DESCRIBE obras;" | grep -E "empresa_id|codigo_obra"
```

### Paso 2: Ejecutar la Migración

**Opción A: Ejecutar manualmente (RECOMENDADO para producción)**

```bash
# Conectarse al servidor
ssh deploy@isiweek.com

# Ir al directorio del proyecto
cd /var/www/punto_de_venta_2025/current

# Ejecutar la migración
mysql -u DB_USER -p DB_NAME < _DB/migracion_agregar_columnas_obras.sql
```

**Opción B: Ejecutar en el próximo deploy**

La migración se ejecutará automáticamente en el próximo deploy porque:
1. El script `deploy.sh` ejecuta todas las migraciones en `_DB/*.sql`
2. Verifica si ya se ejecutó usando la tabla `migrations`
3. Solo ejecuta migraciones nuevas

### Paso 3: Verificar que Funcionó

```bash
# Verificar columnas agregadas
mysql -u DB_USER -p DB_NAME -e "DESCRIBE obras;" | grep -E "empresa_id|codigo_obra"

# Debería mostrar:
# empresa_id    int(11)      NO
# codigo_obra    varchar(50)   NO
```

### Paso 4: Actualizar Datos Existentes (si es necesario)

Si hay obras existentes sin `empresa_id` o `codigo_obra`, la migración:
- Asigna `empresa_id = 1` por defecto (ajustar según necesidad)
- Genera códigos automáticos como `OBR-000001`, `OBR-000002`, etc.

**IMPORTANTE**: Si necesitas asignar `empresa_id` correcto a obras existentes:

```sql
-- Ver obras sin empresa_id asignado
SELECT id, nombre, empresa_id FROM obras WHERE empresa_id = 1;

-- Actualizar empresa_id según necesidad
UPDATE obras SET empresa_id = 2 WHERE id IN (1, 2, 3);
```

### Paso 5: Reiniciar la Aplicación

```bash
pm2 reload punto-venta-2025
```

### Paso 6: Verificar que Funciona

1. Acceder al módulo de construcción en producción
2. Verificar que no aparecen errores en los logs:
   ```bash
   pm2 logs punto-venta-2025 --lines 50
   ```
3. Verificar que el dashboard carga correctamente

## Análisis de Logs

Después de ejecutar los pasos, revisar logs en:
- `c:\Users\unsaa\WebstormProjects\punto_de_venta_rd\.cursor\debug.log` (desarrollo local)
- `pm2 logs punto-venta-2025` (producción)

Buscar entradas con:
- `hypothesisId: 'A'` → Queries a tabla obras
- `hypothesisId: 'B'` → Queries a servicios

## Notas Importantes

1. **Backup**: Antes de ejecutar la migración en producción, hacer backup:
   ```bash
   mysqldump -u DB_USER -p DB_NAME obras > backup_obras_$(date +%Y%m%d).sql
   ```

2. **Valores por Defecto**: La migración asigna valores por defecto:
   - `empresa_id = 1` (ajustar según necesidad)
   - `codigo_obra = 'OBR-XXXXXX'` (generado automáticamente)

3. **Índices**: La migración crea índices necesarios para optimizar queries

4. **Compatibilidad**: La migración es idempotente - se puede ejecutar múltiples veces sin problemas

## Prevención Futura

Para evitar este problema en el futuro:

1. **Migraciones Incrementales**: Usar migraciones que modifiquen tablas existentes, no solo creen nuevas
2. **Verificación de Esquema**: Agregar checks en el código que verifiquen columnas requeridas
3. **Tests de Migración**: Probar migraciones en ambiente de staging antes de producción

## Archivos Modificados

- ✅ `app/api/debug/schema/route.js` - Endpoint de diagnóstico
- ✅ `_DB/migracion_agregar_columnas_obras.sql` - Migración para agregar columnas
- ✅ `_Pages/admin/constructora/servidor.js` - Logging agregado
- ✅ `_Pages/admin/servicios/servidor.js` - Logging agregado
- ✅ `_Pages/admin/obras/listar/servidor.js` - Logging agregado

