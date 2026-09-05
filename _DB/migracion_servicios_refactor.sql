-- =====================================================
-- MIGRACIÓN: Refactorización Módulo de Servicios
-- =====================================================
-- Fecha: 2026-01-28
-- Versión: 2.0
-- Descripción: Agrega plantillas, recursos normalizados y eventos
--              para el módulo de servicios según metodología unificada
-- =====================================================

USE punto_venta_rd;

SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;
SET time_zone = "+00:00";

-- =====================================================
-- 1. MODIFICAR TABLA: obras (agregar tipo 'servicio')
-- =====================================================

ALTER TABLE obras 
MODIFY COLUMN tipo_obra ENUM('construccion', 'remodelacion', 'reparacion', 'mantenimiento', 'servicio', 'otro') 
DEFAULT 'construccion' 
COMMENT 'Tipo de obra: incluye servicio para auto-creación de obras contenedoras';

-- =====================================================
-- 2. MODIFICAR TABLA: servicios (agregar nuevos campos)
-- =====================================================

-- Agregar servicio_plantilla_id
SET @preparedStatement = (SELECT IF(
    (
        SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
        WHERE
            (TABLE_SCHEMA = DATABASE())
            AND (TABLE_NAME = "servicios")
            AND (COLUMN_NAME = "servicio_plantilla_id")
    ) > 0,
    "SELECT 1",
    "ALTER TABLE servicios ADD COLUMN servicio_plantilla_id INT(11) COMMENT 'Plantilla desde la cual se creó el servicio' AFTER obra_id"
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Agregar presupuesto_asignado
SET @preparedStatement = (SELECT IF(
    (
        SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
        WHERE
            (TABLE_SCHEMA = DATABASE())
            AND (TABLE_NAME = "servicios")
            AND (COLUMN_NAME = "presupuesto_asignado")
    ) > 0,
    "SELECT 1",
    "ALTER TABLE servicios ADD COLUMN presupuesto_asignado DECIMAL(14,2) DEFAULT 0.00 COMMENT 'Presupuesto asignado al servicio' AFTER costo_real"
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Agregar fecha_inicio
SET @preparedStatement = (SELECT IF(
    (
        SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
        WHERE
            (TABLE_SCHEMA = DATABASE())
            AND (TABLE_NAME = "servicios")
            AND (COLUMN_NAME = "fecha_inicio")
    ) > 0,
    "SELECT 1",
    "ALTER TABLE servicios ADD COLUMN fecha_inicio DATE COMMENT 'Fecha de inicio del servicio' AFTER fecha_programada"
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Agregar fecha_fin_estimada
SET @preparedStatement = (SELECT IF(
    (
        SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
        WHERE
            (TABLE_SCHEMA = DATABASE())
            AND (TABLE_NAME = "servicios")
            AND (COLUMN_NAME = "fecha_fin_estimada")
    ) > 0,
    "SELECT 1",
    "ALTER TABLE servicios ADD COLUMN fecha_fin_estimada DATE COMMENT 'Fecha estimada de finalización' AFTER fecha_inicio"
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Agregar notas_tecnicas
SET @preparedStatement = (SELECT IF(
    (
        SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
        WHERE
            (TABLE_SCHEMA = DATABASE())
            AND (TABLE_NAME = "servicios")
            AND (COLUMN_NAME = "notas_tecnicas")
    ) > 0,
    "SELECT 1",
    "ALTER TABLE servicios ADD COLUMN notas_tecnicas TEXT COMMENT 'Notas técnicas y especificaciones del servicio' AFTER descripcion"
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Agregar índices explícitos (usando prepared statements para compatibilidad)
SET @preparedStatement = (SELECT IF(
    (
        SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
        WHERE
            (TABLE_SCHEMA = DATABASE())
            AND (TABLE_NAME = "servicios")
            AND (INDEX_NAME = "idx_servicios_empresa_estado")
    ) > 0,
    "SELECT 1",
    "CREATE INDEX idx_servicios_empresa_estado ON servicios(empresa_id, estado)"
));
PREPARE createIndexIfNotExists FROM @preparedStatement;
EXECUTE createIndexIfNotExists;
DEALLOCATE PREPARE createIndexIfNotExists;

SET @preparedStatement = (SELECT IF(
    (
        SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
        WHERE
            (TABLE_SCHEMA = DATABASE())
            AND (TABLE_NAME = "servicios")
            AND (INDEX_NAME = "idx_servicios_obra_fecha")
    ) > 0,
    "SELECT 1",
    "CREATE INDEX idx_servicios_obra_fecha ON servicios(obra_id, fecha_inicio)"
));
PREPARE createIndexIfNotExists FROM @preparedStatement;
EXECUTE createIndexIfNotExists;
DEALLOCATE PREPARE createIndexIfNotExists;

SET @preparedStatement = (SELECT IF(
    (
        SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
        WHERE
            (TABLE_SCHEMA = DATABASE())
            AND (TABLE_NAME = "servicios")
            AND (INDEX_NAME = "idx_servicios_plantilla")
    ) > 0,
    "SELECT 1",
    "CREATE INDEX idx_servicios_plantilla ON servicios(servicio_plantilla_id)"
));
PREPARE createIndexIfNotExists FROM @preparedStatement;
EXECUTE createIndexIfNotExists;
DEALLOCATE PREPARE createIndexIfNotExists;

-- =====================================================
-- 3. TABLA: servicios_plantillas
-- =====================================================

CREATE TABLE IF NOT EXISTS servicios_plantillas (
    id INT(11) NOT NULL AUTO_INCREMENT,
    empresa_id INT(11) NOT NULL,
    
    -- Identificación
    codigo_plantilla VARCHAR(50) NOT NULL COMMENT 'Código único de la plantilla',
    nombre VARCHAR(255) NOT NULL COMMENT 'Nombre de la plantilla (ej: Instalación eléctrica)',
    descripcion TEXT COMMENT 'Descripción detallada de la plantilla',
    tipo_servicio ENUM('electrico', 'plomeria', 'pintura', 'reparacion', 'instalacion', 'mantenimiento', 'otro') NOT NULL,
    
    -- Estimaciones base
    duracion_estimada_dias INT(11) NOT NULL DEFAULT 1 COMMENT 'Duración estimada en días',
    costo_base_estimado DECIMAL(14,2) DEFAULT 0.00 COMMENT 'Costo base estimado de la plantilla',
    
    -- Estado
    activa TINYINT(1) DEFAULT 1 COMMENT '1 = plantilla activa, 0 = desactivada',
    
    -- Auditoría
    creado_por INT(11) NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    PRIMARY KEY (id),
    UNIQUE KEY uk_codigo_empresa (codigo_plantilla, empresa_id),
    KEY idx_empresa (empresa_id),
    KEY idx_tipo (tipo_servicio),
    KEY idx_activa (activa),
    
    FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
    FOREIGN KEY (creado_por) REFERENCES usuarios(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 4. TABLA: servicios_plantillas_recursos
-- =====================================================

CREATE TABLE IF NOT EXISTS servicios_plantillas_recursos (
    id INT(11) NOT NULL AUTO_INCREMENT,
    servicio_plantilla_id INT(11) NOT NULL,
    
    -- Tipo de recurso
    tipo_recurso ENUM('material', 'herramienta', 'equipo', 'personal') NOT NULL,
    nombre VARCHAR(255) NOT NULL COMMENT 'Nombre del recurso (ej: Cable eléctrico, Técnico electricista)',
    descripcion TEXT,
    
    -- Cantidad estimada
    cantidad_estimada DECIMAL(10,2) DEFAULT 1.00 COMMENT 'Cantidad estimada del recurso',
    unidad VARCHAR(50) COMMENT 'Unidad de medida (ej: metros, unidades, horas)',
    
    -- Costo estimado (opcional)
    costo_unitario_estimado DECIMAL(10,2) DEFAULT 0.00,
    
    -- Orden de aparición
    orden INT(11) DEFAULT 0 COMMENT 'Orden de visualización',
    
    -- Auditoría
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    PRIMARY KEY (id),
    KEY idx_plantilla (servicio_plantilla_id),
    KEY idx_tipo (tipo_recurso),
    
    FOREIGN KEY (servicio_plantilla_id) REFERENCES servicios_plantillas(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 5. TABLA: servicios_recursos
-- =====================================================

CREATE TABLE IF NOT EXISTS servicios_recursos (
    id INT(11) NOT NULL AUTO_INCREMENT,
    servicio_id INT(11) NOT NULL,
    empresa_id INT(11) NOT NULL,
    
    -- Tipo de recurso
    tipo_recurso ENUM('material', 'herramienta', 'equipo', 'personal') NOT NULL,
    nombre VARCHAR(255) NOT NULL COMMENT 'Nombre del recurso utilizado',
    descripcion TEXT,
    
    -- Cantidad real
    cantidad_utilizada DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    unidad VARCHAR(50) COMMENT 'Unidad de medida',
    
    -- Costo real
    costo_unitario DECIMAL(10,2) DEFAULT 0.00,
    costo_total DECIMAL(14,2) DEFAULT 0.00 COMMENT 'costo_unitario * cantidad_utilizada',
    
    -- Referencia opcional
    producto_id INT(11) COMMENT 'Si es un material del catálogo',
    trabajador_id INT(11) COMMENT 'Si es personal asignado',
    
    -- Auditoría
    registrado_por INT(11) NOT NULL,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    PRIMARY KEY (id),
    KEY idx_servicio (servicio_id),
    KEY idx_empresa (empresa_id),
    KEY idx_tipo (tipo_recurso),
    KEY idx_producto (producto_id),
    KEY idx_trabajador (trabajador_id),
    
    FOREIGN KEY (servicio_id) REFERENCES servicios(id) ON DELETE CASCADE,
    FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
    FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE SET NULL,
    FOREIGN KEY (trabajador_id) REFERENCES trabajadores_obra(id) ON DELETE SET NULL,
    FOREIGN KEY (registrado_por) REFERENCES usuarios(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 6. TABLA: servicios_eventos
-- =====================================================

CREATE TABLE IF NOT EXISTS servicios_eventos (
    id INT(11) NOT NULL AUTO_INCREMENT,
    servicio_id INT(11) NOT NULL,
    empresa_id INT(11) NOT NULL,
    
    -- Tipo de evento
    tipo_evento ENUM(
        'CREADO',
        'PROGRAMADO',
        'INICIADO',
        'AVANCE',
        'INCIDENCIA',
        'PAUSADO',
        'FINALIZADO',
        'CANCELADO'
    ) NOT NULL,
    
    -- Descripción
    descripcion TEXT COMMENT 'Descripción del evento',
    porcentaje_avance DECIMAL(5,2) COMMENT 'Porcentaje de avance si aplica',
    
    -- Fecha del evento
    fecha_evento TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha y hora del evento',
    
    -- Usuario que generó el evento
    usuario_id INT(11) NOT NULL COMMENT 'Usuario que registró el evento',
    
    -- Datos adicionales (JSON opcional)
    datos_adicionales JSON COMMENT 'Datos adicionales del evento en formato JSON',
    
    PRIMARY KEY (id),
    KEY idx_servicio (servicio_id),
    KEY idx_empresa (empresa_id),
    KEY idx_tipo (tipo_evento),
    KEY idx_fecha (fecha_evento),
    KEY idx_servicio_fecha (servicio_id, fecha_evento),
    KEY idx_usuario (usuario_id),
    
    FOREIGN KEY (servicio_id) REFERENCES servicios(id) ON DELETE CASCADE,
    FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 7. AGREGAR FOREIGN KEY para servicio_plantilla_id
-- =====================================================

-- Verificar si existe la FK antes de agregarla
SET @preparedStatement = (SELECT IF(
    (
        SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
        WHERE
            (TABLE_SCHEMA = DATABASE())
            AND (TABLE_NAME = "servicios")
            AND (CONSTRAINT_NAME = "fk_servicio_plantilla")
    ) > 0,
    "SELECT 1",
    "ALTER TABLE servicios ADD CONSTRAINT fk_servicio_plantilla FOREIGN KEY (servicio_plantilla_id) REFERENCES servicios_plantillas(id) ON DELETE SET NULL"
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- =====================================================
-- 8. DATOS INICIALES: Plantillas de ejemplo
-- =====================================================

-- Nota: Estas plantillas se crearán por empresa al ejecutar la migración
-- Se pueden insertar manualmente o mediante un script de inicialización

-- Ejemplo de inserción (comentado, se ejecutará por empresa):

INSERT INTO servicios_plantillas 
(empresa_id, codigo_plantilla, nombre, descripcion, tipo_servicio, duracion_estimada_dias, costo_base_estimado, creado_por)
VALUES
(1, 'SER-001', 'Instalación eléctrica', 'Instalación completa de sistema eléctrico', 'electrico', 15, 18000.00, 1),
(1, 'SER-002', 'Pintura interior', 'Pintura de interiores con acabado estándar', 'pintura', 7, 8500.00, 1),
(1, 'SER-003', 'Instalación sanitaria', 'Instalación de sistema sanitario completo', 'plomeria', 10, 12000.00, 1);


COMMIT;
SET FOREIGN_KEY_CHECKS = 1;

-- =====================================================
-- FIN DE MIGRACIÓN
-- =====================================================

