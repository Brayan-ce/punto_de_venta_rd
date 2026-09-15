-- =====================================================
-- MIGRACIÓN: Completar Estructura de Proyectos
-- =====================================================
-- Fecha: 2026-01-21
-- Descripción: Agrega campos faltantes y estructura de presupuestos
--              según los requisitos del sistema de construcción
-- =====================================================

-- =====================================================
-- 1. AGREGAR CAMPOS FALTANTES A TABLA proyectos
-- =====================================================

-- Verificar y agregar forma_pago
SET @columna_existe = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'proyectos'

    AND COLUMN_NAME = 'forma_pago'
);


SET @sql = IF(@columna_existe = 0, 
    'ALTER TABLE proyectos ADD COLUMN forma_pago VARCHAR(50) NULL COMMENT ''Forma de pago del proyecto (efectivo, transferencia, cheque, etc.)'' AFTER ubicacion',
    'SELECT 1'
);


PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Verificar y agregar tags (JSON para flexibilidad)
SET @columna_existe = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'proyectos'
    AND COLUMN_NAME = 'tags'
);

SET @sql = IF(@columna_existe = 0, 
    'ALTER TABLE proyectos ADD COLUMN tags JSON NULL COMMENT ''Etiquetas del proyecto para filtrado y organización'' AFTER forma_pago',
    'SELECT 1'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- =====================================================
-- 2. TABLA: presupuestos
-- =====================================================
-- Un proyecto u obra puede tener múltiples presupuestos
-- (presupuesto inicial, revisión, ajuste, etc.)

CREATE TABLE IF NOT EXISTS presupuestos (
    id INT(11) NOT NULL AUTO_INCREMENT,
    empresa_id INT(11) NOT NULL,
    
    -- Relación polimórfica: puede ser de proyecto u obra
    tipo_destino ENUM('proyecto', 'obra', 'servicio') NOT NULL,
    destino_id INT(11) NOT NULL COMMENT 'ID del proyecto, obra o servicio',
    
    -- Identificación
    nombre VARCHAR(255) NOT NULL COMMENT 'Nombre del presupuesto (ej: Presupuesto Inicial, Revisión 1)',
    descripcion TEXT COMMENT 'Descripción del presupuesto',
    version INT(11) NOT NULL DEFAULT 1 COMMENT 'Versión del presupuesto',
    
    -- Totales
    subtotal DECIMAL(14,2) NOT NULL DEFAULT 0.00 COMMENT 'Subtotal sin impuestos',
    impuestos DECIMAL(14,2) DEFAULT 0.00 COMMENT 'Total de impuestos',
    descuento DECIMAL(14,2) DEFAULT 0.00 COMMENT 'Descuento total',
    total DECIMAL(14,2) NOT NULL DEFAULT 0.00 COMMENT 'Total del presupuesto',
    
    -- Estado
    estado ENUM('borrador', 'enviado', 'aprobado', 'rechazado', 'vigente', 'obsoleto') DEFAULT 'borrador',
    es_activo TINYINT(1) DEFAULT 1 COMMENT 'Si es el presupuesto activo/vigente',
    
    -- Fechas
    fecha_emision DATE COMMENT 'Fecha de emisión del presupuesto',
    fecha_vencimiento DATE COMMENT 'Fecha de vencimiento del presupuesto',
    fecha_aprobacion DATE COMMENT 'Fecha de aprobación',
    
    -- Auditoría
    creado_por INT(11) NOT NULL,
    aprobado_por INT(11) COMMENT 'Usuario que aprobó el presupuesto',
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    PRIMARY KEY (id),
    KEY idx_empresa (empresa_id),
    KEY idx_destino (tipo_destino, destino_id),
    KEY idx_estado (estado),
    KEY idx_activo (es_activo),
    KEY idx_fecha_emision (fecha_emision),
    KEY creado_por_idx (creado_por),
    
    FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
    FOREIGN KEY (creado_por) REFERENCES usuarios(id),
    FOREIGN KEY (aprobado_por) REFERENCES usuarios(id) ON DELETE SET NULL,
    
    -- Nota: No podemos usar UNIQUE con es_activo porque MySQL no soporta

    -- UNIQUE condicional. Se debe validar en la aplicación que solo haya
    -- un presupuesto activo por destino.
    KEY idx_destino_activo (tipo_destino, destino_id, es_activo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Presupuestos de proyectos, obras y servicios';

-- =====================================================
-- 3. TABLA: presupuesto_capitulos
-- =====================================================
-- Capítulos o niveles del presupuesto (ej: Demoliciones, Revestimientos)

CREATE TABLE IF NOT EXISTS presupuesto_capitulos (
    id INT(11) NOT NULL AUTO_INCREMENT,
    presupuesto_id INT(11) NOT NULL,
    empresa_id INT(11) NOT NULL,
    
    -- Identificación
    codigo VARCHAR(50) COMMENT 'Código del capítulo (ej: 01, 02, 03)',
    nombre VARCHAR(255) NOT NULL COMMENT 'Nombre del capítulo (ej: Demoliciones, Revestimientos)',
    descripcion TEXT COMMENT 'Descripción del capítulo',
    
    -- Orden y organización
    orden INT(11) NOT NULL DEFAULT 0 COMMENT 'Orden de visualización',
    nivel INT(11) DEFAULT 1 COMMENT 'Nivel de anidación (1, 2, 3...)',
    capitulo_padre_id INT(11) COMMENT 'Capítulo padre si es subcapítulo',
    
    -- Totales del capítulo
    subtotal DECIMAL(14,2) DEFAULT 0.00 COMMENT 'Subtotal del capítulo (suma de tareas)',
    impuestos DECIMAL(14,2) DEFAULT 0.00,
    total DECIMAL(14,2) DEFAULT 0.00 COMMENT 'Total del capítulo',
    
    -- Auditoría
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    PRIMARY KEY (id),
    KEY idx_presupuesto (presupuesto_id),
    KEY idx_empresa (empresa_id),
    KEY idx_orden (presupuesto_id, orden),
    KEY idx_padre (capitulo_padre_id),
    
    FOREIGN KEY (presupuesto_id) REFERENCES presupuestos(id) ON DELETE CASCADE,
    FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
    FOREIGN KEY (capitulo_padre_id) REFERENCES presupuesto_capitulos(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Capítulos o niveles de presupuesto';

-- =====================================================
-- 4. TABLA: presupuesto_tareas
-- =====================================================
-- Tareas o partidas dentro de cada capítulo

CREATE TABLE IF NOT EXISTS presupuesto_tareas (
    id INT(11) NOT NULL AUTO_INCREMENT,
    presupuesto_id INT(11) NOT NULL,
    capitulo_id INT(11) NOT NULL,
    empresa_id INT(11) NOT NULL,
    
    -- Identificación
    codigo VARCHAR(50) COMMENT 'Código de la tarea (ej: 01.01, 01.02)',
    nombre VARCHAR(255) NOT NULL COMMENT 'Nombre de la tarea (ej: Demolición de revestimientos)',
    descripcion TEXT COMMENT 'Descripción detallada de la tarea',
    
    -- Unidad y cantidad
    unidad_medida VARCHAR(50) NOT NULL COMMENT 'Unidad de medida (m², m³, unidad, etc.)',
    cantidad DECIMAL(10,3) NOT NULL DEFAULT 1.000 COMMENT 'Cantidad',
    
    -- Precios
    precio_unitario_coste DECIMAL(14,2) NOT NULL DEFAULT 0.00 COMMENT 'Precio de coste unitario',
    precio_unitario_venta DECIMAL(14,2) NOT NULL DEFAULT 0.00 COMMENT 'Precio de venta unitario',
    margen_porcentaje DECIMAL(5,2) DEFAULT 0.00 COMMENT 'Margen de ganancia (%)',
    
    -- Totales
    subtotal_coste DECIMAL(14,2) NOT NULL DEFAULT 0.00 COMMENT 'Subtotal coste (cantidad * precio_coste)',
    subtotal_venta DECIMAL(14,2) NOT NULL DEFAULT 0.00 COMMENT 'Subtotal venta (cantidad * precio_venta)',
    descuento DECIMAL(14,2) DEFAULT 0.00 COMMENT 'Descuento aplicado',
    impuestos DECIMAL(14,2) DEFAULT 0.00 COMMENT 'Impuestos',
    total DECIMAL(14,2) NOT NULL DEFAULT 0.00 COMMENT 'Total de la tarea',
    
    -- Referencias
    producto_id INT(11) COMMENT 'Si la tarea está vinculada a un producto del catálogo',
    material_id INT(11) COMMENT 'Si la tarea está vinculada a un material del catálogo',
    
    -- Orden
    orden INT(11) NOT NULL DEFAULT 0 COMMENT 'Orden dentro del capítulo',
    
    -- Auditoría
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    PRIMARY KEY (id),
    KEY idx_presupuesto (presupuesto_id),
    KEY idx_capitulo (capitulo_id),
    KEY idx_empresa (empresa_id),
    KEY idx_orden (capitulo_id, orden),
    KEY idx_producto (producto_id),
    KEY idx_material (material_id),
    
    FOREIGN KEY (presupuesto_id) REFERENCES presupuestos(id) ON DELETE CASCADE,
    FOREIGN KEY (capitulo_id) REFERENCES presupuesto_capitulos(id) ON DELETE CASCADE,
    FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
    FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE SET NULL,
    FOREIGN KEY (material_id) REFERENCES materiales_catalogo(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Tareas o partidas de presupuesto';

-- =====================================================
-- 5. TABLA: proyecto_documentos
-- =====================================================
-- Gestión documental del proyecto (imágenes, documentos, etc.)

CREATE TABLE IF NOT EXISTS proyecto_documentos (
    id INT(11) NOT NULL AUTO_INCREMENT,
    proyecto_id INT(11) NOT NULL,
    empresa_id INT(11) NOT NULL,
    
    -- Tipo de documento
    tipo ENUM('imagen', 'documento', 'video', 'plano', 'contrato', 'factura', 'otro') NOT NULL DEFAULT 'documento',
    categoria VARCHAR(100) COMMENT 'Categoría del documento (inicio, avance, final, etc.)',
    
    -- Archivo
    nombre_archivo VARCHAR(255) NOT NULL,
    ruta_archivo VARCHAR(500) NOT NULL,
    tipo_mime VARCHAR(50),
    tamano_bytes INT(11),
    extension VARCHAR(10),
    
    -- Metadatos
    descripcion TEXT,
    visible_cliente TINYINT(1) DEFAULT 0 COMMENT 'Si el documento es visible para el cliente',
    
    -- Auditoría
    subido_por INT(11) NOT NULL,
    fecha_subida TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    PRIMARY KEY (id),
    KEY idx_proyecto (proyecto_id),
    KEY idx_empresa (empresa_id),
    KEY idx_tipo (tipo),
    KEY idx_categoria (categoria),
    KEY subido_por_idx (subido_por),
    
    FOREIGN KEY (proyecto_id) REFERENCES proyectos(id) ON DELETE CASCADE,
    FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
    FOREIGN KEY (subido_por) REFERENCES usuarios(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Documentos e imágenes asociados a proyectos';

-- =====================================================
-- 6. TABLA: proyecto_historial
-- =====================================================
-- Historial de cambios del proyecto para auditoría

CREATE TABLE IF NOT EXISTS proyecto_historial (
    id BIGINT(20) NOT NULL AUTO_INCREMENT,
    proyecto_id INT(11) NOT NULL,
    empresa_id INT(11) NOT NULL,
    
    -- Tipo de cambio
    tipo_cambio ENUM('creado', 'editado', 'estado_cambiado', 'presupuesto_agregado', 'obra_agregada', 'servicio_agregado', 'documento_agregado', 'nota_agregada') NOT NULL,
    
    -- Detalles del cambio
    campo_modificado VARCHAR(100) COMMENT 'Campo que se modificó',
    valor_anterior TEXT COMMENT 'Valor anterior',
    valor_nuevo TEXT COMMENT 'Valor nuevo',
    descripcion TEXT COMMENT 'Descripción del cambio',
    
    -- Auditoría
    usuario_id INT(11) NOT NULL,
    fecha_cambio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45),
    user_agent TEXT,
    
    PRIMARY KEY (id),
    KEY idx_proyecto (proyecto_id),
    KEY idx_empresa (empresa_id),
    KEY idx_tipo (tipo_cambio),
    KEY idx_usuario (usuario_id),
    KEY idx_fecha (fecha_cambio),
    
    FOREIGN KEY (proyecto_id) REFERENCES proyectos(id) ON DELETE CASCADE,
    FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Historial de cambios de proyectos';

-- =====================================================
-- 7. ÍNDICES ADICIONALES PARA OPTIMIZACIÓN
-- =====================================================

-- Índice compuesto para búsqueda de proyectos por empresa y estado
SET @index_exists = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.STATISTICS 
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'proyectos'
    AND INDEX_NAME = 'idx_empresa_estado'
);

SET @sql = IF(@index_exists = 0, 
    'ALTER TABLE proyectos ADD INDEX idx_empresa_estado (empresa_id, estado)',
    'SELECT 1'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Índice para búsqueda por forma de pago
SET @index_exists = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.STATISTICS 
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'proyectos'
    AND INDEX_NAME = 'idx_forma_pago'
);

SET @sql = IF(@index_exists = 0, 
    'ALTER TABLE proyectos ADD INDEX idx_forma_pago (forma_pago)',
    'SELECT 1'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Índice para búsqueda por tags (si se usa JSON)
-- Nota: MySQL 5.7+ soporta índices en JSON, pero requiere sintaxis especial
-- ALTER TABLE proyectos ADD INDEX idx_tags ((CAST(tags AS CHAR(255) ARRAY)));

-- =====================================================
-- 8. TRIGGERS PARA ACTUALIZACIÓN AUTOMÁTICA
-- =====================================================

-- Eliminar triggers si existen (para evitar errores en re-ejecución)
DROP TRIGGER IF EXISTS trg_actualizar_capitulo_total_insert;
DROP TRIGGER IF EXISTS trg_actualizar_capitulo_total_update;
DROP TRIGGER IF EXISTS trg_actualizar_capitulo_total_delete;
DROP TRIGGER IF EXISTS trg_actualizar_presupuesto_total_insert;
DROP TRIGGER IF EXISTS trg_actualizar_presupuesto_total_update;
DROP TRIGGER IF EXISTS trg_actualizar_presupuesto_total_delete;
DROP TRIGGER IF EXISTS trg_proyecto_historial_update;

-- Trigger: Actualizar totales de capítulo cuando se INSERTA una tarea
DELIMITER $$

CREATE TRIGGER trg_actualizar_capitulo_total_insert
AFTER INSERT ON presupuesto_tareas
FOR EACH ROW
BEGIN
    UPDATE presupuesto_capitulos
    SET subtotal = (
        SELECT COALESCE(SUM(subtotal_venta), 0)
        FROM presupuesto_tareas
        WHERE capitulo_id = NEW.capitulo_id
    ),
    total = (
        SELECT COALESCE(SUM(total), 0)
        FROM presupuesto_tareas
        WHERE capitulo_id = NEW.capitulo_id
    )
    WHERE id = NEW.capitulo_id;
END$$

-- Trigger: Actualizar totales de capítulo cuando se ACTUALIZA una tarea
CREATE TRIGGER trg_actualizar_capitulo_total_update
AFTER UPDATE ON presupuesto_tareas
FOR EACH ROW
BEGIN
    -- Actualizar capítulo nuevo
    UPDATE presupuesto_capitulos
    SET subtotal = (
        SELECT COALESCE(SUM(subtotal_venta), 0)
        FROM presupuesto_tareas
        WHERE capitulo_id = NEW.capitulo_id
    ),
    total = (
        SELECT COALESCE(SUM(total), 0)
        FROM presupuesto_tareas
        WHERE capitulo_id = NEW.capitulo_id
    )
    WHERE id = NEW.capitulo_id;
    
    -- Si cambió de capítulo, actualizar el anterior también
    IF (OLD.capitulo_id != NEW.capitulo_id) THEN
        UPDATE presupuesto_capitulos
        SET subtotal = (
            SELECT COALESCE(SUM(subtotal_venta), 0)
            FROM presupuesto_tareas
            WHERE capitulo_id = OLD.capitulo_id
        ),
        total = (
            SELECT COALESCE(SUM(total), 0)
            FROM presupuesto_tareas
            WHERE capitulo_id = OLD.capitulo_id
        )
        WHERE id = OLD.capitulo_id;
    END IF;
END$$

-- Trigger: Actualizar totales de capítulo cuando se ELIMINA una tarea
CREATE TRIGGER trg_actualizar_capitulo_total_delete
AFTER DELETE ON presupuesto_tareas
FOR EACH ROW
BEGIN
    UPDATE presupuesto_capitulos
    SET subtotal = (
        SELECT COALESCE(SUM(subtotal_venta), 0)
        FROM presupuesto_tareas
        WHERE capitulo_id = OLD.capitulo_id
    ),
    total = (
        SELECT COALESCE(SUM(total), 0)
        FROM presupuesto_tareas
        WHERE capitulo_id = OLD.capitulo_id
    )
    WHERE id = OLD.capitulo_id;
END$$

-- Trigger: Actualizar totales de presupuesto cuando se INSERTA un capítulo
CREATE TRIGGER trg_actualizar_presupuesto_total_insert
AFTER INSERT ON presupuesto_capitulos
FOR EACH ROW
BEGIN
    UPDATE presupuestos
    SET subtotal = (
        SELECT COALESCE(SUM(subtotal), 0)
        FROM presupuesto_capitulos
        WHERE presupuesto_id = NEW.presupuesto_id
    ),
    total = (
        SELECT COALESCE(SUM(total), 0)
        FROM presupuesto_capitulos
        WHERE presupuesto_id = NEW.presupuesto_id
    )
    WHERE id = NEW.presupuesto_id;
END$$

-- Trigger: Actualizar totales de presupuesto cuando se ACTUALIZA un capítulo
CREATE TRIGGER trg_actualizar_presupuesto_total_update
AFTER UPDATE ON presupuesto_capitulos
FOR EACH ROW
BEGIN
    UPDATE presupuestos
    SET subtotal = (
        SELECT COALESCE(SUM(subtotal), 0)
        FROM presupuesto_capitulos
        WHERE presupuesto_id = NEW.presupuesto_id
    ),
    total = (
        SELECT COALESCE(SUM(total), 0)
        FROM presupuesto_capitulos
        WHERE presupuesto_id = NEW.presupuesto_id
    )
    WHERE id = NEW.presupuesto_id;
END$$

-- Trigger: Actualizar totales de presupuesto cuando se ELIMINA un capítulo
CREATE TRIGGER trg_actualizar_presupuesto_total_delete
AFTER DELETE ON presupuesto_capitulos
FOR EACH ROW
BEGIN
    UPDATE presupuestos
    SET subtotal = (
        SELECT COALESCE(SUM(subtotal), 0)
        FROM presupuesto_capitulos
        WHERE presupuesto_id = OLD.presupuesto_id
    ),
    total = (
        SELECT COALESCE(SUM(total), 0)
        FROM presupuesto_capitulos
        WHERE presupuesto_id = OLD.presupuesto_id
    )
    WHERE id = OLD.presupuesto_id;
END$$

-- Trigger: Registrar cambios en proyecto_historial
CREATE TRIGGER trg_proyecto_historial_update
AFTER UPDATE ON proyectos
FOR EACH ROW
BEGIN
    -- Registrar cambio de nombre
    IF (OLD.nombre != NEW.nombre) THEN
        INSERT INTO proyecto_historial (
            proyecto_id, empresa_id, tipo_cambio,
            campo_modificado, valor_anterior, valor_nuevo,
            usuario_id
        ) VALUES (
            NEW.id, NEW.empresa_id, 'editado',
            'nombre', OLD.nombre, NEW.nombre,
            NEW.creado_por
        );
    END IF;
    
    -- Registrar cambio de estado
    IF (OLD.estado != NEW.estado) THEN
        INSERT INTO proyecto_historial (
            proyecto_id, empresa_id, tipo_cambio,
            campo_modificado, valor_anterior, valor_nuevo,
            usuario_id
        ) VALUES (
            NEW.id, NEW.empresa_id, 'estado_cambiado',
            'estado', OLD.estado, NEW.estado,
            NEW.creado_por
        );
    END IF;
    
    -- Registrar cambio de presupuesto
    IF (OLD.presupuesto_total != NEW.presupuesto_total) THEN
        INSERT INTO proyecto_historial (
            proyecto_id, empresa_id, tipo_cambio,
            campo_modificado, valor_anterior, valor_nuevo,
            usuario_id
        ) VALUES (
            NEW.id, NEW.empresa_id, 'editado',
            'presupuesto_total', OLD.presupuesto_total, NEW.presupuesto_total,
            NEW.creado_por
        );
    END IF;
END$$

DELIMITER ;

-- =====================================================
-- 9. VISTAS ÚTILES
-- =====================================================

-- Vista: Resumen de presupuestos por proyecto
CREATE OR REPLACE VIEW v_proyectos_presupuestos AS
SELECT 
    p.id AS proyecto_id,
    p.nombre AS proyecto_nombre,
    p.codigo_proyecto,
    COUNT(DISTINCT pr.id) AS total_presupuestos,
    COUNT(DISTINCT CASE WHEN pr.es_activo = 1 THEN pr.id END) AS presupuestos_activos,
    COALESCE(SUM(CASE WHEN pr.es_activo = 1 THEN pr.total END), 0) AS presupuesto_activo_total,
    COALESCE(SUM(pr.total), 0) AS presupuesto_total_general
FROM proyectos p
LEFT JOIN presupuestos pr ON pr.tipo_destino = 'proyecto' AND pr.destino_id = p.id
GROUP BY p.id, p.nombre, p.codigo_proyecto;

-- Vista: Resumen de obras y servicios por proyecto
CREATE OR REPLACE VIEW v_proyectos_resumen AS
SELECT 
    p.id AS proyecto_id,
    p.nombre AS proyecto_nombre,
    p.codigo_proyecto,
    p.estado AS proyecto_estado,
    COUNT(DISTINCT o.id) AS total_obras,
    COUNT(DISTINCT s.id) AS total_servicios,
    COALESCE(SUM(o.presupuesto_aprobado), 0) AS presupuesto_obras,
    COALESCE(SUM(o.costo_ejecutado), 0) AS costo_ejecutado_obras,
    COALESCE(SUM(s.costo_real), 0) AS costo_servicios,
    COALESCE(SUM(o.presupuesto_aprobado) + SUM(s.presupuesto_asignado), 0) AS presupuesto_total,
    COALESCE(SUM(o.costo_ejecutado) + SUM(s.costo_real), 0) AS costo_ejecutado_total
FROM proyectos p
LEFT JOIN obras o ON o.proyecto_id = p.id
LEFT JOIN servicios s ON s.proyecto_id = p.id
GROUP BY p.id, p.nombre, p.codigo_proyecto, p.estado;

-- =====================================================
-- 10. DATOS INICIALES (OPCIONAL)
-- =====================================================

-- Insertar registro de historial para proyectos existentes
-- (solo si no existe ya)
INSERT INTO proyecto_historial (
    proyecto_id, empresa_id, tipo_cambio,
    descripcion, usuario_id
)
SELECT 
    id, empresa_id, 'creado',
    'Proyecto creado antes de la migración', creado_por
FROM proyectos
WHERE id NOT IN (
    SELECT DISTINCT proyecto_id 
    FROM proyecto_historial 
    WHERE tipo_cambio = 'creado'
);

-- =====================================================
-- FIN DE LA MIGRACIÓN
-- =====================================================

-- Verificar que las tablas se crearon correctamente
SELECT 
    'Migración completada' AS estado,
    COUNT(*) AS total_tablas_creadas
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_SCHEMA = DATABASE()
AND TABLE_NAME IN (
    'presupuestos',
    'presupuesto_capitulos',
    'presupuesto_tareas',
    'proyecto_documentos',
    'proyecto_historial'
);

-- Mostrar estructura de proyectos actualizada
DESCRIBE proyectos;

