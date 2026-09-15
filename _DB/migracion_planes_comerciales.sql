-- ============================================
-- Migración: Separación de Planes Comerciales y Financieros
-- Fecha: 2025-01-XX
-- Descripción: Implementa la metodología de planes comerciales (cash/diferido) 
--              vs planes financieros (crédito largo plazo) para venta de scooters
-- ============================================

-- ============================================
-- 1. Crear tabla politica_financiamiento

-- ============================================
CREATE TABLE IF NOT EXISTS politica_financiamiento (
    id INT AUTO_INCREMENT PRIMARY KEY,
    empresa_id INT NULL COMMENT 'NULL = política global del superadmin',
    
    -- Rango de plazos que aplica esta política
    plazo_min INT NOT NULL COMMENT 'Plazo mínimo en meses (inclusive)',
    plazo_max INT NOT NULL COMMENT 'Plazo máximo en meses (inclusive)',

    
    -- Tipo de cálculo
    tipo_calculo ENUM('COMERCIAL', 'FINANCIERO') NOT NULL DEFAULT 'FINANCIERO',
    
    -- Para planes COMERCIALES: recargo
    recargo_tipo ENUM('FIJO', 'PORCENTAJE') NULL COMMENT 'Tipo de recargo (solo para COMERCIAL)',
    recargo_valor DECIMAL(12,2) NULL COMMENT 'Valor del recargo (fijo en RD$ o porcentaje)',
    
    -- Para planes FINANCIEROS: tasa
    tasa_mensual DECIMAL(5,4) NULL COMMENT 'Tasa mensual efectiva (solo para FINANCIERO)',
    
    -- Requisitos comunes
    inicial_min_pct DECIMAL(5,2) DEFAULT 0.00 COMMENT 'Porcentaje mínimo de pago inicial',
    
    -- Configuración
    activo TINYINT(1) DEFAULT 1,
    descripcion TEXT COMMENT 'Descripción de la política',
    
    -- Auditoría
    creado_por INT NOT NULL,
    modificado_por INT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Índices
    INDEX idx_empresa (empresa_id),
    INDEX idx_plazo_rango (plazo_min, plazo_max),
    INDEX idx_tipo (tipo_calculo),
    INDEX idx_activo (activo),
    
    -- Constraints
    FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
    FOREIGN KEY (creado_por) REFERENCES usuarios(id),
    FOREIGN KEY (modificado_por) REFERENCES usuarios(id) ON DELETE SET NULL,
    
    -- Validaciones
    CHECK (plazo_min > 0),
    CHECK (plazo_max >= plazo_min),
    CHECK (
        (tipo_calculo = 'COMERCIAL' AND recargo_tipo IS NOT NULL AND recargo_valor IS NOT NULL AND tasa_mensual IS NULL) OR
        (tipo_calculo = 'FINANCIERO' AND tasa_mensual IS NOT NULL AND recargo_tipo IS NULL AND recargo_valor IS NULL)
    )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Políticas de financiamiento por rango de plazos (comercial vs financiero)';

-- ============================================
-- 2. Modificar tabla planes_plazos
-- ============================================
-- Nota: Esta migración verifica si las columnas existen antes de agregarlas
-- para evitar errores si la migración se ejecuta múltiples veces.

-- Procedimiento auxiliar para agregar columna solo si no existe
DELIMITER $$

DROP PROCEDURE IF EXISTS AddColumnIfNotExists$$
CREATE PROCEDURE AddColumnIfNotExists(

    IN p_tableName VARCHAR(255),
    IN p_columnName VARCHAR(255),
    IN p_columnDefinition TEXT
)
BEGIN
    DECLARE v_columnExists INT DEFAULT 0;
    
    SELECT COUNT(*) INTO v_columnExists
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = p_tableName
      AND COLUMN_NAME = p_columnName;
    
    IF v_columnExists = 0 THEN
        SET @sql = CONCAT('ALTER TABLE ', p_tableName, ' ADD COLUMN ', p_columnDefinition);
        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END$$

DELIMITER ;

-- Agregar columnas nuevas (solo si no existen)
CALL AddColumnIfNotExists('planes_plazos', 'tipo_plan', 
    'tipo_plan ENUM(''COMERCIAL'', ''FINANCIERO'') NULL COMMENT ''Tipo de plan según política''');

CALL AddColumnIfNotExists('planes_plazos', 'recargo_tipo', 
    'recargo_tipo ENUM(''FIJO'', ''PORCENTAJE'') NULL COMMENT ''Tipo de recargo (solo para COMERCIAL)''');

CALL AddColumnIfNotExists('planes_plazos', 'recargo_valor', 
    'recargo_valor DECIMAL(12,2) NULL COMMENT ''Valor del recargo (solo para COMERCIAL)''');

CALL AddColumnIfNotExists('planes_plazos', 'precio_financiado', 
    'precio_financiado DECIMAL(12,2) NULL COMMENT ''Precio final con recargo (solo para COMERCIAL)''');

CALL AddColumnIfNotExists('planes_plazos', 'mostrar_tasa', 
    'mostrar_tasa TINYINT(1) DEFAULT 1 COMMENT ''Si se debe mostrar tasa anual (0 para COMERCIAL)''');

CALL AddColumnIfNotExists('planes_plazos', 'mostrar_tea', 
    'mostrar_tea TINYINT(1) DEFAULT 1 COMMENT ''Si se debe mostrar TEA (0 para plazos cortos)''');

-- Limpiar procedimiento temporal
DROP PROCEDURE IF EXISTS AddColumnIfNotExists;

-- Modificar campos de tasa para que sean NULL en planes comerciales
-- (Esto es seguro ejecutarlo múltiples veces - solo modifica si es necesario)
ALTER TABLE planes_plazos
    MODIFY COLUMN tasa_anual_calculada DECIMAL(5,2) NULL COMMENT 'Tasa anual (NULL para COMERCIAL)',
    MODIFY COLUMN tasa_mensual_calculada DECIMAL(5,4) NULL COMMENT 'Tasa mensual (NULL para COMERCIAL)';

-- Agregar índice para búsqueda por tipo (si no existe)
DELIMITER $$

DROP PROCEDURE IF EXISTS AddIndexIfNotExists$$
CREATE PROCEDURE AddIndexIfNotExists(
    IN p_tableName VARCHAR(255),
    IN p_indexName VARCHAR(255),
    IN p_indexDefinition TEXT
)
BEGIN
    DECLARE v_indexExists INT DEFAULT 0;
    
    SELECT COUNT(*) INTO v_indexExists
    FROM INFORMATION_SCHEMA.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = p_tableName
      AND INDEX_NAME = p_indexName;
    
    IF v_indexExists = 0 THEN
        SET @sql = CONCAT('ALTER TABLE ', p_tableName, ' ADD INDEX ', p_indexName, ' ', p_indexDefinition);
        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END$$

DELIMITER ;

CALL AddIndexIfNotExists('planes_plazos', 'idx_tipo_plan', '(tipo_plan)');

DROP PROCEDURE IF EXISTS AddIndexIfNotExists;

-- ============================================
-- 3. Insertar políticas iniciales para venta de scooters
-- ============================================
-- Nota: Estas políticas son ejemplos. Ajustar según necesidades del negocio.

-- Política 1: Cash/Diferido 1-2 meses (sin interés)
INSERT INTO politica_financiamiento 
    (empresa_id, plazo_min, plazo_max, tipo_calculo, recargo_tipo, recargo_valor, inicial_min_pct, descripcion, creado_por)
VALUES
    (NULL, 1, 2, 'COMERCIAL', 'FIJO', 800.00, 0.00, 'Pago diferido comercial corto plazo (1-2 meses)', 1);

-- Política 2: Cash/Diferido 3 meses
INSERT INTO politica_financiamiento 
    (empresa_id, plazo_min, plazo_max, tipo_calculo, recargo_tipo, recargo_valor, inicial_min_pct, descripcion, creado_por)
VALUES
    (NULL, 3, 3, 'COMERCIAL', 'FIJO', 1500.00, 0.00, 'Pago diferido comercial 3 meses', 1);

-- Política 3: Cash/Diferido 4 meses
INSERT INTO politica_financiamiento 
    (empresa_id, plazo_min, plazo_max, tipo_calculo, recargo_tipo, recargo_valor, inicial_min_pct, descripcion, creado_por)
VALUES
    (NULL, 4, 4, 'COMERCIAL', 'PORCENTAJE', 5.00, 0.00, 'Pago diferido comercial 4 meses (5% recargo)', 1);

-- Política 4: Crédito corto 5-6 meses
INSERT INTO politica_financiamiento 
    (empresa_id, plazo_min, plazo_max, tipo_calculo, tasa_mensual, inicial_min_pct, descripcion, creado_por)
VALUES
    (NULL, 5, 6, 'FINANCIERO', 0.035, 10.00, 'Crédito financiero corto plazo (5-6 meses, 3.5% mensual)', 1);

-- Política 5: Crédito medio 7-9 meses
INSERT INTO politica_financiamiento 
    (empresa_id, plazo_min, plazo_max, tipo_calculo, tasa_mensual, inicial_min_pct, descripcion, creado_por)
VALUES
    (NULL, 7, 9, 'FINANCIERO', 0.040, 15.00, 'Crédito financiero medio plazo (7-9 meses, 4.0% mensual)', 1);

-- Política 6: Crédito largo 10-12 meses
INSERT INTO politica_financiamiento 
    (empresa_id, plazo_min, plazo_max, tipo_calculo, tasa_mensual, inicial_min_pct, descripcion, creado_por)
VALUES
    (NULL, 10, 12, 'FINANCIERO', 0.048, 20.00, 'Crédito financiero largo plazo (10-12 meses, 4.8% mensual)', 1);

-- ============================================
-- 4. Actualizar planes_plazos existentes (migración de datos)
-- ============================================
-- Para planes existentes con plazo <= 4, marcarlos como COMERCIAL
UPDATE planes_plazos
SET 
    tipo_plan = 'COMERCIAL',
    mostrar_tasa = 0,
    mostrar_tea = 0,
    tasa_anual_calculada = NULL,
    tasa_mensual_calculada = NULL
WHERE plazo_meses <= 4;

-- Para planes existentes con plazo >= 5, marcarlos como FINANCIERO
UPDATE planes_plazos
SET 
    tipo_plan = 'FINANCIERO',
    mostrar_tasa = 1,
    mostrar_tea = CASE 
        WHEN plazo_meses >= 9 THEN 1 
        ELSE 0 
    END
WHERE plazo_meses >= 5;

-- ============================================
-- 5. Comentarios y documentación
-- ============================================
-- Esta migración implementa la separación entre:
-- - Planes COMERCIALES (1-4 meses): Pago diferido con recargo, sin tasa
-- - Planes FINANCIEROS (5+ meses): Crédito con tasa de interés mensual
--
-- Reglas de negocio:
-- - Plazos <= 4 meses: NO se calcula ni muestra tasa
-- - Plazos 5-8 meses: Se muestra tasa mensual, NO TEA
-- - Plazos >= 9 meses: Se muestra tasa mensual Y TEA
--
-- Las políticas pueden ser por empresa o globales (empresa_id = NULL)

