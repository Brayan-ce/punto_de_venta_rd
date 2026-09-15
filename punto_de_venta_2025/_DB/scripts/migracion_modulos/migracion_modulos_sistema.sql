-- ============================================
-- MIGRACIÓN: Sistema Modular por Empresa
-- Fecha: 2026-01-21
-- Descripción: Implementa sistema de módulos habilitados por empresa
-- ============================================

USE punto_venta_rd;

-- Tabla de módulos del sistema
CREATE TABLE IF NOT EXISTS modulos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    codigo VARCHAR(50) NOT NULL UNIQUE COMMENT 'Código único del módulo: pos, credito, financiamiento, constructora, etc.',
    nombre VARCHAR(100) NOT NULL COMMENT 'Nombre descriptivo del módulo',
    descripcion TEXT COMMENT 'Descripción detallada del módulo',
    categoria ENUM('core', 'pos', 'financiamiento', 'constructora', 'credito', 'catalogo') NOT NULL DEFAULT 'pos' COMMENT 'Categoría del módulo',
    icono VARCHAR(50) COMMENT 'Nombre del icono de Ionicons para el menú',
    ruta_base VARCHAR(100) COMMENT 'Ruta base del módulo en el admin',
    orden INT DEFAULT 0 COMMENT 'Orden de visualización en el menú',
    siempre_habilitado BOOLEAN DEFAULT FALSE COMMENT 'Si es TRUE, siempre está habilitado (ej: core)',
    activo BOOLEAN DEFAULT TRUE COMMENT 'Si el módulo está activo en el sistema',
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_codigo (codigo),
    INDEX idx_categoria (categoria),
    INDEX idx_activo (activo),
    INDEX idx_orden (orden)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Catálogo de módulos disponibles en el sistema';

-- Relación empresa-módulos habilitados
CREATE TABLE IF NOT EXISTS empresa_modulos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    empresa_id INT NOT NULL,
    modulo_id INT NOT NULL,
    habilitado BOOLEAN DEFAULT TRUE COMMENT 'Si el módulo está habilitado para esta empresa',
    fecha_habilitacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha en que se habilitó el módulo',
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
    FOREIGN KEY (modulo_id) REFERENCES modulos(id) ON DELETE CASCADE,
    UNIQUE KEY uk_empresa_modulo (empresa_id, modulo_id),
    INDEX idx_empresa (empresa_id),
    INDEX idx_modulo (modulo_id),
    INDEX idx_habilitado (habilitado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Relación de módulos habilitados por empresa';

-- Configuración adicional por módulo y empresa (opcional)
CREATE TABLE IF NOT EXISTS empresa_modulo_config (
    id INT PRIMARY KEY AUTO_INCREMENT,
    empresa_modulo_id INT NOT NULL,
    clave VARCHAR(100) NOT NULL COMMENT 'Clave de configuración',
    valor TEXT COMMENT 'Valor de la configuración (puede ser JSON)',
    tipo ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string' COMMENT 'Tipo de dato del valor',
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (empresa_modulo_id) REFERENCES empresa_modulos(id) ON DELETE CASCADE,
    INDEX idx_empresa_modulo (empresa_modulo_id),
    INDEX idx_clave (clave),
    UNIQUE KEY uk_empresa_modulo_clave (empresa_modulo_id, clave)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Configuraciones específicas por módulo y empresa';

-- ============================================
-- INSERTAR MÓDULOS PREDEFINIDOS
-- ============================================

-- Módulo Core (siempre habilitado)
INSERT INTO modulos (codigo, nombre, descripcion, categoria, icono, ruta_base, orden, siempre_habilitado, activo) VALUES
('core', 'Core', 'Módulo base del sistema. Incluye dashboard, configuración y perfil', 'core', 'speedometer-outline', '/admin/dashboard', 0, TRUE, TRUE)
ON DUPLICATE KEY UPDATE nombre=VALUES(nombre);

-- Módulo POS Básico
INSERT INTO modulos (codigo, nombre, descripcion, categoria, icono, ruta_base, orden, siempre_habilitado, activo) VALUES
('pos', 'Punto de Venta', 'Módulo completo de punto de venta: ventas, productos, inventario, compras, proveedores', 'pos', 'cash-outline', '/admin/ventas', 1, FALSE, TRUE)
ON DUPLICATE KEY UPDATE nombre=VALUES(nombre);

-- Módulo de Crédito
INSERT INTO modulos (codigo, nombre, descripcion, categoria, icono, ruta_base, orden, siempre_habilitado, activo) VALUES
('credito', 'Control de Crédito', 'Gestión de ventas a crédito, cuentas por cobrar y depuración', 'credito', 'card-outline', '/admin/credito', 2, FALSE, TRUE)
ON DUPLICATE KEY UPDATE nombre=VALUES(nombre);

-- Módulo de Financiamiento
INSERT INTO modulos (codigo, nombre, descripcion, categoria, icono, ruta_base, orden, siempre_habilitado, activo) VALUES
('financiamiento', 'Financiamiento', 'Sistema de financiamiento para venta de scooters y otros activos', 'financiamiento', 'card-outline', '/admin/financiamiento', 3, FALSE, TRUE)
ON DUPLICATE KEY UPDATE nombre=VALUES(nombre);

-- Módulo de Construcción
INSERT INTO modulos (codigo, nombre, descripcion, categoria, icono, ruta_base, orden, siempre_habilitado, activo) VALUES
('constructora', 'Construcción', 'Control de obras, proyectos, servicios, bitácora y personal', 'constructora', 'build-outline', '/admin/constructora', 4, FALSE, TRUE)
ON DUPLICATE KEY UPDATE nombre=VALUES(nombre);

-- Módulo de Catálogo Online
INSERT INTO modulos (codigo, nombre, descripcion, categoria, icono, ruta_base, orden, siempre_habilitado, activo) VALUES
('catalogo', 'Catálogo Online', 'Catálogo online y pedidos B2B', 'catalogo', 'albums-outline', '/admin/catalogo', 5, FALSE, TRUE)
ON DUPLICATE KEY UPDATE nombre=VALUES(nombre);

-- ============================================
-- HABILITAR MÓDULO CORE PARA TODAS LAS EMPRESAS EXISTENTES
-- ============================================

INSERT INTO empresa_modulos (empresa_id, modulo_id, habilitado)
SELECT e.id, m.id, TRUE
FROM empresas e
CROSS JOIN modulos m
WHERE m.codigo = 'core' AND m.siempre_habilitado = TRUE
ON DUPLICATE KEY UPDATE habilitado=TRUE;

-- ============================================
-- HABILITAR MÓDULO POS PARA TODAS LAS EMPRESAS EXISTENTES (migración inicial)
-- Esto permite que las empresas existentes sigan funcionando
-- ============================================

INSERT INTO empresa_modulos (empresa_id, modulo_id, habilitado)
SELECT e.id, m.id, TRUE
FROM empresas e
CROSS JOIN modulos m
WHERE m.codigo = 'pos'
ON DUPLICATE KEY UPDATE habilitado=TRUE;

