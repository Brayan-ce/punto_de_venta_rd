-- Migración: Planes de Financiamiento con Múltiples Plazos
-- Fecha: 2025-02-03
-- Descripción: Crea tabla planes_plazos y modifica contratos_financiamiento para soportar múltiples opciones de plazo por plan

-- ============================================
-- 1. Crear tabla planes_plazos
-- ============================================
CREATE TABLE IF NOT EXISTS planes_plazos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    plan_id INT NOT NULL,
    plazo_meses INT NOT NULL,
    
    -- Pago inicial: tipo claro sin ambigüedad
    tipo_pago_inicial ENUM('MONTO', 'PORCENTAJE') NOT NULL DEFAULT 'PORCENTAJE',
    pago_inicial_valor DECIMAL(12,2) NOT NULL,
    
    -- Cuota mensual: fuente de verdad (nullable para planes legacy que se migran)
    cuota_mensual DECIMAL(12,2) NULL,
    
    -- Tasas: marcadas como calculadas (datos derivados/históricos)
    tasa_anual_calculada DECIMAL(5,2) NOT NULL,
    tasa_mensual_calculada DECIMAL(5,4) NOT NULL,
    
    -- Configuración UX
    es_sugerido TINYINT(1) DEFAULT 0 COMMENT 'Plazo recomendado para mostrar primero',
    activo TINYINT(1) DEFAULT 1,
    orden INT DEFAULT 0 COMMENT 'Orden de visualización',
    
    -- Auditoría
    creado_por INT NOT NULL,
    modificado_por INT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (plan_id) REFERENCES planes_financiamiento(id) ON DELETE CASCADE,
    FOREIGN KEY (creado_por) REFERENCES usuarios(id),
    FOREIGN KEY (modificado_por) REFERENCES usuarios(id) ON DELETE SET NULL,
    
    UNIQUE KEY uk_plan_plazo (plan_id, plazo_meses),
    INDEX idx_plan_activo (plan_id, activo),
    INDEX idx_plan_orden (plan_id, orden),
    INDEX idx_plazo (plazo_meses),
    INDEX idx_sugerido (es_sugerido)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Opciones de plazo para cada plan de financiamiento';

-- Si la tabla ya existe, modificar cuota_mensual para permitir NULL (para planes legacy)
SET @table_exists = (
    SELECT COUNT(*) 
    FROM information_schema.TABLES 
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'planes_plazos'
);

SET @col_cuota_not_null = (
    SELECT COUNT(*) 
    FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'planes_plazos'
    AND COLUMN_NAME = 'cuota_mensual'
    AND IS_NULLABLE = 'NO'
);

SET @sql_modify_cuota = IF(@table_exists > 0 AND @col_cuota_not_null > 0,
    'ALTER TABLE planes_plazos MODIFY COLUMN cuota_mensual DECIMAL(12,2) NULL',
    'SELECT "Column cuota_mensual already allows NULL or table does not exist" AS message'
);

PREPARE stmt_modify_cuota FROM @sql_modify_cuota;
EXECUTE stmt_modify_cuota;
DEALLOCATE PREPARE stmt_modify_cuota;

-- ============================================
-- 2. Modificar tabla contratos_financiamiento
-- ============================================
-- Agregar campo plazo_id para referenciar el plazo específico usado
-- Verificar si la columna ya existe antes de agregarla
SET @col_exists = (
    SELECT COUNT(*) 
    FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'contratos_financiamiento'
    AND COLUMN_NAME = 'plazo_id'
);

SET @sql_col = IF(@col_exists = 0,
    'ALTER TABLE contratos_financiamiento ADD COLUMN plazo_id INT NULL AFTER plan_id',
    'SELECT "Column plazo_id already exists" AS message'
);

PREPARE stmt_col FROM @sql_col;
EXECUTE stmt_col;
DEALLOCATE PREPARE stmt_col;

-- Agregar índice si no existe
SET @idx_exists = (
    SELECT COUNT(*) 
    FROM information_schema.STATISTICS 
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'contratos_financiamiento'
    AND INDEX_NAME = 'idx_plazo'
);

SET @sql_idx = IF(@idx_exists = 0,
    'ALTER TABLE contratos_financiamiento ADD INDEX idx_plazo (plazo_id)',
    'SELECT "Index idx_plazo already exists" AS message'
);

PREPARE stmt_idx FROM @sql_idx;
EXECUTE stmt_idx;
DEALLOCATE PREPARE stmt_idx;

-- Agregar foreign key si no existe
-- Nota: MySQL no soporta IF NOT EXISTS para foreign keys, así que verificamos primero
SET @fk_exists = (
    SELECT COUNT(*) 
    FROM information_schema.TABLE_CONSTRAINTS 
    WHERE CONSTRAINT_SCHEMA = DATABASE()
    AND TABLE_NAME = 'contratos_financiamiento'
    AND CONSTRAINT_NAME = 'fk_contrato_plazo'
    AND CONSTRAINT_TYPE = 'FOREIGN KEY'
);

