-- ============================================
-- SCRIPT COMPLETO DE DATOS: Sistema de Unidades y Conversiones
-- Versión: 2.0.0
-- Fecha: 2025-02-02
-- Propósito: Cargar datos necesarios para funcionalidad completa
-- Compatible con: Base de datos punto_venta_rd
-- ============================================

USE punto_venta_rd;

START TRANSACTION;

-- ============================================
-- SECCIÓN 0: CORRECCIÓN DE PRECISIÓN factor_base
-- ============================================

-- IMPORTANTE: factor_base debe ser DECIMAL(15,6) para permitir valores grandes
-- como 1000000.000000 (kilómetro cuadrado, etc.)
-- Verificar y modificar si es necesario
SET @col_precision = (
    SELECT NUMERIC_PRECISION 
    FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'unidades_medida' 
    AND COLUMN_NAME = 'factor_base'
);

SET @sql = IF(@col_precision IS NULL OR @col_precision < 15,
    'ALTER TABLE unidades_medida MODIFY COLUMN factor_base DECIMAL(15,6) DEFAULT 1.000000',
    'SELECT "Columna factor_base ya tiene precisión suficiente (DECIMAL(15,6) o mayor)" as mensaje'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================
-- SECCIÓN 1: UNIDADES DE MEDIDA COMPLETAS
-- ============================================

-- Insertar unidades de PESO (solo si no existen)
INSERT INTO unidades_medida (codigo, nombre, abreviatura, tipo_medida, permite_decimales, es_base, factor_base, activo) VALUES
-- Sistema Métrico
('KG', 'Kilogramo', 'kg', 'peso', TRUE, TRUE, 1.000000, TRUE),
('G', 'Gramo', 'g', 'peso', TRUE, FALSE, 0.001000, TRUE),
('GR', 'Gramo', 'gr', 'peso', TRUE, FALSE, 0.001000, TRUE),
('MG', 'Miligramo', 'mg', 'peso', TRUE, FALSE, 0.000001, TRUE),
('TON', 'Tonelada', 't', 'peso', TRUE, FALSE, 1000.000000, TRUE),

-- Sistema Imperial
('LB', 'Libra', 'lb', 'peso', TRUE, FALSE, 0.453592, TRUE),
('LIBRA', 'Libra', 'libra', 'peso', TRUE, FALSE, 0.453592, TRUE),
('OZ', 'Onza', 'oz', 'peso', TRUE, FALSE, 0.028350, TRUE),
('ONZA', 'Onza', 'onza', 'peso', TRUE, FALSE, 0.028350, TRUE),
('TON_US', 'Tonelada US', 'ton US', 'peso', TRUE, FALSE, 907.185000, TRUE),

-- Sistema Avoirdupois (común en República Dominicana)
('QQ', 'Quintal', 'qq', 'peso', TRUE, FALSE, 45.359200, TRUE),
('ARR', 'Arroba', '@', 'peso', TRUE, FALSE, 11.339800, TRUE)
ON DUPLICATE KEY UPDATE
    nombre = VALUES(nombre),
    abreviatura = VALUES(abreviatura),
    tipo_medida = VALUES(tipo_medida),
    permite_decimales = VALUES(permite_decimales),
    es_base = VALUES(es_base),
    factor_base = VALUES(factor_base),
    activo = VALUES(activo);

-- Insertar unidades de VOLUMEN (solo si no existen)
INSERT INTO unidades_medida (codigo, nombre, abreviatura, tipo_medida, permite_decimales, es_base, factor_base, activo) VALUES
-- Sistema Métrico
('L', 'Litro', 'L', 'volumen', TRUE, TRUE, 1.000000, TRUE),
('LT', 'Litro', 'lt', 'volumen', TRUE, TRUE, 1.000000, TRUE),
('LITRO', 'Litro', 'litro', 'volumen', TRUE, TRUE, 1.000000, TRUE),
('ML', 'Mililitro', 'ml', 'volumen', TRUE, FALSE, 0.001000, TRUE),
('M3', 'Metro cúbico', 'm³', 'volumen', TRUE, FALSE, 1000.000000, TRUE),
('CM3', 'Centímetro cúbico', 'cm³', 'volumen', TRUE, FALSE, 0.001000, TRUE),

-- Sistema Imperial
('GAL', 'Galón', 'gal', 'volumen', TRUE, FALSE, 3.785410, TRUE),
('GALON', 'Galón', 'galón', 'volumen', TRUE, FALSE, 3.785410, TRUE),
('QT', 'Cuarto', 'qt', 'volumen', TRUE, FALSE, 0.946353, TRUE),
('PT', 'Pinta', 'pt', 'volumen', TRUE, FALSE, 0.473176, TRUE),
('FL_OZ', 'Onza fluida', 'fl oz', 'volumen', TRUE, FALSE, 0.029574, TRUE),

-- Volumen común en RD
('BOT', 'Botella', 'bot', 'volumen', FALSE, FALSE, 0.750000, TRUE),
('BOT_PEQ', 'Botella pequeña', 'bot peq', 'volumen', FALSE, FALSE, 0.355000, TRUE)
ON DUPLICATE KEY UPDATE
    nombre = VALUES(nombre),
    abreviatura = VALUES(abreviatura),
    tipo_medida = VALUES(tipo_medida),
    permite_decimales = VALUES(permite_decimales),
    es_base = VALUES(es_base),
    factor_base = VALUES(factor_base),
    activo = VALUES(activo);

-- Insertar unidades de LONGITUD (solo si no existen)
INSERT INTO unidades_medida (codigo, nombre, abreviatura, tipo_medida, permite_decimales, es_base, factor_base, activo) VALUES
-- Sistema Métrico
('M', 'Metro', 'm', 'longitud', TRUE, TRUE, 1.000000, TRUE),
('MT', 'Metro', 'mt', 'longitud', TRUE, TRUE, 1.000000, TRUE),
('METRO', 'Metro', 'metro', 'longitud', TRUE, TRUE, 1.000000, TRUE),
('CM', 'Centímetro', 'cm', 'longitud', TRUE, FALSE, 0.010000, TRUE),
('MM', 'Milímetro', 'mm', 'longitud', TRUE, FALSE, 0.001000, TRUE),
('KM', 'Kilómetro', 'km', 'longitud', TRUE, FALSE, 1000.000000, TRUE),

-- Sistema Imperial
('FT', 'Pie', 'ft', 'longitud', TRUE, FALSE, 0.304800, TRUE),
('PIE', 'Pie', 'pie', 'longitud', TRUE, FALSE, 0.304800, TRUE),
('IN', 'Pulgada', 'in', 'longitud', TRUE, FALSE, 0.025400, TRUE),
('PULGADA', 'Pulgada', 'pulgada', 'longitud', TRUE, FALSE, 0.025400, TRUE),
('YD', 'Yarda', 'yd', 'longitud', TRUE, FALSE, 0.914400, TRUE),
('MI', 'Milla', 'mi', 'longitud', TRUE, FALSE, 1609.340000, TRUE)
ON DUPLICATE KEY UPDATE
    nombre = VALUES(nombre),
    abreviatura = VALUES(abreviatura),
    tipo_medida = VALUES(tipo_medida),
    permite_decimales = VALUES(permite_decimales),
    es_base = VALUES(es_base),
    factor_base = VALUES(factor_base),
    activo = VALUES(activo);
-- Aqui
-- Insertar unidades de ÁREA (solo si no existen)
INSERT INTO unidades_medida (codigo, nombre, abreviatura, tipo_medida, permite_decimales, es_base, factor_base, activo) VALUES
-- Sistema Métrico
('M2', 'Metro cuadrado', 'm²', 'area', TRUE, TRUE, 1.000000, TRUE),
('CM2', 'Centímetro cuadrado', 'cm²', 'area', TRUE, FALSE, 0.000100, TRUE),
('KM2', 'Kilómetro cuadrado', 'km²', 'area', TRUE, FALSE, 1000000.000000, TRUE),
('HA', 'Hectárea', 'ha', 'area', TRUE, FALSE, 10000.000000, TRUE),

-- Sistema Imperial
('FT2', 'Pie cuadrado', 'ft²', 'area', TRUE, FALSE, 0.092903, TRUE),
('IN2', 'Pulgada cuadrada', 'in²', 'area', TRUE, FALSE, 0.000645, TRUE),
('AC', 'Acre', 'ac', 'area', TRUE, FALSE, 4046.860000, TRUE),

-- Área RD
('TAREA', 'Tarea', 'tarea', 'area', TRUE, FALSE, 628.860000, TRUE)
ON DUPLICATE KEY UPDATE
    nombre = VALUES(nombre),
    abreviatura = VALUES(abreviatura),
    tipo_medida = VALUES(tipo_medida),
    permite_decimales = VALUES(permite_decimales),
    es_base = VALUES(es_base),
    factor_base = VALUES(factor_base),
    activo = VALUES(activo);

-- Insertar unidades de CANTIDAD (Unidades discretas) - solo si no existen
INSERT INTO unidades_medida (codigo, nombre, abreviatura, tipo_medida, permite_decimales, es_base, factor_base, activo) VALUES
('UN', 'Unidad', 'un', 'unidad', FALSE, TRUE, 1.000000, TRUE),
('UND', 'Unidad', 'und', 'unidad', FALSE, TRUE, 1.000000, TRUE),
('UNIDAD', 'Unidad', 'unidad', 'unidad', FALSE, TRUE, 1.000000, TRUE),
('PZ', 'Pieza', 'pz', 'unidad', FALSE, FALSE, 1.000000, TRUE),
('PIEZA', 'Pieza', 'pieza', 'unidad', FALSE, FALSE, 1.000000, TRUE),
('DOC', 'Docena', 'doc', 'unidad', FALSE, FALSE, 12.000000, TRUE),
('CIEN', 'Ciento', 'ciento', 'unidad', FALSE, FALSE, 100.000000, TRUE),
('MIL', 'Millar', 'millar', 'unidad', FALSE, FALSE, 1000.000000, TRUE),
('PAR', 'Par', 'par', 'unidad', FALSE, FALSE, 2.000000, TRUE),

-- Empaques comunes
('CAJ', 'Caja', 'caja', 'unidad', FALSE, FALSE, 1.000000, TRUE),
('CAJA', 'Caja', 'caja', 'unidad', FALSE, FALSE, 1.000000, TRUE),
('SAC', 'Saco', 'saco', 'unidad', FALSE, FALSE, 1.000000, TRUE),
('PAQ', 'Paquete', 'paq', 'unidad', FALSE, FALSE, 1.000000, TRUE),
('BOL', 'Bolsa', 'bolsa', 'unidad', FALSE, FALSE, 1.000000, TRUE),
('FRA', 'Frasco', 'frasco', 'unidad', FALSE, FALSE, 1.000000, TRUE),
('LAT', 'Lata', 'lata', 'unidad', FALSE, FALSE, 1.000000, TRUE),
('TUB', 'Tubo', 'tubo', 'unidad', FALSE, FALSE, 1.000000, TRUE),
('ROL', 'Rollo', 'rollo', 'unidad', FALSE, FALSE, 1.000000, TRUE)
ON DUPLICATE KEY UPDATE
    nombre = VALUES(nombre),
    abreviatura = VALUES(abreviatura),
    tipo_medida = VALUES(tipo_medida),
    permite_decimales = VALUES(permite_decimales),
    es_base = VALUES(es_base),
    factor_base = VALUES(factor_base),
    activo = VALUES(activo);

-- Insertar unidades de TIEMPO (para servicios) - solo si no existen
INSERT INTO unidades_medida (codigo, nombre, abreviatura, tipo_medida, permite_decimales, es_base, factor_base, activo) VALUES
('H', 'Hora', 'h', 'otro', TRUE, TRUE, 1.000000, TRUE),
('MIN', 'Minuto', 'min', 'otro', TRUE, FALSE, 0.016667, TRUE),
('DIA', 'Día', 'día', 'otro', FALSE, FALSE, 24.000000, TRUE),
('SEM', 'Semana', 'sem', 'otro', FALSE, FALSE, 168.000000, TRUE),
('MES', 'Mes', 'mes', 'otro', FALSE, FALSE, 730.000000, TRUE)
ON DUPLICATE KEY UPDATE
    nombre = VALUES(nombre),
    abreviatura = VALUES(abreviatura),
    tipo_medida = VALUES(tipo_medida),
    permite_decimales = VALUES(permite_decimales),
    es_base = VALUES(es_base),
    factor_base = VALUES(factor_base),
    activo = VALUES(activo);

-- ============================================
-- SECCIÓN 2: CONVERSIONES ENTRE UNIDADES
-- ============================================

-- Obtener IDs de unidades de peso
SET @kg_id = (SELECT id FROM unidades_medida WHERE codigo = 'KG' LIMIT 1);
SET @g_id = (SELECT id FROM unidades_medida WHERE codigo IN ('G', 'GR') LIMIT 1);
SET @mg_id = (SELECT id FROM unidades_medida WHERE codigo = 'MG' LIMIT 1);
SET @ton_id = (SELECT id FROM unidades_medida WHERE codigo = 'TON' LIMIT 1);
SET @lb_id = (SELECT id FROM unidades_medida WHERE codigo IN ('LB', 'LIBRA') LIMIT 1);
SET @oz_id = (SELECT id FROM unidades_medida WHERE codigo IN ('OZ', 'ONZA') LIMIT 1);
SET @ton_us_id = (SELECT id FROM unidades_medida WHERE codigo = 'TON_US' LIMIT 1);
SET @qq_id = (SELECT id FROM unidades_medida WHERE codigo = 'QQ' LIMIT 1);
SET @arr_id = (SELECT id FROM unidades_medida WHERE codigo = 'ARR' LIMIT 1);

-- Conversiones Kilogramo (base métrica) - solo si no existen
INSERT INTO conversiones_unidad (empresa_id, unidad_origen_id, unidad_destino_id, factor, activo) VALUES
-- KG ↔ G
(NULL, @kg_id, @g_id, 1000.000000, TRUE),
(NULL, @g_id, @kg_id, 0.001000, TRUE),

-- KG ↔ MG
(NULL, @kg_id, @mg_id, 1000000.000000, TRUE),
(NULL, @mg_id, @kg_id, 0.000001, TRUE),

-- KG ↔ TON
(NULL, @kg_id, @ton_id, 0.001000, TRUE),
(NULL, @ton_id, @kg_id, 1000.000000, TRUE),

-- KG ↔ LB (conversión clave para RD)
(NULL, @kg_id, @lb_id, 2.204622, TRUE),
(NULL, @lb_id, @kg_id, 0.453592, TRUE),

-- KG ↔ OZ
(NULL, @kg_id, @oz_id, 35.273962, TRUE),
(NULL, @oz_id, @kg_id, 0.028350, TRUE),

-- KG ↔ TON US
(NULL, @kg_id, @ton_us_id, 0.001102, TRUE),
(NULL, @ton_us_id, @kg_id, 907.185000, TRUE),

-- KG ↔ QQ (Quintal)
(NULL, @kg_id, @qq_id, 0.022046, TRUE),
(NULL, @qq_id, @kg_id, 45.359200, TRUE),

-- KG ↔ ARR (Arroba)
(NULL, @kg_id, @arr_id, 0.088185, TRUE),
(NULL, @arr_id, @kg_id, 11.339800, TRUE)
ON DUPLICATE KEY UPDATE
    factor = VALUES(factor),
    activo = VALUES(activo);

-- Conversiones Gramo - solo si no existen
INSERT INTO conversiones_unidad (empresa_id, unidad_origen_id, unidad_destino_id, factor, activo) VALUES
-- G ↔ MG
(NULL, @g_id, @mg_id, 1000.000000, TRUE),
(NULL, @mg_id, @g_id, 0.001000, TRUE),

-- G ↔ LB
(NULL, @g_id, @lb_id, 0.002205, TRUE),
(NULL, @lb_id, @g_id, 453.592000, TRUE),

-- G ↔ OZ
(NULL, @g_id, @oz_id, 0.035274, TRUE),
(NULL, @oz_id, @g_id, 28.350000, TRUE)
ON DUPLICATE KEY UPDATE
    factor = VALUES(factor),
    activo = VALUES(activo);

-- Conversiones Libra - solo si no existen
INSERT INTO conversiones_unidad (empresa_id, unidad_origen_id, unidad_destino_id, factor, activo) VALUES
-- LB ↔ OZ
(NULL, @lb_id, @oz_id, 16.000000, TRUE),
(NULL, @oz_id, @lb_id, 0.062500, TRUE),

-- LB ↔ QQ
(NULL, @lb_id, @qq_id, 0.010000, TRUE),
(NULL, @qq_id, @lb_id, 100.000000, TRUE),

-- LB ↔ ARR
(NULL, @lb_id, @arr_id, 0.040000, TRUE),
(NULL, @arr_id, @lb_id, 25.000000, TRUE)
ON DUPLICATE KEY UPDATE
    factor = VALUES(factor),
    activo = VALUES(activo);

-- Obtener IDs de unidades de volumen
SET @l_id = (SELECT id FROM unidades_medida WHERE codigo IN ('L', 'LT', 'LITRO') LIMIT 1);
SET @ml_id = (SELECT id FROM unidades_medida WHERE codigo = 'ML' LIMIT 1);
SET @m3_id = (SELECT id FROM unidades_medida WHERE codigo = 'M3' LIMIT 1);
SET @cm3_id = (SELECT id FROM unidades_medida WHERE codigo = 'CM3' LIMIT 1);
SET @gal_id = (SELECT id FROM unidades_medida WHERE codigo IN ('GAL', 'GALON') LIMIT 1);
SET @qt_id = (SELECT id FROM unidades_medida WHERE codigo = 'QT' LIMIT 1);
SET @pt_id = (SELECT id FROM unidades_medida WHERE codigo = 'PT' LIMIT 1);
SET @fl_oz_id = (SELECT id FROM unidades_medida WHERE codigo = 'FL_OZ' LIMIT 1);
SET @bot_id = (SELECT id FROM unidades_medida WHERE codigo = 'BOT' LIMIT 1);
SET @bot_peq_id = (SELECT id FROM unidades_medida WHERE codigo = 'BOT_PEQ' LIMIT 1);

-- Conversiones Litro (base métrica) - solo si no existen
INSERT INTO conversiones_unidad (empresa_id, unidad_origen_id, unidad_destino_id, factor, activo) VALUES
-- L ↔ ML
(NULL, @l_id, @ml_id, 1000.000000, TRUE),
(NULL, @ml_id, @l_id, 0.001000, TRUE),

-- L ↔ M3
(NULL, @l_id, @m3_id, 0.001000, TRUE),
(NULL, @m3_id, @l_id, 1000.000000, TRUE),

-- L ↔ CM3
(NULL, @l_id, @cm3_id, 1000.000000, TRUE),
(NULL, @cm3_id, @l_id, 0.001000, TRUE),

-- L ↔ GAL
(NULL, @l_id, @gal_id, 0.264172, TRUE),
(NULL, @gal_id, @l_id, 3.785410, TRUE),

-- L ↔ QT
(NULL, @l_id, @qt_id, 1.056688, TRUE),
(NULL, @qt_id, @l_id, 0.946353, TRUE),

-- L ↔ PT
(NULL, @l_id, @pt_id, 2.113376, TRUE),
(NULL, @pt_id, @l_id, 0.473176, TRUE),

-- L ↔ FL_OZ
(NULL, @l_id, @fl_oz_id, 33.814023, TRUE),
(NULL, @fl_oz_id, @l_id, 0.029574, TRUE),

-- L ↔ BOT (750ml)
(NULL, @l_id, @bot_id, 1.333333, TRUE),
(NULL, @bot_id, @l_id, 0.750000, TRUE),

-- L ↔ BOT_PEQ (355ml)
(NULL, @l_id, @bot_peq_id, 2.816901, TRUE),
(NULL, @bot_peq_id, @l_id, 0.355000, TRUE)
ON DUPLICATE KEY UPDATE
    factor = VALUES(factor),
    activo = VALUES(activo);

-- Conversiones Galón - solo si no existen
INSERT INTO conversiones_unidad (empresa_id, unidad_origen_id, unidad_destino_id, factor, activo) VALUES
-- GAL ↔ QT
(NULL, @gal_id, @qt_id, 4.000000, TRUE),
(NULL, @qt_id, @gal_id, 0.250000, TRUE),

-- GAL ↔ PT
(NULL, @gal_id, @pt_id, 8.000000, TRUE),
(NULL, @pt_id, @gal_id, 0.125000, TRUE),

-- GAL ↔ FL_OZ
(NULL, @gal_id, @fl_oz_id, 128.000000, TRUE),
(NULL, @fl_oz_id, @gal_id, 0.007813, TRUE)
ON DUPLICATE KEY UPDATE
    factor = VALUES(factor),
    activo = VALUES(activo);

-- Obtener IDs de unidades de longitud
SET @m_id = (SELECT id FROM unidades_medida WHERE codigo IN ('M', 'MT', 'METRO') LIMIT 1);
SET @cm_id = (SELECT id FROM unidades_medida WHERE codigo = 'CM' LIMIT 1);
SET @mm_id = (SELECT id FROM unidades_medida WHERE codigo = 'MM' LIMIT 1);
SET @km_id = (SELECT id FROM unidades_medida WHERE codigo = 'KM' LIMIT 1);
SET @ft_id = (SELECT id FROM unidades_medida WHERE codigo IN ('FT', 'PIE') LIMIT 1);
SET @in_id = (SELECT id FROM unidades_medida WHERE codigo IN ('IN', 'PULGADA') LIMIT 1);
SET @yd_id = (SELECT id FROM unidades_medida WHERE codigo = 'YD' LIMIT 1);
SET @mi_id = (SELECT id FROM unidades_medida WHERE codigo = 'MI' LIMIT 1);

-- Conversiones Metro (base métrica) - solo si no existen
INSERT INTO conversiones_unidad (empresa_id, unidad_origen_id, unidad_destino_id, factor, activo) VALUES
-- M ↔ CM
(NULL, @m_id, @cm_id, 100.000000, TRUE),
(NULL, @cm_id, @m_id, 0.010000, TRUE),

-- M ↔ MM
(NULL, @m_id, @mm_id, 1000.000000, TRUE),
(NULL, @mm_id, @m_id, 0.001000, TRUE),

-- M ↔ KM
(NULL, @m_id, @km_id, 0.001000, TRUE),
(NULL, @km_id, @m_id, 1000.000000, TRUE),

-- M ↔ FT
(NULL, @m_id, @ft_id, 3.280840, TRUE),
(NULL, @ft_id, @m_id, 0.304800, TRUE),

-- M ↔ IN
(NULL, @m_id, @in_id, 39.370079, TRUE),
(NULL, @in_id, @m_id, 0.025400, TRUE),

-- M ↔ YD
(NULL, @m_id, @yd_id, 1.093613, TRUE),
(NULL, @yd_id, @m_id, 0.914400, TRUE),

-- M ↔ MI
(NULL, @m_id, @mi_id, 0.000621, TRUE),
(NULL, @mi_id, @m_id, 1609.340000, TRUE)
ON DUPLICATE KEY UPDATE
    factor = VALUES(factor),
    activo = VALUES(activo);

-- Conversiones Pie - solo si no existen
INSERT INTO conversiones_unidad (empresa_id, unidad_origen_id, unidad_destino_id, factor, activo) VALUES
-- FT ↔ IN
(NULL, @ft_id, @in_id, 12.000000, TRUE),
(NULL, @in_id, @ft_id, 0.083333, TRUE),

-- FT ↔ YD
(NULL, @ft_id, @yd_id, 0.333333, TRUE),
(NULL, @yd_id, @ft_id, 3.000000, TRUE)
ON DUPLICATE KEY UPDATE
    factor = VALUES(factor),
    activo = VALUES(activo);

-- Obtener IDs de unidades de área
SET @m2_id = (SELECT id FROM unidades_medida WHERE codigo = 'M2' LIMIT 1);
SET @cm2_id = (SELECT id FROM unidades_medida WHERE codigo = 'CM2' LIMIT 1);
SET @km2_id = (SELECT id FROM unidades_medida WHERE codigo = 'KM2' LIMIT 1);
SET @ha_id = (SELECT id FROM unidades_medida WHERE codigo = 'HA' LIMIT 1);
SET @ft2_id = (SELECT id FROM unidades_medida WHERE codigo = 'FT2' LIMIT 1);
SET @in2_id = (SELECT id FROM unidades_medida WHERE codigo = 'IN2' LIMIT 1);
SET @ac_id = (SELECT id FROM unidades_medida WHERE codigo = 'AC' LIMIT 1);
SET @tarea_id = (SELECT id FROM unidades_medida WHERE codigo = 'TAREA' LIMIT 1);

-- Conversiones Metro cuadrado (base métrica) - solo si no existen
INSERT INTO conversiones_unidad (empresa_id, unidad_origen_id, unidad_destino_id, factor, activo) VALUES
-- M2 ↔ CM2
(NULL, @m2_id, @cm2_id, 10000.000000, TRUE),
(NULL, @cm2_id, @m2_id, 0.000100, TRUE),

-- M2 ↔ KM2
(NULL, @m2_id, @km2_id, 0.000001, TRUE),
(NULL, @km2_id, @m2_id, 1000000.000000, TRUE),

-- M2 ↔ HA
(NULL, @m2_id, @ha_id, 0.000100, TRUE),
(NULL, @ha_id, @m2_id, 10000.000000, TRUE),

-- M2 ↔ FT2
(NULL, @m2_id, @ft2_id, 10.763910, TRUE),
(NULL, @ft2_id, @m2_id, 0.092903, TRUE),

-- M2 ↔ IN2
(NULL, @m2_id, @in2_id, 1550.003100, TRUE),
(NULL, @in2_id, @m2_id, 0.000645, TRUE),

-- M2 ↔ AC
(NULL, @m2_id, @ac_id, 0.000247, TRUE),
(NULL, @ac_id, @m2_id, 4046.860000, TRUE),

-- M2 ↔ TAREA (RD)
(NULL, @m2_id, @tarea_id, 0.001590, TRUE),
(NULL, @tarea_id, @m2_id, 628.860000, TRUE)
ON DUPLICATE KEY UPDATE
    factor = VALUES(factor),
    activo = VALUES(activo);

-- Obtener IDs de unidades de cantidad
SET @un_id = (SELECT id FROM unidades_medida WHERE codigo IN ('UN', 'UND', 'UNIDAD') LIMIT 1);
SET @doc_id = (SELECT id FROM unidades_medida WHERE codigo = 'DOC' LIMIT 1);
SET @cien_id = (SELECT id FROM unidades_medida WHERE codigo = 'CIEN' LIMIT 1);
SET @mil_id = (SELECT id FROM unidades_medida WHERE codigo = 'MIL' LIMIT 1);
SET @par_id = (SELECT id FROM unidades_medida WHERE codigo = 'PAR' LIMIT 1);

-- Conversiones Unidad (base) - solo si no existen
INSERT INTO conversiones_unidad (empresa_id, unidad_origen_id, unidad_destino_id, factor, activo) VALUES
-- UN ↔ DOC
(NULL, @un_id, @doc_id, 0.083333, TRUE),
(NULL, @doc_id, @un_id, 12.000000, TRUE),

-- UN ↔ CIEN
(NULL, @un_id, @cien_id, 0.010000, TRUE),
(NULL, @cien_id, @un_id, 100.000000, TRUE),

-- UN ↔ MIL
(NULL, @un_id, @mil_id, 0.001000, TRUE),
(NULL, @mil_id, @un_id, 1000.000000, TRUE),

-- UN ↔ PAR
(NULL, @un_id, @par_id, 0.500000, TRUE),
(NULL, @par_id, @un_id, 2.000000, TRUE)
ON DUPLICATE KEY UPDATE
    factor = VALUES(factor),
    activo = VALUES(activo);

-- Obtener IDs de unidades de tiempo
SET @h_id = (SELECT id FROM unidades_medida WHERE codigo = 'H' LIMIT 1);
SET @min_id = (SELECT id FROM unidades_medida WHERE codigo = 'MIN' LIMIT 1);
SET @dia_id = (SELECT id FROM unidades_medida WHERE codigo = 'DIA' LIMIT 1);
SET @sem_id = (SELECT id FROM unidades_medida WHERE codigo = 'SEM' LIMIT 1);
SET @mes_id = (SELECT id FROM unidades_medida WHERE codigo = 'MES' LIMIT 1);

-- Conversiones Hora (base) - solo si no existen
INSERT INTO conversiones_unidad (empresa_id, unidad_origen_id, unidad_destino_id, factor, activo) VALUES
-- H ↔ MIN
(NULL, @h_id, @min_id, 60.000000, TRUE),
(NULL, @min_id, @h_id, 0.016667, TRUE),

-- H ↔ DIA
(NULL, @h_id, @dia_id, 0.041667, TRUE),
(NULL, @dia_id, @h_id, 24.000000, TRUE),

-- H ↔ SEM
(NULL, @h_id, @sem_id, 0.005952, TRUE),
(NULL, @sem_id, @h_id, 168.000000, TRUE),

-- H ↔ MES
(NULL, @h_id, @mes_id, 0.001370, TRUE),
(NULL, @mes_id, @h_id, 730.000000, TRUE)
ON DUPLICATE KEY UPDATE
    factor = VALUES(factor),
    activo = VALUES(activo);

-- ============================================
-- SECCIÓN 3: TABLA DE HISTORIAL DE VENTAS (UX)
-- ============================================

-- Tabla para recordar última unidad usada por producto
CREATE TABLE IF NOT EXISTS historial_unidades_venta (
    id INT(11) NOT NULL AUTO_INCREMENT,
    empresa_id INT(11) NOT NULL,
    usuario_id INT(11) NOT NULL,
    producto_id INT(11) NOT NULL,
    unidad_medida_id INT(11) NOT NULL,
    cantidad_promedio DECIMAL(10,3) DEFAULT 0.000 COMMENT 'Promedio de cantidades vendidas',
    veces_usada INT(11) DEFAULT 1 COMMENT 'Cantidad de veces que se usó esta unidad',
    ultima_fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_historial (empresa_id, usuario_id, producto_id, unidad_medida_id),
    INDEX idx_empresa (empresa_id),
    INDEX idx_usuario (usuario_id),
    INDEX idx_producto (producto_id),
    FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE,
    FOREIGN KEY (unidad_medida_id) REFERENCES unidades_medida(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- SECCIÓN 4: TABLA DE ALERTAS DE CANTIDAD (UX)
-- ============================================

-- Tabla para configurar alertas de cantidades inusuales
CREATE TABLE IF NOT EXISTS alertas_cantidad_producto (
    id INT(11) NOT NULL AUTO_INCREMENT,
    empresa_id INT(11) NOT NULL,
    producto_id INT(11) NOT NULL,
    cantidad_minima_sugerida DECIMAL(10,3) DEFAULT 0.001 COMMENT 'Cantidad mínima normal',
    cantidad_maxima_sugerida DECIMAL(10,3) DEFAULT 100.000 COMMENT 'Cantidad máxima normal',
    cantidad_promedio DECIMAL(10,3) DEFAULT 1.000 COMMENT 'Cantidad promedio histórica',
    desviacion_alerta DECIMAL(5,2) DEFAULT 2.00 COMMENT 'Factor de desviación para alertar (ej: 2.0 = 200%)',
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_alerta_producto (empresa_id, producto_id),
    INDEX idx_empresa (empresa_id),
    INDEX idx_producto (producto_id),
    FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
    FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- SECCIÓN 5: TABLA DE UNIDADES FAVORITAS POR PAÍS
-- ============================================

-- Tabla para sugerir unidades según país
CREATE TABLE IF NOT EXISTS unidades_preferidas_pais (
    id INT(11) NOT NULL AUTO_INCREMENT,
    pais_codigo VARCHAR(2) NOT NULL COMMENT 'Código ISO del país (DO, US, PE, etc.)',
    tipo_medida ENUM('unidad', 'peso', 'volumen', 'longitud', 'area', 'otro') NOT NULL,
    unidad_medida_id INT(11) NOT NULL,
    prioridad INT(11) DEFAULT 1 COMMENT 'Orden de preferencia (1 = más preferida)',
    activo BOOLEAN DEFAULT TRUE,
    PRIMARY KEY (id),
    UNIQUE KEY uk_pais_tipo_prioridad (pais_codigo, tipo_medida, prioridad),
    INDEX idx_pais (pais_codigo),
    INDEX idx_tipo (tipo_medida),
    FOREIGN KEY (unidad_medida_id) REFERENCES unidades_medida(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insertar preferencias de unidades por país
INSERT INTO unidades_preferidas_pais (pais_codigo, tipo_medida, unidad_medida_id, prioridad, activo) VALUES
-- República Dominicana (DO)
('DO', 'peso', (SELECT id FROM unidades_medida WHERE codigo = 'LB' LIMIT 1), 1, TRUE),
('DO', 'peso', (SELECT id FROM unidades_medida WHERE codigo = 'KG' LIMIT 1), 2, TRUE),
('DO', 'volumen', (SELECT id FROM unidades_medida WHERE codigo = 'L' LIMIT 1), 1, TRUE),
('DO', 'volumen', (SELECT id FROM unidades_medida WHERE codigo = 'GAL' LIMIT 1), 2, TRUE),
('DO', 'longitud', (SELECT id FROM unidades_medida WHERE codigo = 'M' LIMIT 1), 1, TRUE),
('DO', 'area', (SELECT id FROM unidades_medida WHERE codigo = 'TAREA' LIMIT 1), 1, TRUE),
('DO', 'area', (SELECT id FROM unidades_medida WHERE codigo = 'M2' LIMIT 1), 2, TRUE),
('DO', 'unidad', (SELECT id FROM unidades_medida WHERE codigo = 'UN' LIMIT 1), 1, TRUE),

-- Estados Unidos (US)
('US', 'peso', (SELECT id FROM unidades_medida WHERE codigo = 'LB' LIMIT 1), 1, TRUE),
('US', 'peso', (SELECT id FROM unidades_medida WHERE codigo = 'OZ' LIMIT 1), 2, TRUE),
('US', 'volumen', (SELECT id FROM unidades_medida WHERE codigo = 'GAL' LIMIT 1), 1, TRUE),
('US', 'volumen', (SELECT id FROM unidades_medida WHERE codigo = 'QT' LIMIT 1), 2, TRUE),
('US', 'longitud', (SELECT id FROM unidades_medida WHERE codigo = 'FT' LIMIT 1), 1, TRUE),
('US', 'longitud', (SELECT id FROM unidades_medida WHERE codigo = 'IN' LIMIT 1), 2, TRUE),
('US', 'area', (SELECT id FROM unidades_medida WHERE codigo = 'FT2' LIMIT 1), 1, TRUE),
('US', 'area', (SELECT id FROM unidades_medida WHERE codigo = 'AC' LIMIT 1), 2, TRUE),
('US', 'unidad', (SELECT id FROM unidades_medida WHERE codigo = 'UN' LIMIT 1), 1, TRUE),

-- Perú (PE) y otros países latinoamericanos
('PE', 'peso', (SELECT id FROM unidades_medida WHERE codigo = 'KG' LIMIT 1), 1, TRUE),
('PE', 'peso', (SELECT id FROM unidades_medida WHERE codigo = 'G' LIMIT 1), 2, TRUE),
('PE', 'volumen', (SELECT id FROM unidades_medida WHERE codigo = 'L' LIMIT 1), 1, TRUE),
('PE', 'volumen', (SELECT id FROM unidades_medida WHERE codigo = 'ML' LIMIT 1), 2, TRUE),
('PE', 'longitud', (SELECT id FROM unidades_medida WHERE codigo = 'M' LIMIT 1), 1, TRUE),
('PE', 'longitud', (SELECT id FROM unidades_medida WHERE codigo = 'CM' LIMIT 1), 2, TRUE),
('PE', 'area', (SELECT id FROM unidades_medida WHERE codigo = 'M2' LIMIT 1), 1, TRUE),
('PE', 'area', (SELECT id FROM unidades_medida WHERE codigo = 'HA' LIMIT 1), 2, TRUE),
('PE', 'unidad', (SELECT id FROM unidades_medida WHERE codigo = 'UN' LIMIT 1), 1, TRUE),

-- México (MX)
('MX', 'peso', (SELECT id FROM unidades_medida WHERE codigo = 'KG' LIMIT 1), 1, TRUE),
('MX', 'peso', (SELECT id FROM unidades_medida WHERE codigo = 'G' LIMIT 1), 2, TRUE),
('MX', 'volumen', (SELECT id FROM unidades_medida WHERE codigo = 'L' LIMIT 1), 1, TRUE),
('MX', 'longitud', (SELECT id FROM unidades_medida WHERE codigo = 'M' LIMIT 1), 1, TRUE),
('MX', 'area', (SELECT id FROM unidades_medida WHERE codigo = 'M2' LIMIT 1), 1, TRUE),
('MX', 'unidad', (SELECT id FROM unidades_medida WHERE codigo = 'UN' LIMIT 1), 1, TRUE),

-- España (ES) y Europa
('ES', 'peso', (SELECT id FROM unidades_medida WHERE codigo = 'KG' LIMIT 1), 1, TRUE),
('ES', 'peso', (SELECT id FROM unidades_medida WHERE codigo = 'G' LIMIT 1), 2, TRUE),
('ES', 'volumen', (SELECT id FROM unidades_medida WHERE codigo = 'L' LIMIT 1), 1, TRUE),
('ES', 'longitud', (SELECT id FROM unidades_medida WHERE codigo = 'M' LIMIT 1), 1, TRUE),
('ES', 'area', (SELECT id FROM unidades_medida WHERE codigo = 'M2' LIMIT 1), 1, TRUE),
('ES', 'unidad', (SELECT id FROM unidades_medida WHERE codigo = 'UN' LIMIT 1), 1, TRUE)
ON DUPLICATE KEY UPDATE
    unidad_medida_id = VALUES(unidad_medida_id),
    prioridad = VALUES(prioridad),
    activo = VALUES(activo);

-- ============================================
-- SECCIÓN 6: TABLA DE CONFIGURACIÓN DE REDONDEO
-- ============================================

-- Tabla para configurar políticas de redondeo por empresa
CREATE TABLE IF NOT EXISTS configuracion_redondeo (
    id INT(11) NOT NULL AUTO_INCREMENT,
    empresa_id INT(11) NULL COMMENT 'NULL = configuración global',
    tipo_dato ENUM('cantidad', 'precio', 'factor', 'porcentaje') NOT NULL,
    modo_redondeo ENUM('HALF_UP', 'HALF_DOWN', 'CEIL', 'FLOOR', 'TRUNCATE') DEFAULT 'HALF_UP',
    precision_decimales INT(11) DEFAULT 2 COMMENT 'Número de decimales',
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_empresa_tipo (empresa_id, tipo_dato),
    INDEX idx_empresa (empresa_id),
    FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insertar configuraciones de redondeo por defecto (globales)
INSERT INTO configuracion_redondeo (empresa_id, tipo_dato, modo_redondeo, precision_decimales, activo) VALUES
(NULL, 'cantidad', 'HALF_UP', 3, TRUE),    -- 3 decimales para cantidades
(NULL, 'precio', 'HALF_UP', 2, TRUE),      -- 2 decimales para precios
(NULL, 'factor', 'HALF_UP', 6, TRUE),      -- 6 decimales para factores de conversión
(NULL, 'porcentaje', 'HALF_UP', 2, TRUE)  -- 2 decimales para porcentajes
ON DUPLICATE KEY UPDATE
    modo_redondeo = VALUES(modo_redondeo),
    precision_decimales = VALUES(precision_decimales),
    activo = VALUES(activo);

-- ============================================
-- SECCIÓN 7: VISTAS PARA FACILITAR CONSULTAS
-- ============================================

-- Vista para obtener conversiones completas (con nombres de unidades)
CREATE OR REPLACE VIEW vista_conversiones_completas AS
SELECT 
    c.id,
    c.empresa_id,
    e.nombre_empresa as empresa_nombre,
    c.unidad_origen_id,
    uo.codigo as unidad_origen_codigo,
    uo.nombre as unidad_origen_nombre,
    uo.abreviatura as unidad_origen_abrev,
    uo.tipo_medida as unidad_origen_tipo,
    c.unidad_destino_id,
    ud.codigo as unidad_destino_codigo,
    ud.nombre as unidad_destino_nombre,
    ud.abreviatura as unidad_destino_abrev,
    ud.tipo_medida as unidad_destino_tipo,
    c.factor,
    c.activo,
    c.fecha_creacion,
    c.fecha_actualizacion
FROM conversiones_unidad c
INNER JOIN unidades_medida uo ON c.unidad_origen_id = uo.id
INNER JOIN unidades_medida ud ON c.unidad_destino_id = ud.id
LEFT JOIN empresas e ON c.empresa_id = e.id;

-- Vista para productos con información completa de unidades
CREATE OR REPLACE VIEW vista_productos_unidades AS
SELECT 
    p.id,
    p.empresa_id,
    p.nombre,
    p.codigo_barras as codigo,
    p.unidad_medida_id,
    um.codigo as unidad_codigo,
    um.nombre as unidad_nombre,
    um.abreviatura as unidad_abrev,
    um.tipo_medida as unidad_tipo,
    um.permite_decimales as unidad_permite_decimales,
    p.precio_por_unidad,
    p.precio_venta,
    p.permite_decimales as producto_permite_decimales,
    p.unidad_venta_default_id,
    umv.codigo as unidad_venta_codigo,
    umv.nombre as unidad_venta_nombre,
    umv.abreviatura as unidad_venta_abrev,
    p.stock,
    p.stock_minimo,
    p.stock_maximo,
    p.activo
FROM productos p
INNER JOIN unidades_medida um ON p.unidad_medida_id = um.id
LEFT JOIN unidades_medida umv ON p.unidad_venta_default_id = umv.id;

COMMIT;

-- ============================================
-- VERIFICACIÓN POST-EJECUCIÓN
-- ============================================

-- Verificar cantidad de unidades creadas
SELECT tipo_medida, COUNT(*) as cantidad
FROM unidades_medida
WHERE activo = TRUE
GROUP BY tipo_medida
ORDER BY tipo_medida;

-- Verificar cantidad de conversiones creadas
SELECT COUNT(*) as total_conversiones
FROM conversiones_unidad
WHERE activo = TRUE;

-- Verificar conversiones por tipo
SELECT 
    um.tipo_medida,
    COUNT(*) as cantidad_conversiones
FROM conversiones_unidad c
INNER JOIN unidades_medida um ON c.unidad_origen_id = um.id
WHERE c.activo = TRUE
GROUP BY um.tipo_medida
ORDER BY um.tipo_medida;

-- Verificar preferencias por país
SELECT 
    pais_codigo,
    COUNT(*) as cantidad_preferencias
FROM unidades_preferidas_pais
WHERE activo = TRUE
GROUP BY pais_codigo
ORDER BY pais_codigo;

-- ============================================
-- INSTRUCCIONES DE USO
-- ============================================

/*
PASOS PARA EJECUTAR ESTE SCRIPT:

1. BACKUP: Hacer backup completo de la base de datos antes de ejecutar
   
2. VERIFICAR: Asegurarse de que la migración básica (migracion_unidades_medida.sql) ya se ejecutó

3. EJECUTAR: Ejecutar este script completo

4. VERIFICAR: Ejecutar las consultas de verificación al final

5. PROBAR: Realizar pruebas de conversión y cálculo de precios

NOTAS IMPORTANTES:

- El script es IDEMPOTENTE: puede ejecutarse múltiples veces sin duplicar datos
- Las conversiones se crean como globales (empresa_id = NULL)
- Para conversiones específicas por empresa, duplicar los INSERT
  cambiando empresa_id = NULL por el ID correspondiente
  
- Las unidades y conversiones cubren:
  * Peso: kg, g, lb, oz, quintal, arroba
  * Volumen: L, ml, gal, qt, pt
  * Longitud: m, cm, ft, in
  * Área: m², ha, tarea
  * Cantidad: unidad, docena, ciento
  * Tiempo: hora, minuto, día
  
- Total de ~60+ unidades de medida
- Total de ~150+ conversiones bidireccionales

PRÓXIMOS PASOS:

1. Implementar las funciones del backend (unidadesGrafoUtils.js)
2. Implementar los componentes del frontend (InputBalanza, etc.)
3. Configurar las alertas por producto según histórico
4. Probar flujo completo de venta
*/

