# Fix: Columna creado_por faltante en tabla obras

## Problema

El error muestra que la columna `creado_por` no existe en la tabla `obras`:
```
Unknown column 'creado_por' in 'INSERT INTO'
```

## Solución Rápida

Ejecuta este comando en el servidor:

```bash
cd /var/www/punto_de_venta_2025/current
mysql -u brayan -p punto_venta_rd < _DB/fix_creado_por_obras.sql
```

O ejecuta directamente en MySQL:

```sql
USE punto_venta_rd;

-- Verificar si existe
SELECT COLUMN_NAME 
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
AND TABLE_NAME = 'obras'
AND COLUMN_NAME = 'creado_por';

-- Si no existe, agregarla
ALTER TABLE obras 
ADD COLUMN creado_por INT(11) NOT NULL DEFAULT 1 
COMMENT 'Usuario que creó la obra' 
AFTER requiere_bitacora_diaria;

-- Verificar que se agregó
DESCRIBE obras;
```

## Verificación

Después de ejecutar, verifica:

```bash
mysql -u brayan -p punto_venta_rd -e "DESCRIBE obras;" | grep creado_por
```

Debería mostrar:
```
creado_por | int(11) | NO | | 1 | Usuario que creó la obra
```

## Reiniciar Aplicación

```bash
pm2 restart punto-venta-2025
```

## Nota

Si la columna `requiere_bitacora_diaria` no existe, usa esta versión alternativa:

```sql
ALTER TABLE obras 
ADD COLUMN creado_por INT(11) NOT NULL DEFAULT 1 
COMMENT 'Usuario que creó la obra';
```