SET @sql = IF(@fk_exists = 0,
    'ALTER TABLE contratos_financiamiento ADD CONSTRAINT fk_contrato_plazo FOREIGN KEY (plazo_id) REFERENCES planes_plazos(id) ON DELETE SET NULL',
    'SELECT "Foreign key fk_contrato_plazo already exists" AS message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================
-- 3. Migrar planes existentes a planes_plazos
-- ============================================
-- Migrar planes existentes que tienen plazo_meses configurado
INSERT INTO planes_plazos (
    plan_id, 
    plazo_meses, 
    tipo_pago_inicial, 
    pago_inicial_valor,
    cuota_mensual, 
    tasa_anual_calculada, 
    tasa_mensual_calculada,
    es_sugerido, 
    activo, 
    orden, 
    creado_por
)
SELECT 
    id as plan_id,
    plazo_meses,
    'PORCENTAJE' as tipo_pago_inicial,
    COALESCE(pago_inicial_minimo_pct, 15.00) as pago_inicial_valor,
    -- Nota: cuota_mensual será NULL para planes existentes
    -- Se debe calcular manualmente después o usar el flujo inverso
    NULL as cuota_mensual,
    tasa_interes_anual as tasa_anual_calculada,
    COALESCE(tasa_interes_mensual, tasa_interes_anual / 12 / 100) as tasa_mensual_calculada,
    1 as es_sugerido, -- Marcar como sugerido el único plazo
    1 as activo,
    0 as orden,
    creado_por
FROM planes_financiamiento
WHERE plazo_meses IS NOT NULL
  AND tasa_interes_anual IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM planes_plazos pp WHERE pp.plan_id = planes_financiamiento.id
  );

-- ============================================
-- 4. Modificar tabla planes_financiamiento para hacer campos legacy opcionales
-- ============================================
-- Hacer los campos legacy NULL para permitir planes sin plazos directos
-- (los plazos ahora se almacenan en planes_plazos)

-- Modificar plazo_meses para permitir NULL
SET @col_plazo_exists = (
    SELECT COUNT(*) 
    FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'planes_financiamiento'
    AND COLUMN_NAME = 'plazo_meses'
);

SET @sql_modify_plazo = IF(@col_plazo_exists > 0,
    'ALTER TABLE planes_financiamiento MODIFY COLUMN plazo_meses INT NULL COMMENT ''Deprecated: usar planes_plazos''',
    'SELECT "Column plazo_meses does not exist" AS message'
);

PREPARE stmt_modify_plazo FROM @sql_modify_plazo;
EXECUTE stmt_modify_plazo;
DEALLOCATE PREPARE stmt_modify_plazo;

-- Modificar tasa_interes_anual para permitir NULL
SET @col_tasa_anual_exists = (
    SELECT COUNT(*) 
    FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'planes_financiamiento'
    AND COLUMN_NAME = 'tasa_interes_anual'
);

SET @sql_modify_tasa_anual = IF(@col_tasa_anual_exists > 0,
    'ALTER TABLE planes_financiamiento MODIFY COLUMN tasa_interes_anual DECIMAL(5,2) NULL COMMENT ''Deprecated: usar planes_plazos.tasa_anual_calculada''',
    'SELECT "Column tasa_interes_anual does not exist" AS message'
);

PREPARE stmt_modify_tasa_anual FROM @sql_modify_tasa_anual;
EXECUTE stmt_modify_tasa_anual;
DEALLOCATE PREPARE stmt_modify_tasa_anual;

-- Modificar tasa_interes_mensual para permitir NULL
SET @col_tasa_mensual_exists = (
    SELECT COUNT(*) 
    FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'planes_financiamiento'
    AND COLUMN_NAME = 'tasa_interes_mensual'
);

SET @sql_modify_tasa_mensual = IF(@col_tasa_mensual_exists > 0,
    'ALTER TABLE planes_financiamiento MODIFY COLUMN tasa_interes_mensual DECIMAL(5,4) NULL COMMENT ''Deprecated: usar planes_plazos.tasa_mensual_calculada''',
    'SELECT "Column tasa_interes_mensual does not exist" AS message'
);

PREPARE stmt_modify_tasa_mensual FROM @sql_modify_tasa_mensual;
EXECUTE stmt_modify_tasa_mensual;
DEALLOCATE PREPARE stmt_modify_tasa_mensual;

-- Modificar pago_inicial_minimo_pct para permitir NULL
SET @col_pago_inicial_exists = (
    SELECT COUNT(*) 
    FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'planes_financiamiento'
    AND COLUMN_NAME = 'pago_inicial_minimo_pct'
);

SET @sql_modify_pago_inicial = IF(@col_pago_inicial_exists > 0,
    'ALTER TABLE planes_financiamiento MODIFY COLUMN pago_inicial_minimo_pct DECIMAL(5,2) NULL COMMENT ''Deprecated: usar planes_plazos.pago_inicial_valor''',
    'SELECT "Column pago_inicial_minimo_pct does not exist" AS message'
);

PREPARE stmt_modify_pago_inicial FROM @sql_modify_pago_inicial;
EXECUTE stmt_modify_pago_inicial;
DEALLOCATE PREPARE stmt_modify_pago_inicial;

-- Eliminar CHECK constraints si existen (pueden estar validando campos legacy)
-- Nota: MySQL no permite eliminar constraints directamente, pero podemos intentar
-- Si el constraint es específico, necesitaríamos conocer su nombre exacto
-- Por ahora, hacer los campos NULL debería resolver el problema

