-- ===============================================================================
-- MIGRACIÓN: Convertir bitácora a diseño polimórfico
-- ===============================================================================
-- Esta migración actualiza las tablas de bitácora para soportar obras y servicios
-- Fecha: 2026-01-28
-- Versión: 1.1 (Corregida para MySQL)
-- ===============================================================================

-- -----------------------------------------------
-- 1. BACKUP DE DATOS EXISTENTES (si existen)
-- -----------------------------------------------

-- Crear tabla temporal de respaldo
DROP TABLE IF EXISTS bitacora_diaria_backup;
CREATE TABLE bitacora_diaria_backup AS
SELECT * FROM bitacora_diaria;

SELECT 'Backup creado exitosamente' as mensaje;

-- -----------------------------------------------
-- 2. MODIFICAR TABLA bitacora_diaria
-- -----------------------------------------------

-- Agregar tipo_destino (solo si no existe)
SET @column_exists = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'bitacora_diaria' 
      AND COLUMN_NAME = 'tipo_destino'
);

SET @sql = IF(@column_exists = 0,
    'ALTER TABLE bitacora_diaria ADD COLUMN tipo_destino ENUM(''obra'', ''servicio'') NOT NULL DEFAULT ''obra'' AFTER empresa_id',
    'SELECT ''Campo tipo_destino ya existe'' as mensaje'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Agregar destino_id (solo si no existe)
SET @column_exists = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'bitacora_diaria' 
      AND COLUMN_NAME = 'destino_id'
);

SET @sql = IF(@column_exists = 0,
    'ALTER TABLE bitacora_diaria ADD COLUMN destino_id INT(11) NOT NULL DEFAULT 0 AFTER tipo_destino',
    'SELECT ''Campo destino_id ya existe'' as mensaje'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Migrar datos existentes (obra_id → destino_id)
-- Solo si el campo obra_id existe
SET @column_exists = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'bitacora_diaria' 
      AND COLUMN_NAME = 'obra_id'
);

SET @sql = IF(@column_exists > 0,
    'UPDATE bitacora_diaria SET destino_id = obra_id, tipo_destino = ''obra'' WHERE destino_id = 0 AND obra_id IS NOT NULL',
    'SELECT ''Campo obra_id no existe, migración no necesaria'' as mensaje'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SELECT 'Datos migrados exitosamente' as mensaje;

-- Renombrar campo zona a zona_sitio (si existe)
SET @column_exists = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'bitacora_diaria' 
      AND COLUMN_NAME = 'zona'
);

SET @sql = IF(@column_exists > 0,
    'ALTER TABLE bitacora_diaria CHANGE COLUMN zona zona_sitio VARCHAR(100)',
    'SELECT ''Campo zona no existe o ya fue migrado'' as mensaje'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Renombrar campo clima a condiciones_clima (si existe)
SET @column_exists = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'bitacora_diaria' 
      AND COLUMN_NAME = 'clima'
);

SET @sql = IF(@column_exists > 0,
    'ALTER TABLE bitacora_diaria CHANGE COLUMN clima condiciones_clima VARCHAR(100)',
    'SELECT ''Campo clima no existe o ya fue migrado'' as mensaje'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Renombrar campo registrado_por a usuario_id (si existe)
SET @column_exists = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'bitacora_diaria' 
      AND COLUMN_NAME = 'registrado_por'
);

SET @sql = IF(@column_exists > 0,
    'ALTER TABLE bitacora_diaria CHANGE COLUMN registrado_por usuario_id INT(11) NOT NULL',
    'SELECT ''Campo registrado_por no existe o ya fue migrado'' as mensaje'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SELECT 'Campos renombrados exitosamente' as mensaje;

-- -----------------------------------------------
-- 3. AGREGAR ÍNDICES POLIMÓRFICOS
-- -----------------------------------------------

-- Índice compuesto para búsquedas por destino
SET @index_exists = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.STATISTICS 
    WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'bitacora_diaria' 
      AND INDEX_NAME = 'idx_destino'
);

