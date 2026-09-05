-- =====================================================
-- MIGRACIÓN: Sistema de Plantillas de Proyectos
-- =====================================================
-- Fecha: 2026-01-21
-- 
-- Objetivo: Crear tabla para almacenar plantillas de proyectos
-- que permitan crear proyectos con estructura predefinida
-- (obras, presupuestos, capítulos y tareas)
-- =====================================================

-- =====================================================
-- TABLA: plantillas_proyecto
-- =====================================================

CREATE TABLE IF NOT EXISTS plantillas_proyecto (
    id INT(11) NOT NULL AUTO_INCREMENT,
    empresa_id INT(11) NOT NULL,
    
    -- Identificación
    nombre VARCHAR(255) NOT NULL COMMENT 'Nombre de la plantilla (ej: Vivienda Unifamiliar)',
    descripcion TEXT COMMENT 'Descripción de la plantilla',
    tipo_plantilla ENUM('vivienda', 'comercial', 'servicios', 'vacio', 'otro') DEFAULT 'otro' COMMENT 'Tipo de plantilla para categorización',
    
    -- Estructura JSON
    estructura_json JSON NOT NULL COMMENT 'Estructura completa de obras, presupuestos, capítulos y tareas',
    
    -- Estado
    activa TINYINT(1) DEFAULT 1 COMMENT 'Si la plantilla está activa y disponible',
    
    -- Auditoría
    creado_por INT(11) NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    PRIMARY KEY (id),
    KEY idx_empresa (empresa_id),
    KEY idx_tipo (tipo_plantilla),
    KEY idx_activa (activa),
    KEY idx_creado_por (creado_por),
    
    FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
    FOREIGN KEY (creado_por) REFERENCES usuarios(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Plantillas de proyectos para crear estructura predefinida';

-- =====================================================
-- ÍNDICES ADICIONALES
-- =====================================================

-- Índice compuesto para búsqueda rápida de plantillas activas por empresa
CREATE INDEX idx_empresa_activa ON plantillas_proyecto(empresa_id, activa);

-- =====================================================
-- NOTAS SOBRE LA ESTRUCTURA JSON
-- =====================================================
-- 
-- La estructura JSON debe seguir este formato:
-- 
-- {
--   "obras": [
--     {
--       "nombre": "Obra Principal",
--       "tipo_obra": "construccion",
--       "descripcion": "Descripción opcional de la obra",
--       "presupuestos": [
--         {
--           "nombre": "Presupuesto Inicial",
--           "descripcion": "Descripción opcional",
--           "capitulos": [
--             {
--               "codigo": "01",
--               "nombre": "Movimiento de tierra",
--               "descripcion": "Descripción opcional",
--               "orden": 1,
--               "tareas": [
--                 {
--                   "codigo": "01.01",
--                   "nombre": "Excavación",
--                   "descripcion": "Descripción opcional",
--                   "unidad_medida": "m³",
--                   "cantidad": 100.000,
--                   "precio_unitario_coste": 0.00,
--                   "precio_unitario_venta": 500.00,
--                   "margen_porcentaje": 0.00,
--                   "orden": 1
--                 }
--               ]
--             }
--           ]
--         }
--       ]
--     }
--   ]
-- }
-- 
-- Campos opcionales en obras:
-- - descripcion, tipo_obra (default: 'construccion')
-- 
-- Campos opcionales en presupuestos:
-- - descripcion
-- 
-- Campos opcionales en capítulos:
-- - codigo, descripcion, orden (default: 0)
-- 
-- Campos opcionales en tareas:
-- - codigo, descripcion, precio_unitario_coste (default: 0.00),
--   margen_porcentaje (default: 0.00), orden (default: 0)
-- 
-- Campos requeridos:
-- - obras[].nombre
-- - obras[].presupuestos[].nombre
-- - obras[].presupuestos[].capitulos[].nombre
-- - obras[].presupuestos[].capitulos[].tareas[].nombre
-- - obras[].presupuestos[].capitulos[].tareas[].unidad_medida
-- - obras[].presupuestos[].capitulos[].tareas[].cantidad
-- - obras[].presupuestos[].capitulos[].tareas[].precio_unitario_venta

