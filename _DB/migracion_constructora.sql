-- =====================================================
-- MIGRACIÓN: Módulo de Control de Obras y Costos
-- =====================================================
-- Fecha: 2026-01-26
-- Versión: 1.0
-- Descripción: Crea todas las tablas necesarias para el
--              módulo completo de construcción
-- =====================================================

USE punto_venta_rd;

SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;
SET time_zone = "+00:00";

-- =====================================================
-- 1. EXTENSIÓN DE TABLA USUARIOS
-- =====================================================

-- Agregar campo system_mode si no existe
SET @dbname = DATABASE();
SET @tablename = "usuarios";
SET @preparedStatement = (SELECT IF(
    (
        SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
        WHERE
            (TABLE_SCHEMA = @dbname)
            AND (TABLE_NAME = @tablename)
            AND (COLUMN_NAME = "system_mode")
    ) > 0,
    "SELECT 1",
    CONCAT("ALTER TABLE ", @tablename, " ADD COLUMN system_mode ENUM('POS', 'OBRAS') DEFAULT 'POS' COMMENT 'Modo de operación del usuario: POS o OBRAS'")
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Crear índice si no existe (compatible con versiones antiguas de MySQL)
SET @preparedStatement = (SELECT IF(
    (
        SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
        WHERE
            (TABLE_SCHEMA = @dbname)
            AND (TABLE_NAME = @tablename)
            AND (INDEX_NAME = "idx_usuarios_system_mode")
    ) > 0,
    "SELECT 1",
    "CREATE INDEX idx_usuarios_system_mode ON usuarios(system_mode)"
));
PREPARE createIndexIfNotExists FROM @preparedStatement;
EXECUTE createIndexIfNotExists;
DEALLOCATE PREPARE createIndexIfNotExists;

-- =====================================================
-- 2. TABLA: proyectos
-- =====================================================

CREATE TABLE IF NOT EXISTS proyectos (
    id INT(11) NOT NULL AUTO_INCREMENT,
    empresa_id INT(11) NOT NULL,
    codigo_proyecto VARCHAR(50) NOT NULL COMMENT 'Código único del proyecto',
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    cliente_id INT(11) COMMENT 'Cliente asociado al proyecto',
    ubicacion TEXT COMMENT 'Ubicación general del proyecto',
    
    -- Control presupuestario
    presupuesto_total DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    costo_ejecutado DECIMAL(14,2) DEFAULT 0.00,
    
    -- Fechas
    fecha_inicio DATE NOT NULL,
    fecha_fin_estimada DATE NOT NULL,
    fecha_fin_real DATE,
    
    -- Estado y control
    estado ENUM('planificacion', 'activo', 'suspendido', 'finalizado', 'cancelado') DEFAULT 'planificacion',
    prioridad ENUM('baja', 'media', 'alta', 'urgente') DEFAULT 'media',
    
    -- Responsables
    usuario_responsable_id INT(11) COMMENT 'Usuario responsable del proyecto',
    
    -- Auditoría
    creado_por INT(11) NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    PRIMARY KEY (id),
    UNIQUE KEY uk_codigo_empresa (codigo_proyecto, empresa_id),
    KEY idx_empresa (empresa_id),
    KEY idx_cliente (cliente_id),
    KEY idx_estado (estado),
    KEY idx_responsable (usuario_responsable_id),
    KEY idx_fechas (fecha_inicio, fecha_fin_estimada),
    
    FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
    FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE SET NULL,
    FOREIGN KEY (usuario_responsable_id) REFERENCES usuarios(id) ON DELETE SET NULL,
    FOREIGN KEY (creado_por) REFERENCES usuarios(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 3. TABLA: obras
-- =====================================================

CREATE TABLE IF NOT EXISTS obras (
    id INT(11) NOT NULL AUTO_INCREMENT,
    empresa_id INT(11) NOT NULL,
    proyecto_id INT(11) COMMENT 'Proyecto al que pertenece (opcional)',
    
    -- Identificación
    codigo_obra VARCHAR(50) NOT NULL COMMENT 'Código único de la obra',
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    tipo_obra ENUM('construccion', 'remodelacion', 'reparacion', 'mantenimiento', 'otro') DEFAULT 'construccion',
    
    -- Ubicación
    ubicacion VARCHAR(255) NOT NULL COMMENT 'Dirección o ubicación de la obra',
    zona VARCHAR(100) COMMENT 'Zona o sector',
    municipio VARCHAR(100),
    provincia VARCHAR(100),
    coordenadas_gps VARCHAR(100) COMMENT 'Lat,Lng para geolocalización',
    
    -- Presupuesto
    presupuesto_aprobado DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    costo_mano_obra DECIMAL(14,2) DEFAULT 0.00,
    costo_materiales DECIMAL(14,2) DEFAULT 0.00,
    costo_servicios DECIMAL(14,2) DEFAULT 0.00,
    costo_imprevistos DECIMAL(14,2) DEFAULT 0.00,
    costo_total DECIMAL(14,2) DEFAULT 0.00,
    costo_ejecutado DECIMAL(14,2) DEFAULT 0.00,
    
    -- Fechas
    fecha_inicio DATE NOT NULL,
    fecha_fin_estimada DATE NOT NULL,
    fecha_fin_real DATE,
    
    -- Estado y control
    estado ENUM('planificacion', 'activa', 'suspendida', 'finalizada', 'cancelada') DEFAULT 'activa',
    porcentaje_avance DECIMAL(5,2) DEFAULT 0.00 COMMENT 'Porcentaje de avance de la obra',
    
    -- Responsables
    cliente_id INT(11),
    usuario_responsable_id INT(11),
    
    -- Configuración
    max_trabajadores INT(11) DEFAULT 50 COMMENT 'Máximo de trabajadores permitidos',
    requiere_bitacora_diaria TINYINT(1) DEFAULT 1,
    
    -- Auditoría
    creado_por INT(11) NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    PRIMARY KEY (id),
    UNIQUE KEY uk_codigo_empresa (codigo_obra, empresa_id),
    KEY idx_empresa (empresa_id),
    KEY idx_proyecto (proyecto_id),
    KEY idx_estado (estado),
    KEY idx_cliente (cliente_id),
    KEY idx_responsable (usuario_responsable_id),
    KEY idx_fechas (fecha_inicio, fecha_fin_estimada),
    KEY idx_ubicacion (zona, municipio),
    
    FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
    FOREIGN KEY (proyecto_id) REFERENCES proyectos(id) ON DELETE SET NULL,
    FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE SET NULL,
    FOREIGN KEY (usuario_responsable_id) REFERENCES usuarios(id) ON DELETE SET NULL,
    FOREIGN KEY (creado_por) REFERENCES usuarios(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 4. TABLA: servicios
-- =====================================================

CREATE TABLE IF NOT EXISTS servicios (
    id INT(11) NOT NULL AUTO_INCREMENT,
    empresa_id INT(11) NOT NULL,
    proyecto_id INT(11) COMMENT 'Proyecto asociado (opcional)',
    obra_id INT(11) COMMENT 'Obra dentro de la cual se ejecuta (opcional)',
    
    -- Identificación
    codigo_servicio VARCHAR(50) NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    tipo_servicio ENUM('electrico', 'plomeria', 'pintura', 'reparacion', 'instalacion', 'mantenimiento', 'otro') DEFAULT 'otro',
    
    -- Ubicación
    ubicacion VARCHAR(255) NOT NULL,
    zona VARCHAR(100),
    
    -- Control financiero
    costo_estimado DECIMAL(14,2) DEFAULT 0.00,
    costo_real DECIMAL(14,2) DEFAULT 0.00,
    
    -- Fechas
    fecha_solicitud DATE NOT NULL,
    fecha_programada DATE,
    fecha_ejecucion DATE,
    duracion_estimada_horas DECIMAL(5,2) COMMENT 'Duración estimada en horas',
    
    -- Estado
    estado ENUM('pendiente', 'programado', 'en_ejecucion', 'finalizado', 'cancelado') DEFAULT 'pendiente',
    prioridad ENUM('baja', 'media', 'alta', 'urgente') DEFAULT 'media',
    
    -- Responsables
    cliente_id INT(11),
    usuario_responsable_id INT(11),
    
    -- Auditoría
    creado_por INT(11) NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    PRIMARY KEY (id),
    UNIQUE KEY uk_codigo_empresa (codigo_servicio, empresa_id),
    KEY idx_empresa (empresa_id),
    KEY idx_proyecto (proyecto_id),
    KEY idx_obra (obra_id),
    KEY idx_estado (estado),
    KEY idx_tipo (tipo_servicio),
    KEY idx_cliente (cliente_id),
    KEY idx_fechas (fecha_solicitud, fecha_programada),
    
    FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
    FOREIGN KEY (proyecto_id) REFERENCES proyectos(id) ON DELETE SET NULL,
    FOREIGN KEY (obra_id) REFERENCES obras(id) ON DELETE SET NULL,
    FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE SET NULL,
    FOREIGN KEY (usuario_responsable_id) REFERENCES usuarios(id) ON DELETE SET NULL,
    FOREIGN KEY (creado_por) REFERENCES usuarios(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 5. TABLA: trabajadores_obra
-- =====================================================

CREATE TABLE IF NOT EXISTS trabajadores_obra (
    id INT(11) NOT NULL AUTO_INCREMENT,
    empresa_id INT(11) NOT NULL,
    
    -- Datos personales
    nombre VARCHAR(150) NOT NULL,
    apellidos VARCHAR(150),
    tipo_documento_id INT(11) NOT NULL,
    numero_documento VARCHAR(20) NOT NULL,
    telefono VARCHAR(20),
    email VARCHAR(100),
    
    -- Datos laborales
    rol_especialidad VARCHAR(100) NOT NULL COMMENT 'Ej: Electricista, Albañil, Ayudante',
    tarifa_por_hora DECIMAL(10,2) COMMENT 'Tarifa por hora de trabajo',
    tarifa_por_dia DECIMAL(10,2) COMMENT 'Tarifa por día de trabajo',
    
    -- Estado
    estado ENUM('activo', 'inactivo', 'bloqueado') DEFAULT 'activo',
    
    -- Auditoría
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    PRIMARY KEY (id),
    UNIQUE KEY uk_documento_empresa (numero_documento, empresa_id),
    KEY idx_empresa (empresa_id),
    KEY idx_tipo_documento (tipo_documento_id),
    KEY idx_nombre (nombre),
    KEY idx_rol (rol_especialidad),
    KEY idx_estado (estado),
    
    FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
    FOREIGN KEY (tipo_documento_id) REFERENCES tipos_documento(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 6. TABLA: asignaciones_trabajadores
-- =====================================================

CREATE TABLE IF NOT EXISTS asignaciones_trabajadores (
    id INT(11) NOT NULL AUTO_INCREMENT,
    empresa_id INT(11) NOT NULL,
    trabajador_id INT(11) NOT NULL,
    
    -- Destino (obra o servicio)
    tipo_destino ENUM('obra', 'servicio') NOT NULL,
    destino_id INT(11) NOT NULL COMMENT 'ID de la obra o servicio',
    
    -- Fechas y horarios
    fecha_asignacion DATE NOT NULL,
    hora_inicio TIME,
    hora_fin TIME,
    horas_trabajadas DECIMAL(5,2) DEFAULT 0.00,
    
    -- Estado
    estado ENUM('activo', 'finalizado', 'cancelado') DEFAULT 'activo',
    
    -- Auditoría
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    PRIMARY KEY (id),
    KEY idx_empresa (empresa_id),
    KEY idx_trabajador (trabajador_id),
    KEY idx_destino (tipo_destino, destino_id),
    KEY idx_fecha (fecha_asignacion),
    KEY idx_estado (estado),
    
    FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
    FOREIGN KEY (trabajador_id) REFERENCES trabajadores_obra(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 7. TABLA: bitacora_diaria
-- =====================================================

CREATE TABLE IF NOT EXISTS bitacora_diaria (
    id INT(11) NOT NULL AUTO_INCREMENT,
    empresa_id INT(11) NOT NULL,
    obra_id INT(11) NOT NULL,
    
    -- Fecha y trabajadores
    fecha_bitacora DATE NOT NULL,
    trabajadores_presentes TEXT COMMENT 'IDs de trabajadores separados por coma',
    
    -- Trabajo realizado
    trabajo_realizado TEXT NOT NULL,
    materiales_utilizados TEXT,
    observaciones TEXT,
    
    -- Clima y condiciones
    clima VARCHAR(50),
    condiciones_trabajo VARCHAR(100),
    
    -- Fotos y evidencia
    fotos_url TEXT COMMENT 'URLs de fotos separadas por coma',
    
    -- Estado
    estado ENUM('borrador', 'registrada', 'revisada') DEFAULT 'borrador',
    
    -- Responsable
    registrado_por INT(11) NOT NULL,
    
    -- Auditoría
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    PRIMARY KEY (id),
    KEY idx_empresa (empresa_id),
    KEY idx_obra (obra_id),
    KEY idx_fecha (fecha_bitacora),
    KEY idx_estado (estado),
    
    FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
    FOREIGN KEY (obra_id) REFERENCES obras(id) ON DELETE CASCADE,
    FOREIGN KEY (registrado_por) REFERENCES usuarios(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 8. TABLA: ordenes_trabajo
-- =====================================================

CREATE TABLE IF NOT EXISTS ordenes_trabajo (
    id INT(11) NOT NULL AUTO_INCREMENT,
    empresa_id INT(11) NOT NULL,
    
    -- Destino
    tipo_destino ENUM('obra', 'servicio') NOT NULL,
    destino_id INT(11) NOT NULL,
    
    -- Descripción
    descripcion TEXT NOT NULL,
    prioridad ENUM('baja', 'media', 'alta', 'urgente') DEFAULT 'media',
    
    -- Estado
    estado ENUM('pendiente', 'aprobada', 'en_ejecucion', 'completada', 'cancelada') DEFAULT 'pendiente',
    
    -- Fechas
    fecha_solicitud DATE NOT NULL,
    fecha_aprobacion DATE,
    fecha_inicio DATE,
    fecha_completada DATE,
    
    -- Responsables
    solicitado_por INT(11) NOT NULL,
    aprobado_por INT(11),
    
    -- Auditoría
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    PRIMARY KEY (id),
    KEY idx_empresa (empresa_id),
    KEY idx_destino (tipo_destino, destino_id),
    KEY idx_estado (estado),
    KEY idx_fecha (fecha_solicitud),
    
    FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
    FOREIGN KEY (solicitado_por) REFERENCES usuarios(id),
    FOREIGN KEY (aprobado_por) REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 9. TABLA: compras_obra
-- =====================================================

CREATE TABLE IF NOT EXISTS compras_obra (
    id INT(11) NOT NULL AUTO_INCREMENT,
    empresa_id INT(11) NOT NULL,
    
    -- Destino obligatorio
    tipo_destino ENUM('obra', 'servicio', 'stock_general') NOT NULL,
    destino_id INT(11) COMMENT 'ID de obra o servicio (NULL si es stock_general)',
    
    -- Orden de trabajo asociada (opcional)
    orden_trabajo_id INT(11),
    
    -- Proveedor
    proveedor_id INT(11) NOT NULL,
    
    -- Comprobante
    numero_factura VARCHAR(100) NOT NULL,
    tipo_comprobante VARCHAR(50),
    
    -- Montos
    subtotal DECIMAL(14,2) NOT NULL,
    impuesto DECIMAL(14,2) DEFAULT 0.00,
    total DECIMAL(14,2) NOT NULL,
    
    -- Pago
    forma_pago ENUM('efectivo', 'tarjeta_debito', 'tarjeta_credito', 'transferencia', 'cheque', 'credito') NOT NULL,
    
    -- Clasificación
    tipo_compra ENUM('planificada', 'imprevista') DEFAULT 'planificada',
    
    -- Estado
    estado ENUM('registrada', 'validada', 'anulada') DEFAULT 'registrada',
    
    -- Fechas
    fecha_compra DATE NOT NULL,
    
    -- Observaciones
    notas TEXT,
    
    -- Auditoría
    usuario_id INT(11) NOT NULL COMMENT 'Usuario que registró la compra',
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    PRIMARY KEY (id),
    KEY idx_empresa (empresa_id),
    KEY idx_destino (tipo_destino, destino_id),
    KEY idx_orden (orden_trabajo_id),
    KEY idx_proveedor (proveedor_id),
    KEY idx_fecha (fecha_compra),
    KEY idx_estado (estado),
    KEY idx_tipo (tipo_compra),
    
    FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
    FOREIGN KEY (orden_trabajo_id) REFERENCES ordenes_trabajo(id) ON DELETE SET NULL,
    FOREIGN KEY (proveedor_id) REFERENCES proveedores(id),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 10. TABLA: compras_obra_detalle
-- =====================================================

CREATE TABLE IF NOT EXISTS compras_obra_detalle (
    id INT(11) NOT NULL AUTO_INCREMENT,
    compra_obra_id INT(11) NOT NULL,
    
    -- Material
    material_nombre VARCHAR(255) NOT NULL COMMENT 'Nombre del material',
    material_descripcion TEXT,
    unidad_medida VARCHAR(50) COMMENT 'Ej: Unidad, Metro, Kilo',
    
    -- Cantidades
    cantidad DECIMAL(10,2) NOT NULL,
    precio_unitario DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    
    -- Vinculación opcional a catálogo de productos
    producto_id INT(11) COMMENT 'Si el material existe en el catálogo',
    
    PRIMARY KEY (id),
    KEY idx_compra (compra_obra_id),
    KEY idx_producto (producto_id),
    
    FOREIGN KEY (compra_obra_id) REFERENCES compras_obra(id) ON DELETE CASCADE,
    FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 11. TABLA: conduces_obra
-- =====================================================

CREATE TABLE IF NOT EXISTS conduces_obra (
    id INT(11) NOT NULL AUTO_INCREMENT,
    empresa_id INT(11) NOT NULL,
    obra_id INT(11) NOT NULL,
    factura_id INT(11) DEFAULT NULL COMMENT 'Vinculado a ventas/facturas existentes',
    
    numero_conduce VARCHAR(50) UNIQUE NOT NULL,
    material VARCHAR(255) NOT NULL,
    cantidad DECIMAL(15, 2) NOT NULL,
    receptor VARCHAR(255) NOT NULL,
    chofer VARCHAR(100),
    vehiculo VARCHAR(100),
    placa VARCHAR(20),
    evidencia_url TEXT DEFAULT NULL,
    observaciones TEXT,
    
    estado ENUM('emitido', 'entregado', 'anulado') DEFAULT 'emitido',
    
    creado_por INT(11) NOT NULL,
    fecha_despacho TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    PRIMARY KEY (id),
    UNIQUE KEY uk_numero_conduce (numero_conduce),
    KEY idx_empresa (empresa_id),
    KEY idx_obra (obra_id),
    KEY idx_estado (estado),
    KEY idx_fecha (fecha_despacho),
    
    FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
    FOREIGN KEY (obra_id) REFERENCES obras(id) ON DELETE CASCADE,
    FOREIGN KEY (creado_por) REFERENCES usuarios(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 12. TABLA: conduces_obra_detalle
-- =====================================================

CREATE TABLE IF NOT EXISTS conduces_obra_detalle (
    id INT(11) NOT NULL AUTO_INCREMENT,
    conduce_id INT(11) NOT NULL,
    compra_detalle_id INT(11) DEFAULT NULL COMMENT 'Referencia a compra_obra_detalle si aplica',
    
    material_nombre VARCHAR(255) NOT NULL,
    cantidad_despachada DECIMAL(10,2) NOT NULL,
    unidad_medida VARCHAR(50),
    
    PRIMARY KEY (id),
    KEY idx_conduce (conduce_id),
    KEY idx_compra_detalle (compra_detalle_id),
    
    FOREIGN KEY (conduce_id) REFERENCES conduces_obra(id) ON DELETE CASCADE,
    FOREIGN KEY (compra_detalle_id) REFERENCES compras_obra_detalle(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 13. TABLA: presupuesto_alertas
-- =====================================================

CREATE TABLE IF NOT EXISTS presupuesto_alertas (
    id INT(11) NOT NULL AUTO_INCREMENT,
    empresa_id INT(11) NOT NULL,
    
    -- Destino de la alerta
    tipo_destino ENUM('obra', 'servicio', 'proyecto') NOT NULL,
    destino_id INT(11) NOT NULL,
    
    -- Tipo de alerta
    tipo_alerta ENUM('umbral_70', 'umbral_90', 'excedido', 'proyeccion_sobrecosto') NOT NULL,
    severidad ENUM('informativa', 'preventiva', 'critica') DEFAULT 'preventiva',
    
    -- Datos de la alerta
    porcentaje_ejecutado DECIMAL(5,2) NOT NULL,
    presupuesto_aprobado DECIMAL(14,2) NOT NULL,
    costo_ejecutado DECIMAL(14,2) NOT NULL,
    proyeccion_costo DECIMAL(14,2),
    
    -- Mensaje
    mensaje TEXT,
    
    -- Estado
    estado ENUM('activa', 'revisada', 'resuelta') DEFAULT 'activa',
    
    -- Fechas
    fecha_generacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_revision TIMESTAMP NULL,
    fecha_resolucion TIMESTAMP NULL,
    
    -- Responsable
    revisado_por INT(11),
    
    PRIMARY KEY (id),
    KEY idx_empresa (empresa_id),
    KEY idx_destino (tipo_destino, destino_id),
    KEY idx_tipo (tipo_alerta),
    KEY idx_severidad (severidad),
    KEY idx_estado (estado),
    KEY idx_fecha (fecha_generacion),
    
    FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
    FOREIGN KEY (revisado_por) REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 14. TABLA: obra_documentos
-- =====================================================

CREATE TABLE IF NOT EXISTS obra_documentos (
    id INT(11) NOT NULL AUTO_INCREMENT,
    obra_id INT(11) NOT NULL,
    tipo ENUM('contrato', 'presupuesto', 'plano', 'permiso', 'orden_trabajo', 'acta', 'factura', 'otro') DEFAULT 'otro',
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    ruta_archivo VARCHAR(500) NOT NULL,
    extension VARCHAR(10),
    tamaño_kb INT,
    visible_cliente TINYINT(1) DEFAULT 0,
    subido_por INT(11) NOT NULL,
    fecha_subida TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_obra (obra_id),
    KEY idx_tipo (tipo),
    FOREIGN KEY (obra_id) REFERENCES obras(id) ON DELETE CASCADE,
    FOREIGN KEY (subido_por) REFERENCES usuarios(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 15. TABLA: obra_imagenes
-- =====================================================

CREATE TABLE IF NOT EXISTS obra_imagenes (
    id INT(11) NOT NULL AUTO_INCREMENT,
    obra_id INT(11) NOT NULL,
    categoria ENUM('inicio', 'avance', 'problema', 'final', 'otro') DEFAULT 'avance',
    descripcion TEXT,
    ruta_imagen VARCHAR(500) NOT NULL,
    fecha_toma DATE,
    subido_por INT(11) NOT NULL,
    fecha_subida TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_obra (obra_id),
    KEY idx_categoria (categoria),
    FOREIGN KEY (obra_id) REFERENCES obras(id) ON DELETE CASCADE,
    FOREIGN KEY (subido_por) REFERENCES usuarios(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- FINALIZAR TRANSACCIÓN
-- =====================================================

COMMIT;
SET FOREIGN_KEY_CHECKS = 1;

-- =====================================================
-- VERIFICACIÓN
-- =====================================================

SELECT 'Migración completada exitosamente' AS resultado;
SELECT 'Tablas creadas:' AS info;
SHOW TABLES LIKE '%proyectos%';
SHOW TABLES LIKE '%obras%';
SHOW TABLES LIKE '%servicios%';
SHOW TABLES LIKE '%trabajadores%';
SHOW TABLES LIKE '%asignaciones%';
SHOW TABLES LIKE '%bitacora%';
SHOW TABLES LIKE '%ordenes%';
SHOW TABLES LIKE '%compras_obra%';
SHOW TABLES LIKE '%conduces_obra%';
SHOW TABLES LIKE '%presupuesto_alertas%';
SHOW TABLES LIKE '%obra_documentos%';
SHOW TABLES LIKE '%obra_imagenes%';