SET @sql = IF(@index_exists = 0,
    'CREATE INDEX idx_destino ON bitacora_diaria(tipo_destino, destino_id)',
    'SELECT ''Índice idx_destino ya existe'' as mensaje'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Índice para búsquedas por empresa y tipo
SET @index_exists = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.STATISTICS 
    WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'bitacora_diaria' 
      AND INDEX_NAME = 'idx_empresa_tipo'
);

SET @sql = IF(@index_exists = 0,
    'CREATE INDEX idx_empresa_tipo ON bitacora_diaria(empresa_id, tipo_destino)',
    'SELECT ''Índice idx_empresa_tipo ya existe'' as mensaje'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Índice para búsquedas por fecha
SET @index_exists = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.STATISTICS 
    WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'bitacora_diaria' 
      AND INDEX_NAME = 'idx_fecha_bitacora'
);

SET @sql = IF(@index_exists = 0,
    'CREATE INDEX idx_fecha_bitacora ON bitacora_diaria(fecha_bitacora)',
    'SELECT ''Índice idx_fecha_bitacora ya existe'' as mensaje'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SELECT 'Índices creados exitosamente' as mensaje;

-- -----------------------------------------------
-- 4. CONSTRAINT DE UNICIDAD POLIMÓRFICA
-- -----------------------------------------------

-- Eliminar constraint antigua si existe
SET @constraint_exists = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.STATISTICS 
    WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'bitacora_diaria' 
      AND INDEX_NAME = 'uk_destino_fecha'
);

SET @sql = IF(@constraint_exists > 0,
    'ALTER TABLE bitacora_diaria DROP INDEX uk_destino_fecha',
    'SELECT ''Constraint uk_destino_fecha no existe'' as mensaje'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Agregar constraint de unicidad polimórfica
SET @constraint_exists = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.STATISTICS 
    WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'bitacora_diaria' 
      AND INDEX_NAME = 'uk_destino_fecha'
);

