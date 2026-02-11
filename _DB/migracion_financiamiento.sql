-- =====================================================
-- MIGRACIÓN: Sistema de Financiamiento
-- =====================================================
-- Fecha: 2025-01-25
-- Versión: 1.0
-- Descripción: Crea todas las tablas y modificaciones necesarias
--              para el sistema completo de financiamiento
-- =====================================================
USE punto_venta_rd;
SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;
SET time_zone = "+00:00";

-- =====================================================
-- 1. MODIFICACIONES A TABLAS EXISTENTES
-- =====================================================

-- 1.1 Modificar tabla productos (agregar campos para activos rastreables)
-- =====================================================

-- Verificar si los campos ya existen antes de agregarlos
SET @dbname = DATABASE();
SET @tablename = "productos";
SET @preparedStatement = (SELECT IF(
    (
        SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
        WHERE
            (TABLE_SCHEMA = @dbname)
            AND (TABLE_NAME = @tablename)
            AND (COLUMN_NAME = "es_rastreable")
    ) > 0,
    "SELECT 1",
    CONCAT("ALTER TABLE ", @tablename, " ADD COLUMN es_rastreable BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Indica si el producto se controla por unidad física individual'")
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

SET @preparedStatement = (SELECT IF(
    (
        SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
        WHERE
            (TABLE_SCHEMA = @dbname)
            AND (TABLE_NAME = @tablename)
            AND (COLUMN_NAME = "tipo_activo")
    ) > 0,
    "SELECT 1",
    CONCAT("ALTER TABLE ", @tablename, " ADD COLUMN tipo_activo ENUM('no_rastreable', 'vehiculo', 'electronico', 'electrodomestico', 'mueble', 'otro') NOT NULL DEFAULT 'no_rastreable' COMMENT 'Clasificación general del tipo de activo para reglas de negocio'")
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

SET @preparedStatement = (SELECT IF(
    (
        SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
        WHERE
            (TABLE_SCHEMA = @dbname)
            AND (TABLE_NAME = @tablename)
            AND (COLUMN_NAME = "requiere_serie")
    ) > 0,
    "SELECT 1",
    CONCAT("ALTER TABLE ", @tablename, " ADD COLUMN requiere_serie BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Si cada unidad física debe tener número de serie, chasis o IMEI'")
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

SET @preparedStatement = (SELECT IF(
    (
        SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
        WHERE
            (TABLE_SCHEMA = @dbname)
            AND (TABLE_NAME = @tablename)
            AND (COLUMN_NAME = "permite_financiamiento")
    ) > 0,
    "SELECT 1",
    CONCAT("ALTER TABLE ", @tablename, " ADD COLUMN permite_financiamiento BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Define si el producto puede venderse mediante financiamiento'")
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

SET @preparedStatement = (SELECT IF(
    (
        SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
        WHERE
            (TABLE_SCHEMA = @dbname)
            AND (TABLE_NAME = @tablename)
            AND (COLUMN_NAME = "meses_max_financiamiento")
    ) > 0,
    "SELECT 1",
    CONCAT("ALTER TABLE ", @tablename, " ADD COLUMN meses_max_financiamiento INT DEFAULT NULL COMMENT 'Plazo máximo permitido para financiamiento de este producto'")
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

SET @preparedStatement = (SELECT IF(
    (
        SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
        WHERE
            (TABLE_SCHEMA = @dbname)
            AND (TABLE_NAME = @tablename)
            AND (COLUMN_NAME = "meses_garantia")
    ) > 0,
    "SELECT 1",
    CONCAT("ALTER TABLE ", @tablename, " ADD COLUMN meses_garantia INT DEFAULT 0 COMMENT 'Duración estándar de garantía del producto en meses'")
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

SET @preparedStatement = (SELECT IF(
    (
        SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
        WHERE
            (TABLE_SCHEMA = @dbname)
            AND (TABLE_NAME = @tablename)
            AND (COLUMN_NAME = "tasa_depreciacion")
    ) > 0,
    "SELECT 1",
    CONCAT("ALTER TABLE ", @tablename, " ADD COLUMN tasa_depreciacion DECIMAL(5,2) DEFAULT NULL COMMENT 'Tasa anual de depreciación estimada del producto'")
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Agregar índices si no existen
SET @indexName = 'idx_es_rastreable';
SET @tableName = 'productos';
SET @preparedStatement = (
    SELECT IF(
        (
            SELECT COUNT(*) 
            FROM INFORMATION_SCHEMA.STATISTICS
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = @tableName
              AND INDEX_NAME = @indexName
        ) > 0,
        'SELECT 1',
        CONCAT('CREATE INDEX ', @indexName, ' ON ', @tableName, ' (es_rastreable)')
    )
);
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @indexName = 'idx_tipo_activo';
SET @preparedStatement = (
    SELECT IF(
        (
            SELECT COUNT(*) 
            FROM INFORMATION_SCHEMA.STATISTICS
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = @tableName
              AND INDEX_NAME = @indexName
        ) > 0,
        'SELECT 1',
        CONCAT('CREATE INDEX ', @indexName, ' ON ', @tableName, ' (tipo_activo)')
    )
);
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @indexName = 'idx_permite_financiamiento';
SET @preparedStatement = (
    SELECT IF(
        (
            SELECT COUNT(*) 
            FROM INFORMATION_SCHEMA.STATISTICS
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = @tableName
              AND INDEX_NAME = @indexName
        ) > 0,
        'SELECT 1',
        CONCAT('CREATE INDEX ', @indexName, ' ON ', @tableName, ' (permite_financiamiento)')
    )
);
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 1.2 Modificar tabla clientes (agregar campos para financiamiento)
-- =====================================================

SET @tablename = "clientes";

SET @preparedStatement = (SELECT IF(
    (
        SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
        WHERE
            (TABLE_SCHEMA = @dbname)
            AND (TABLE_NAME = @tablename)
            AND (COLUMN_NAME = "ocupacion")
    ) > 0,
    "SELECT 1",
    CONCAT("ALTER TABLE ", @tablename, " ADD COLUMN ocupacion VARCHAR(100) COMMENT 'Ocupación del cliente'")
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

SET @preparedStatement = (SELECT IF(
    (
        SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
        WHERE
            (TABLE_SCHEMA = @dbname)
            AND (TABLE_NAME = @tablename)
            AND (COLUMN_NAME = "ingreso_mensual")
    ) > 0,
    "SELECT 1",
    CONCAT("ALTER TABLE ", @tablename, " ADD COLUMN ingreso_mensual DECIMAL(12,2) COMMENT 'Ingreso mensual declarado'")
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

SET @preparedStatement = (SELECT IF(
    (
        SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
        WHERE
            (TABLE_SCHEMA = @dbname)
            AND (TABLE_NAME = @tablename)
            AND (COLUMN_NAME = "nombre_empleador")
    ) > 0,
    "SELECT 1",
    CONCAT("ALTER TABLE ", @tablename, " ADD COLUMN nombre_empleador VARCHAR(200) COMMENT 'Nombre del empleador'")
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

SET @preparedStatement = (SELECT IF(
    (
        SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
        WHERE
            (TABLE_SCHEMA = @dbname)
            AND (TABLE_NAME = @tablename)
            AND (COLUMN_NAME = "telefono_empleador")
    ) > 0,
    "SELECT 1",
    CONCAT("ALTER TABLE ", @tablename, " ADD COLUMN telefono_empleador VARCHAR(20) COMMENT 'Teléfono del empleador'")
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

SET @preparedStatement = (SELECT IF(
    (
        SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
        WHERE
            (TABLE_SCHEMA = @dbname)
            AND (TABLE_NAME = @tablename)
            AND (COLUMN_NAME = "anos_empleo")
    ) > 0,
    "SELECT 1",
    CONCAT("ALTER TABLE ", @tablename, " ADD COLUMN anos_empleo INT COMMENT 'Años en el empleo'")
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

SET @preparedStatement = (SELECT IF(
    (
        SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
        WHERE
            (TABLE_SCHEMA = @dbname)
            AND (TABLE_NAME = @tablename)
            AND (COLUMN_NAME = "numero_whatsapp")
    ) > 0,
    "SELECT 1",
    CONCAT("ALTER TABLE ", @tablename, " ADD COLUMN numero_whatsapp VARCHAR(20) COMMENT 'Número de WhatsApp (puede diferir del teléfono)'")
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

SET @preparedStatement = (SELECT IF(
    (
        SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
        WHERE
            (TABLE_SCHEMA = @dbname)
            AND (TABLE_NAME = @tablename)
            AND (COLUMN_NAME = "metodo_contacto_preferido")
    ) > 0,
    "SELECT 1",
    CONCAT("ALTER TABLE ", @tablename, " ADD COLUMN metodo_contacto_preferido ENUM('telefono', 'whatsapp', 'email', 'sms') DEFAULT 'whatsapp'")
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

SET @preparedStatement = (SELECT IF(
    (
        SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
        WHERE
            (TABLE_SCHEMA = @dbname)
            AND (TABLE_NAME = @tablename)
            AND (COLUMN_NAME = "score_crediticio")
    ) > 0,
    "SELECT 1",
    CONCAT("ALTER TABLE ", @tablename, " ADD COLUMN score_crediticio INT DEFAULT 100 COMMENT 'Score crediticio interno (0-100)'")
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

SET @preparedStatement = (SELECT IF(
    (
        SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
        WHERE
            (TABLE_SCHEMA = @dbname)
            AND (TABLE_NAME = @tablename)
            AND (COLUMN_NAME = "clasificacion_credito")
    ) > 0,
    "SELECT 1",
    CONCAT("ALTER TABLE ", @tablename, " ADD COLUMN clasificacion_credito ENUM('A', 'B', 'C', 'D') DEFAULT 'A' COMMENT 'Clasificación crediticia'")
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Agregar índices si no existen
SET @indexName = 'idx_score_crediticio';
SET @tableName = 'clientes';
SET @preparedStatement = (
    SELECT IF(
        (
            SELECT COUNT(*) 
            FROM INFORMATION_SCHEMA.STATISTICS
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = @tableName
              AND INDEX_NAME = @indexName
        ) > 0,
        'SELECT 1',
        CONCAT('CREATE INDEX ', @indexName, ' ON ', @tableName, ' (score_crediticio)')
    )
);
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @indexName = 'idx_clasificacion';
SET @preparedStatement = (
    SELECT IF(
        (
            SELECT COUNT(*) 
            FROM INFORMATION_SCHEMA.STATISTICS
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = @tableName
              AND INDEX_NAME = @indexName
        ) > 0,
        'SELECT 1',
        CONCAT('CREATE INDEX ', @indexName, ' ON ', @tableName, ' (clasificacion_credito)')
    )
);
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 1.3 Modificar tabla credito_clientes (agregar campos para financiamiento)
-- =====================================================

SET @tablename = "credito_clientes";

SET @preparedStatement = (SELECT IF(
    (
        SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
        WHERE
            (TABLE_SCHEMA = @dbname)
            AND (TABLE_NAME = @tablename)
            AND (COLUMN_NAME = "monto_financiado_total")
    ) > 0,
    "SELECT 1",
    CONCAT("ALTER TABLE ", @tablename, " ADD COLUMN monto_financiado_total DECIMAL(12,2) DEFAULT 0 COMMENT 'Total de monto actualmente financiado'")
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

SET @preparedStatement = (SELECT IF(
    (
        SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
        WHERE
            (TABLE_SCHEMA = @dbname)
            AND (TABLE_NAME = @tablename)
            AND (COLUMN_NAME = "contratos_activos")
    ) > 0,
    "SELECT 1",
    CONCAT("ALTER TABLE ", @tablename, " ADD COLUMN contratos_activos INT DEFAULT 0 COMMENT 'Contratos activos'")
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

SET @preparedStatement = (SELECT IF(
    (
        SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
        WHERE
            (TABLE_SCHEMA = @dbname)
            AND (TABLE_NAME = @tablename)
            AND (COLUMN_NAME = "max_contratos_activos")
    ) > 0,
    "SELECT 1",
    CONCAT("ALTER TABLE ", @tablename, " ADD COLUMN max_contratos_activos INT DEFAULT 3 COMMENT 'Máximo de contratos simultáneos permitidos'")
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Agregar índice si no existe
SET @indexName = 'idx_contratos_activos';
SET @tableName = 'credito_clientes';
SET @preparedStatement = (
    SELECT IF(
        (
            SELECT COUNT(*) 
            FROM INFORMATION_SCHEMA.STATISTICS
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = @tableName
              AND INDEX_NAME = @indexName
        ) > 0,
        'SELECT 1',
        CONCAT('CREATE INDEX ', @indexName, ' ON ', @tableName, ' (contratos_activos)')
    )
);
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 1.4 Modificar tabla ventas (agregar campos para financiamiento)
-- =====================================================

SET @tablename = "ventas";

SET @preparedStatement = (SELECT IF(
    (
        SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
        WHERE
            (TABLE_SCHEMA = @dbname)
            AND (TABLE_NAME = @tablename)
            AND (COLUMN_NAME = "tiene_financiamiento")
    ) > 0,
    "SELECT 1",
    CONCAT("ALTER TABLE ", @tablename, " ADD COLUMN tiene_financiamiento BOOLEAN DEFAULT FALSE")
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

SET @preparedStatement = (SELECT IF(
    (
        SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
        WHERE
            (TABLE_SCHEMA = @dbname)
            AND (TABLE_NAME = @tablename)
            AND (COLUMN_NAME = "contrato_financiamiento_id")
    ) > 0,
    "SELECT 1",
    CONCAT("ALTER TABLE ", @tablename, " ADD COLUMN contrato_financiamiento_id INT NULL")
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Agregar índice y foreign key después de crear la tabla contratos_financiamiento
-- (se hará al final del script)

-- =====================================================
-- 2. NUEVAS TABLAS DE FINANCIAMIENTO
-- =====================================================

-- 2.1 Tabla: planes_financiamiento
-- =====================================================

CREATE TABLE IF NOT EXISTS planes_financiamiento (
    id INT AUTO_INCREMENT PRIMARY KEY,
    empresa_id INT NULL COMMENT 'NULL = plan global del superadmin',
    
    -- Identificación
    codigo VARCHAR(20) NOT NULL UNIQUE,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    
    -- Términos financieros
    plazo_meses INT NOT NULL COMMENT '6, 12, 18, 24',
    tasa_interes_anual DECIMAL(5,2) NOT NULL COMMENT '% anual (ej: 18.00)',
    tasa_interes_mensual DECIMAL(5,4) NOT NULL COMMENT 'Calculado automáticamente',
    
    -- Requisitos
    pago_inicial_minimo_pct DECIMAL(5,2) NOT NULL DEFAULT 15.00 COMMENT '% inicial mínimo',
    monto_minimo DECIMAL(12,2) DEFAULT 0 COMMENT 'Monto mínimo financiable',
    monto_maximo DECIMAL(12,2) COMMENT 'Monto máximo financiable',
    
    -- Penalidades
    penalidad_mora_pct DECIMAL(5,2) NOT NULL DEFAULT 5.00 COMMENT '% mora mensual',
    dias_gracia INT NOT NULL DEFAULT 5 COMMENT 'Días de gracia',
    
    -- Descuentos
    descuento_pago_anticipado_pct DECIMAL(5,2) DEFAULT 0 COMMENT 'Descuento por pago anticipado',
    cuotas_minimas_anticipadas DECIMAL(5,2) DEFAULT 3 COMMENT 'Mínimo de cuotas para descuento',
    
    -- Configuración
    activo BOOLEAN DEFAULT TRUE,
    permite_pago_anticipado BOOLEAN DEFAULT TRUE,
    requiere_fiador BOOLEAN DEFAULT FALSE COMMENT 'Requiere fiador',
    
    -- Control
    creado_por INT NOT NULL,
    modificado_por INT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Índices
    INDEX idx_empresa (empresa_id),
    INDEX idx_activo (activo),
    INDEX idx_plazo (plazo_meses),
    
    -- Constraints
    FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
    FOREIGN KEY (creado_por) REFERENCES usuarios(id),
    FOREIGN KEY (modificado_por) REFERENCES usuarios(id) ON DELETE SET NULL
    
    -- Nota: Las validaciones de negocio (tasa_interes_anual, plazo_meses, etc.)
    -- se realizan a nivel de aplicación, no mediante CHECK constraints
    -- debido a limitaciones de compatibilidad en MySQL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Planes de financiamiento disponibles para la empresa';

-- 2.2 Tabla: contratos_financiamiento
-- =====================================================

CREATE TABLE IF NOT EXISTS contratos_financiamiento (
    id INT AUTO_INCREMENT PRIMARY KEY,
    
    -- Relaciones
    empresa_id INT NOT NULL,
    cliente_id INT NOT NULL,
    plan_id INT NOT NULL,
    usuario_id INT NOT NULL COMMENT 'Vendedor que creó el contrato',
    
    -- Identificación
    numero_contrato VARCHAR(20) NOT NULL UNIQUE COMMENT 'FIN-2025-00001',
    numero_referencia VARCHAR(50) COMMENT 'Número interno de la empresa',
    
    -- Venta asociada (factura fiscal)
    venta_id INT NOT NULL COMMENT 'Venta que generó el NCF',
    ncf VARCHAR(19) NOT NULL COMMENT 'NCF de la factura fiscal',
    
    -- Montos
    precio_producto DECIMAL(14,2) NOT NULL COMMENT 'Precio total del equipo',
    pago_inicial DECIMAL(14,2) NOT NULL COMMENT 'Inicial pagada',
    monto_financiado DECIMAL(14,2) NOT NULL COMMENT 'Monto financiado',
    total_intereses DECIMAL(14,2) NOT NULL COMMENT 'Total de intereses',
    total_a_pagar DECIMAL(14,2) NOT NULL COMMENT 'Total a pagar (financiado + intereses)',
    
    -- Términos del contrato
    numero_cuotas INT NOT NULL COMMENT 'Número de cuotas',
    monto_cuota DECIMAL(14,2) NOT NULL COMMENT 'Monto de cada cuota',
    tasa_interes_mensual DECIMAL(5,4) NOT NULL COMMENT 'Tasa mensual aplicada',
    
    -- Fechas
    fecha_contrato DATE NOT NULL COMMENT 'Fecha de firma',
    fecha_primer_pago DATE NOT NULL COMMENT 'Fecha de primera cuota',
    fecha_ultimo_pago DATE NOT NULL COMMENT 'Fecha de última cuota',
    
    -- Estado financiero
    monto_pagado DECIMAL(14,2) DEFAULT 0 COMMENT 'Total pagado',
    saldo_pendiente DECIMAL(14,2) NOT NULL COMMENT 'Saldo pendiente',
    cuotas_pagadas INT DEFAULT 0 COMMENT 'Cuotas pagadas',
    cuotas_vencidas INT DEFAULT 0 COMMENT 'Cuotas vencidas',
    
    -- Estado del contrato
    estado ENUM('activo', 'pagado', 'incumplido', 'reestructurado', 'cancelado') DEFAULT 'activo',
    razon_estado TEXT COMMENT 'Razón del estado',
    
    -- Datos del fiador (si aplica)
    nombre_fiador VARCHAR(200),
    documento_fiador VARCHAR(20),
    telefono_fiador VARCHAR(20),
    
    -- Observaciones
    notas TEXT,
    notas_internas TEXT COMMENT 'Notas internas (no visibles al cliente)',
    
    -- Control
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    fecha_cancelacion TIMESTAMP NULL,
    cancelado_por INT,
    
    -- Índices
    INDEX idx_empresa (empresa_id),
    INDEX idx_cliente (cliente_id),
    INDEX idx_plan (plan_id),
    INDEX idx_venta (venta_id),
    INDEX idx_estado (estado),
    INDEX idx_numero_contrato (numero_contrato),
    INDEX idx_fecha_contrato (fecha_contrato),
    INDEX idx_primer_pago (fecha_primer_pago),
    
    -- Constraints
    FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
    FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE RESTRICT,
    FOREIGN KEY (plan_id) REFERENCES planes_financiamiento(id),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
    FOREIGN KEY (venta_id) REFERENCES ventas(id) ON DELETE RESTRICT,
    FOREIGN KEY (cancelado_por) REFERENCES usuarios(id) ON DELETE SET NULL
    
    -- Nota: Las validaciones de negocio (montos, cuotas, etc.)
    -- se realizan a nivel de aplicación, no mediante CHECK constraints
    -- debido a limitaciones de compatibilidad en MySQL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Contratos de financiamiento individuales por cliente';

-- 2.3 Tabla: cuotas_financiamiento
-- =====================================================

CREATE TABLE IF NOT EXISTS cuotas_financiamiento (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    
    -- Relaciones
    contrato_id INT NOT NULL,
    empresa_id INT NOT NULL,
    cliente_id INT NOT NULL,
    
    -- Identificación de la cuota
    numero_cuota INT NOT NULL COMMENT '1, 2, 3...',
    
    -- Fechas
    fecha_vencimiento DATE NOT NULL COMMENT 'Fecha de vencimiento',
    fecha_fin_gracia DATE NOT NULL COMMENT 'Último día del período de gracia',
    
    -- Composición de la cuota (método francés)
    monto_capital DECIMAL(14,2) NOT NULL COMMENT 'Capital de esta cuota',
    monto_interes DECIMAL(14,2) NOT NULL COMMENT 'Interés de esta cuota',
    monto_cuota DECIMAL(14,2) NOT NULL COMMENT 'Total de la cuota (capital + interés)',
    
    -- Saldo después de esta cuota
    saldo_restante DECIMAL(14,2) NOT NULL COMMENT 'Saldo que queda después de pagar',
    
    -- Control de pagos
    monto_pagado DECIMAL(14,2) DEFAULT 0 COMMENT 'Monto pagado',
    monto_mora DECIMAL(14,2) DEFAULT 0 COMMENT 'Mora acumulada',
    total_a_pagar DECIMAL(14,2) NOT NULL COMMENT 'Total a pagar (cuota + mora)',
    
    -- Estado
    estado ENUM('pendiente', 'pagada', 'parcial', 'vencida', 'condonada') DEFAULT 'pendiente',
    dias_atraso INT DEFAULT 0 COMMENT 'Días de atraso',
    
    -- Fechas de pago
    fecha_pago TIMESTAMP NULL COMMENT 'Fecha de pago completo',
    fecha_ultimo_pago TIMESTAMP NULL COMMENT 'Último pago parcial',
    
    -- Control
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Índices
    INDEX idx_contrato (contrato_id),
    INDEX idx_empresa (empresa_id),
    INDEX idx_cliente (cliente_id),
    INDEX idx_fecha_vencimiento (fecha_vencimiento),
    INDEX idx_estado (estado),
    INDEX idx_numero_cuota (contrato_id, numero_cuota),
    
    -- Constraints
    UNIQUE KEY uk_contrato_cuota (contrato_id, numero_cuota),
    FOREIGN KEY (contrato_id) REFERENCES contratos_financiamiento(id) ON DELETE CASCADE,
    FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
    FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE RESTRICT
    
    -- Nota: Las validaciones de negocio (montos, etc.)
    -- se realizan a nivel de aplicación, no mediante CHECK constraints
    -- debido a limitaciones de compatibilidad en MySQL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Cuotas individuales de cada contrato de financiamiento';

-- 2.4 Tabla: pagos_financiamiento
-- =====================================================

CREATE TABLE IF NOT EXISTS pagos_financiamiento (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    
    -- Relaciones
    cuota_id BIGINT NOT NULL,
    contrato_id INT NOT NULL,
    empresa_id INT NOT NULL,
    cliente_id INT NOT NULL,
    
    -- Identificación del pago
    numero_recibo VARCHAR(20) NOT NULL UNIQUE COMMENT 'REC-2025-00001',
    
    -- Monto del pago
    monto_pago DECIMAL(14,2) NOT NULL COMMENT 'Monto total del pago',
    
    -- Distribución del pago
    aplicado_mora DECIMAL(14,2) DEFAULT 0 COMMENT 'Aplicado a mora',
    aplicado_interes DECIMAL(14,2) DEFAULT 0 COMMENT 'Aplicado a interés',
    aplicado_capital DECIMAL(14,2) DEFAULT 0 COMMENT 'Aplicado a capital',
    aplicado_futuro DECIMAL(14,2) DEFAULT 0 COMMENT 'Excedente para siguientes cuotas',
    
    -- Método de pago
    metodo_pago ENUM('efectivo', 'tarjeta_debito', 'tarjeta_credito', 
                        'transferencia', 'cheque', 'mixto') NOT NULL,
    
    -- Detalles del método
    ultimos_digitos_tarjeta VARCHAR(4) COMMENT 'Últimos 4 dígitos de tarjeta',
    numero_referencia VARCHAR(100) COMMENT 'Referencia de transferencia/cheque',
    nombre_banco VARCHAR(100),
    
    -- Control de pago
    fecha_pago DATE NOT NULL COMMENT 'Fecha del pago',
    registrado_por INT NOT NULL COMMENT 'Usuario que registró',
    caja_id INT COMMENT 'Caja donde se registró (si aplica)',
    
    -- Estado del pago
    estado ENUM('registrado', 'confirmado', 'revertido', 'rechazado') DEFAULT 'registrado',
    fecha_reversion TIMESTAMP NULL,
    revertido_por INT,
    razon_reversion TEXT,
    
    -- Observaciones
    notas TEXT,
    
    -- Control
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Índices
    INDEX idx_cuota (cuota_id),
    INDEX idx_contrato (contrato_id),
    INDEX idx_empresa (empresa_id),
    INDEX idx_cliente (cliente_id),
    INDEX idx_fecha_pago (fecha_pago),
    INDEX idx_metodo_pago (metodo_pago),
    INDEX idx_estado (estado),
    INDEX idx_caja (caja_id),
    
    -- Constraints
    FOREIGN KEY (cuota_id) REFERENCES cuotas_financiamiento(id) ON DELETE RESTRICT,
    FOREIGN KEY (contrato_id) REFERENCES contratos_financiamiento(id) ON DELETE RESTRICT,
    FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
    FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE RESTRICT,
    FOREIGN KEY (registrado_por) REFERENCES usuarios(id),
    FOREIGN KEY (revertido_por) REFERENCES usuarios(id) ON DELETE SET NULL
    
    -- Nota: Las validaciones de negocio (montos, etc.)
    -- se realizan a nivel de aplicación, no mediante CHECK constraints
    -- debido a limitaciones de compatibilidad en MySQL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Registro de pagos realizados a contratos de financiamiento';

-- 2.5 Tabla: activos_productos
-- =====================================================

CREATE TABLE IF NOT EXISTS activos_productos (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    
    -- Relaciones
    empresa_id INT NOT NULL,
    producto_id INT NOT NULL COMMENT 'Referencia al producto en catálogo',
    
    -- Identificadores únicos de la unidad física
    codigo_activo VARCHAR(50) UNIQUE
        COMMENT 'Código interno del activo (generado por el sistema)',
    
    numero_serie VARCHAR(100) UNIQUE
        COMMENT 'Número de serie, chasis o IMEI de la unidad física',
    
    vin VARCHAR(50) COMMENT 'VIN (Vehicle Identification Number) para vehículos',
    
    numero_motor VARCHAR(100)
        COMMENT 'Número de motor (para vehículos)',
    
    numero_placa VARCHAR(20)
        COMMENT 'Número de placa (si aplica)',
    
    -- Información específica de esta unidad
    color VARCHAR(50),
    anio_fabricacion INT,
    
    -- Especificaciones técnicas específicas (JSON)
    especificaciones_tecnicas JSON,
    
    -- Estado de la unidad física
    estado ENUM(
        'en_stock',           -- Disponible en inventario
        'vendido',            -- Vendido al contado
        'financiado',         -- Vendido con financiamiento activo
        'asignado',           -- Asignado a cliente (pre-venta)
        'devuelto',           -- Devuelto por el cliente
        'mantenimiento',      -- En mantenimiento/reparación
        'dado_baja'           -- Dado de baja (accidente, robo, etc.)
    ) NOT NULL DEFAULT 'en_stock',
    
    -- Información de compra
    fecha_compra DATE
        COMMENT 'Fecha en que se adquirió esta unidad',
    
    precio_compra DECIMAL(12,2)
        COMMENT 'Precio de compra de esta unidad específica',
    
    -- Información de venta
    fecha_venta DATE
        COMMENT 'Fecha en que se vendió esta unidad',
    
    precio_venta DECIMAL(12,2)
        COMMENT 'Precio de venta de esta unidad específica',
    
    -- Asociación con cliente y contrato
    cliente_id INT DEFAULT NULL
        COMMENT 'Cliente al que se asignó/vendió el activo',
    
    contrato_financiamiento_id INT DEFAULT NULL
        COMMENT 'Contrato de financiamiento asociado (si aplica)',
    
    venta_id INT DEFAULT NULL
        COMMENT 'Venta asociada (si fue vendido)',
    
    -- Garantía específica de esta unidad
    fecha_fin_garantia DATE
        COMMENT 'Fecha de fin de garantía para esta unidad',
    
    -- Ubicación
    ubicacion VARCHAR(100)
        COMMENT 'Ubicación actual del activo (bodega, tienda, cliente, etc.)',
    
    -- Documentos asociados
    codigo_qr TEXT
        COMMENT 'Código QR generado para esta unidad',
    
    documentos_json JSON
        COMMENT 'URLs de documentos (fotos, papeles, facturas de compra)',
    
    -- Mantenimiento
    fecha_ultimo_mantenimiento DATE,
    fecha_proximo_mantenimiento DATE,
    notas_mantenimiento TEXT,
    
    -- Observaciones
    observaciones TEXT,
    
    -- Control de auditoría
    creado_por INT NOT NULL,
    modificado_por INT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Índices
    UNIQUE KEY uk_codigo_activo (codigo_activo),
    UNIQUE KEY uk_numero_serie (numero_serie, empresa_id),
    UNIQUE KEY uk_vin (vin),
    INDEX idx_empresa (empresa_id),
    INDEX idx_producto (producto_id),
    INDEX idx_estado (estado),
    INDEX idx_cliente (cliente_id),
    INDEX idx_contrato (contrato_financiamiento_id),
    INDEX idx_venta (venta_id),
    INDEX idx_placa (numero_placa),
    INDEX idx_fecha_compra (fecha_compra),
    INDEX idx_fecha_venta (fecha_venta),
    
    -- Constraints
    FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
    FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE RESTRICT,
    FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE SET NULL,
    FOREIGN KEY (contrato_financiamiento_id) REFERENCES contratos_financiamiento(id) ON DELETE SET NULL,
    FOREIGN KEY (venta_id) REFERENCES ventas(id) ON DELETE SET NULL,
    FOREIGN KEY (creado_por) REFERENCES usuarios(id),
    FOREIGN KEY (modificado_por) REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Unidades físicas rastreables de productos';

-- 2.6 Tabla: alertas_financiamiento
-- =====================================================

CREATE TABLE IF NOT EXISTS alertas_financiamiento (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    
    -- Relaciones
    empresa_id INT NOT NULL,
    cliente_id INT NOT NULL,
    contrato_id INT,
    cuota_id BIGINT,
    
    -- Tipo de alerta
    tipo_alerta ENUM(
        'vence_10_dias',    -- Vence en 10 días
        'vence_5_dias',     -- Vence en 5 días
        'vence_3_dias',     -- Vence en 3 días
        'vence_hoy',        -- Vence hoy
        'vencida',          -- Vencida
        'cliente_alto_riesgo',  -- Cliente de alto riesgo
        'limite_excedido',  -- Límite excedido
        'clasificacion_bajo' -- Clasificación bajó
    ) NOT NULL,
    
    -- Severidad
    severidad ENUM('baja', 'media', 'alta', 'critica') DEFAULT 'media',
    
    -- Contenido de la alerta
    titulo VARCHAR(255) NOT NULL,
    mensaje TEXT NOT NULL,
    datos_contexto JSON COMMENT 'Datos adicionales',
    
    -- Estado de la alerta
    estado ENUM('activa', 'vista', 'resuelta', 'descartada') DEFAULT 'activa',
    
    -- Asignación
    asignado_a INT COMMENT 'Usuario asignado (cobrador)',
    fecha_asignacion TIMESTAMP NULL,
    
    -- Acciones
    accion_realizada TEXT,
    resuelta_por INT,
    fecha_resolucion TIMESTAMP NULL,
    
    -- Notificaciones enviadas
    notificacion_enviada BOOLEAN DEFAULT FALSE,
    canales_notificacion JSON COMMENT '["email", "whatsapp", "sms"]',
    fecha_notificacion TIMESTAMP NULL,
    
    -- Control
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Índices
    INDEX idx_empresa (empresa_id),
    INDEX idx_cliente (cliente_id),
    INDEX idx_contrato (contrato_id),
    INDEX idx_cuota (cuota_id),
    INDEX idx_tipo (tipo_alerta),
    INDEX idx_severidad (severidad),
    INDEX idx_estado (estado),
    INDEX idx_asignado (asignado_a),
    INDEX idx_fecha_creacion (fecha_creacion),
    
    -- Constraints
    FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
    FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE,
    FOREIGN KEY (contrato_id) REFERENCES contratos_financiamiento(id) ON DELETE CASCADE,
    FOREIGN KEY (cuota_id) REFERENCES cuotas_financiamiento(id) ON DELETE CASCADE,
    FOREIGN KEY (asignado_a) REFERENCES usuarios(id) ON DELETE SET NULL,
    FOREIGN KEY (resuelta_por) REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Sistema de alertas y notificaciones para financiamientos';

-- 2.7 Tabla: plantillas_notificaciones
-- =====================================================

CREATE TABLE IF NOT EXISTS plantillas_notificaciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    
    -- Relaciones
    empresa_id INT NULL COMMENT 'NULL = plantilla global',
    
    -- Identificación
    codigo VARCHAR(50) NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    
    -- Tipo de notificación
    tipo_notificacion ENUM(
        'recordatorio_pago',
        'pago_recibido',
        'pago_vencido',
        'contrato_creado',
        'contrato_completado',
        'credito_aprobado',
        'credito_denegado'
    ) NOT NULL,
    
    -- Canal
    canal ENUM('email', 'whatsapp', 'sms', 'push') NOT NULL,
    
    -- Contenido
    asunto VARCHAR(255) COMMENT 'Para email',
    cuerpo TEXT NOT NULL COMMENT 'Contenido (puede incluir variables)',
    
    -- Variables disponibles (JSON)
    variables_disponibles JSON,
    
    -- Configuración
    activa BOOLEAN DEFAULT TRUE,
    
    -- Control
    creado_por INT NOT NULL,
    modificado_por INT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Índices
    UNIQUE KEY uk_codigo_empresa (codigo, empresa_id),
    INDEX idx_empresa (empresa_id),
    INDEX idx_tipo (tipo_notificacion),
    INDEX idx_canal (canal),
    INDEX idx_activa (activa),
    
    -- Constraints
    FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
    FOREIGN KEY (creado_por) REFERENCES usuarios(id),
    FOREIGN KEY (modificado_por) REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Plantillas de notificaciones para financiamiento';

-- 2.8 Tabla: historial_notificaciones
-- =====================================================

CREATE TABLE IF NOT EXISTS historial_notificaciones (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    
    -- Relaciones
    empresa_id INT NOT NULL,
    cliente_id INT NOT NULL,
    contrato_id INT,
    cuota_id BIGINT,
    plantilla_id INT,
    
    -- Tipo y canal
    tipo_notificacion VARCHAR(50) NOT NULL,
    canal ENUM('email', 'whatsapp', 'sms', 'push') NOT NULL,
    
    -- Destinatario
    email_destinatario VARCHAR(255),
    telefono_destinatario VARCHAR(20),
    nombre_destinatario VARCHAR(255),
    
    -- Contenido enviado
    asunto VARCHAR(255),
    cuerpo TEXT,
    
    -- Estado del envío
    estado ENUM('pendiente', 'enviado', 'entregado', 'fallido', 'rebotado') DEFAULT 'pendiente',
    
    -- Respuesta del proveedor
    respuesta_proveedor JSON,
    mensaje_error TEXT,
    
    -- Fechas
    fecha_envio TIMESTAMP NULL,
    fecha_entrega TIMESTAMP NULL,
    
    -- Control
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Índices
    INDEX idx_empresa (empresa_id),
    INDEX idx_cliente (cliente_id),
    INDEX idx_contrato (contrato_id),
    INDEX idx_canal (canal),
    INDEX idx_estado (estado),
    INDEX idx_fecha_creacion (fecha_creacion),
    
    -- Constraints
    FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
    FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE,
    FOREIGN KEY (contrato_id) REFERENCES contratos_financiamiento(id) ON DELETE SET NULL,
    FOREIGN KEY (cuota_id) REFERENCES cuotas_financiamiento(id) ON DELETE SET NULL,
    FOREIGN KEY (plantilla_id) REFERENCES plantillas_notificaciones(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Historial de notificaciones enviadas';

-- =====================================================
-- 3. FOREIGN KEYS ADICIONALES (después de crear tablas)
-- =====================================================

-- Foreign key de ventas a contratos_financiamiento
-- (solo si la columna existe y no tiene FK)
SET @preparedStatement = (SELECT IF(
    (
        SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
        WHERE
            (TABLE_SCHEMA = @dbname)
            AND (TABLE_NAME = 'ventas')
            AND (CONSTRAINT_NAME = 'fk_venta_contrato_financiamiento')
    ) > 0,
    "SELECT 1",
    "ALTER TABLE ventas ADD CONSTRAINT fk_venta_contrato_financiamiento FOREIGN KEY (contrato_financiamiento_id) REFERENCES contratos_financiamiento(id) ON DELETE SET NULL"
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Índice para ventas.financiamiento
SET @indexName = 'idx_financiamiento';
SET @tableName = 'ventas';
SET @preparedStatement = (
    SELECT IF(
        (
            SELECT COUNT(*) 
            FROM INFORMATION_SCHEMA.STATISTICS
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = @tableName
              AND INDEX_NAME = @indexName
        ) > 0,
        'SELECT 1',
        CONCAT('CREATE INDEX ', @indexName, ' ON ', @tableName, ' (tiene_financiamiento, contrato_financiamiento_id)')
    )
);
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Foreign key de pagos_financiamiento a cajas (solo si la tabla cajas existe)
SET @preparedStatement = (SELECT IF(
    (
        SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES
        WHERE
            (TABLE_SCHEMA = @dbname)
            AND (TABLE_NAME = 'cajas')
    ) > 0,
    (SELECT IF(
        (
            SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
            WHERE
                (TABLE_SCHEMA = @dbname)
                AND (TABLE_NAME = 'pagos_financiamiento')
                AND (CONSTRAINT_NAME = 'fk_pago_caja')
        ) > 0,
        "SELECT 1",
        "ALTER TABLE pagos_financiamiento ADD CONSTRAINT fk_pago_caja FOREIGN KEY (caja_id) REFERENCES cajas(id) ON DELETE SET NULL"
    )),
    "SELECT 1"
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- =====================================================
-- 4. DATOS INICIALES (OPCIONAL)
-- =====================================================

-- Verificar y agregar columna tasa_interes_mensual si no existe
-- (por si la tabla fue creada antes de esta migración)
SET @tablename = 'planes_financiamiento';
SET @preparedStatement = (SELECT IF(
    (
        SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
        WHERE
            (TABLE_SCHEMA = DATABASE())
            AND (TABLE_NAME = @tablename)
            AND (COLUMN_NAME = 'tasa_interes_mensual')
    ) > 0,
    'SELECT 1',
    CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN tasa_interes_mensual DECIMAL(5,4) NOT NULL DEFAULT 0.01 COMMENT ''Calculado automáticamente'' AFTER tasa_interes_anual')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Insertar planes de ejemplo (solo si no existen)
-- Nota: La tasa_interes_mensual se calcula como: (1 + tasa_anual/100)^(1/12) - 1
-- Ejemplo: 18% anual = (1.18)^(1/12) - 1 = 0.013888 = 1.3888%
INSERT IGNORE INTO planes_financiamiento (
    empresa_id, codigo, nombre, descripcion,
    plazo_meses, tasa_interes_anual, tasa_interes_mensual,
    pago_inicial_minimo_pct, penalidad_mora_pct, dias_gracia,
    activo, permite_pago_anticipado, creado_por
) VALUES
(
    NULL, 'PLAN-6M-15', 'Plan 6 Meses - 15%', 'Plan de financiamiento a 6 meses con tasa del 15% anual',
    6, 15.00, 0.011715, -- Tasa mensual: (1.15)^(1/12) - 1
    20.00, 5.00, 5,
    TRUE, TRUE, 1
),
(
    NULL, 'PLAN-12M-18', 'Plan 12 Meses - 18%', 'Plan de financiamiento a 12 meses con tasa del 18% anual',
    12, 18.00, 0.013888, -- Tasa mensual: (1.18)^(1/12) - 1
    15.00, 5.00, 5,
    TRUE, TRUE, 1
),
(
    NULL, 'PLAN-18M-20', 'Plan 18 Meses - 20%', 'Plan de financiamiento a 18 meses con tasa del 20% anual',
    18, 20.00, 0.015309, -- Tasa mensual: (1.20)^(1/12) - 1
    20.00, 5.00, 5,
    TRUE, TRUE, 1
),
(
    NULL, 'PLAN-24M-22', 'Plan 24 Meses - 22%', 'Plan de financiamiento a 24 meses con tasa del 22% anual',
    24, 22.00, 0.016680, -- Tasa mensual: (1.22)^(1/12) - 1
    25.00, 5.00, 5,
    TRUE, TRUE, 1
);

-- =====================================================
-- 5. VERIFICACIÓN FINAL
-- =====================================================

-- Verificar que todas las tablas se crearon correctamente
SELECT 
    'planes_financiamiento' AS tabla,
    COUNT(*) AS registros
FROM planes_financiamiento
UNION ALL
SELECT 
    'contratos_financiamiento' AS tabla,
    COUNT(*) AS registros
FROM contratos_financiamiento
UNION ALL
SELECT 
    'cuotas_financiamiento' AS tabla,
    COUNT(*) AS registros
FROM cuotas_financiamiento
UNION ALL
SELECT 
    'pagos_financiamiento' AS tabla,
    COUNT(*) AS registros
FROM pagos_financiamiento
UNION ALL
SELECT 
    'activos_productos' AS tabla,
    COUNT(*) AS registros
FROM activos_productos
UNION ALL
SELECT 
    'alertas_financiamiento' AS tabla,
    COUNT(*) AS registros
FROM alertas_financiamiento
UNION ALL
SELECT 
    'plantillas_notificaciones' AS tabla,
    COUNT(*) AS registros
FROM plantillas_notificaciones
UNION ALL
SELECT 
    'historial_notificaciones' AS tabla,
    COUNT(*) AS registros
FROM historial_notificaciones;

-- =====================================================
-- FIN DE LA MIGRACIÓN
-- =====================================================

SET FOREIGN_KEY_CHECKS = 1;
COMMIT;

-- Mensaje de confirmación
SELECT 'Migración de Financiamiento completada exitosamente' AS mensaje;