SET @sql = IF(@constraint_exists = 0,
    'ALTER TABLE bitacora_diaria ADD CONSTRAINT uk_destino_fecha UNIQUE (tipo_destino, destino_id, fecha_bitacora)',
    'SELECT ''Constraint uk_destino_fecha ya existe'' as mensaje'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SELECT 'Constraint de unicidad creado exitosamente' as mensaje;

-- -----------------------------------------------
-- 5. VERIFICAR TABLA bitacora_trabajadores
-- -----------------------------------------------

CREATE TABLE IF NOT EXISTS bitacora_trabajadores (
    id INT(11) NOT NULL AUTO_INCREMENT,
    bitacora_id INT(11) NOT NULL,
    trabajador_id INT(11) NOT NULL,
    
    -- Control de presencia
    presente TINYINT(1) DEFAULT 1,
    observaciones VARCHAR(255),
    
    PRIMARY KEY (id),
    UNIQUE KEY uk_bitacora_trabajador (bitacora_id, trabajador_id),
    KEY idx_bitacora (bitacora_id),
    KEY idx_trabajador (trabajador_id),
    
    FOREIGN KEY (bitacora_id) REFERENCES bitacora_diaria(id) ON DELETE CASCADE,
    FOREIGN KEY (trabajador_id) REFERENCES trabajadores_obra(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SELECT 'Tabla bitacora_trabajadores verificada' as mensaje;

-- -----------------------------------------------
-- 6. VERIFICAR TABLA bitacora_fotos
-- -----------------------------------------------

CREATE TABLE IF NOT EXISTS bitacora_fotos (
    id INT(11) NOT NULL AUTO_INCREMENT,
    bitacora_id INT(11) NOT NULL,
    
    -- Archivo
    nombre_archivo VARCHAR(255) NOT NULL,
    url_foto VARCHAR(500) NOT NULL,
    tipo_mime VARCHAR(50),
    tamano_bytes INT(11),
    
    -- Metadata
    descripcion VARCHAR(255),
    orden INT(11) DEFAULT 0,
    
    -- Auditoría
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    PRIMARY KEY (id),
    KEY idx_bitacora (bitacora_id),
    
    FOREIGN KEY (bitacora_id) REFERENCES bitacora_diaria(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SELECT 'Tabla bitacora_fotos verificada' as mensaje;

-- -----------------------------------------------
-- 7. VERIFICAR ESTRUCTURA FINAL
-- -----------------------------------------------

SELECT '========================================' as '';
SELECT 'VERIFICACIÓN DE ESTRUCTURA' as '';
SELECT '========================================' as '';

-- Mostrar estructura de bitacora_diaria
DESCRIBE bitacora_diaria;

SELECT '========================================' as '';
SELECT 'ÍNDICES DE bitacora_diaria' as '';
SELECT '========================================' as '';

-- Mostrar índices
SHOW INDEX FROM bitacora_diaria;

-- -----------------------------------------------
-- 8. SCRIPTS DE VERIFICACIÓN
-- -----------------------------------------------

SELECT '========================================' as '';
SELECT 'VERIFICACIÓN DE DATOS' as '';
SELECT '========================================' as '';

-- Verificar migración de datos
SELECT 
    COUNT(*) as total_bitacoras,
    COUNT(CASE WHEN tipo_destino = 'obra' THEN 1 END) as bitacoras_obras,
    COUNT(CASE WHEN tipo_destino = 'servicio' THEN 1 END) as bitacoras_servicios
FROM bitacora_diaria;

-- Verificar bitácoras sin destino_id (deben ser 0 después de migrar)
SELECT COUNT(*) as bitacoras_sin_destino
FROM bitacora_diaria
WHERE destino_id = 0;

-- Verificar integridad referencial con obras
SELECT 
    COUNT(DISTINCT b.id) as bitacoras_obras,
    COUNT(DISTINCT o.id) as obras_encontradas
FROM bitacora_diaria b
LEFT JOIN obras o ON b.tipo_destino = 'obra' AND b.destino_id = o.id
WHERE b.tipo_destino = 'obra';

SELECT '========================================' as '';
SELECT 'MIGRACIÓN COMPLETADA EXITOSAMENTE' as '';
SELECT '========================================' as '';

-- ===============================================================================
-- NOTAS IMPORTANTES
-- ===============================================================================

/*
DESPUÉS DE EJECUTAR ESTA MIGRACIÓN:

1. ✅ Verificar que todos los datos se migraron correctamente
   - Ejecutar: SELECT * FROM bitacora_diaria LIMIT 10;
   - Verificar que tipo_destino y destino_id tienen valores

2. ✅ Probar creación de bitácoras para obras
   - Desde la UI: /admin/bitacora/nuevo

3. ✅ Probar creación de bitácoras para servicios
   - Desde la UI: /admin/bitacora/nuevo

4. ✅ Verificar constraint de unicidad
   - Intentar crear bitácora duplicada (debe fallar)

5. ⚠️  Eliminar campo obra_id SOLO después de verificar que todo funciona
   - Comando: ALTER TABLE bitacora_diaria DROP COLUMN obra_id;
   - ⚠️ SOLO ejecutar cuando estés 100% seguro

6. ⚠️  Eliminar tabla de backup después de confirmar éxito (1 semana después)
   - Comando: DROP TABLE bitacora_diaria_backup;

ROLLBACK (si algo sale mal):
-----------------------------
DROP TABLE bitacora_diaria;
RENAME TABLE bitacora_diaria_backup TO bitacora_diaria;

VERIFICACIÓN RÁPIDA:
--------------------
-- Ver estructura actual
DESCRIBE bitacora_diaria;

-- Ver bitácoras migradas
SELECT id, tipo_destino, destino_id, fecha_bitacora, zona_sitio 
FROM bitacora_diaria 
ORDER BY id DESC 
LIMIT 5;
*/

-- ===============================================================================
-- FIN DE LA MIGRACIÓN
-- ===============================================================================
