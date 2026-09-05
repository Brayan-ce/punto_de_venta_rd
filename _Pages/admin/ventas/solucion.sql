-- ============================================
-- TABLA: historial_credito
-- Registra todos los eventos del ciclo de vida crediticio
-- ============================================
CREATE TABLE historial_credito (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    credito_cliente_id BIGINT NOT NULL,
    empresa_id INT NOT NULL,
    cliente_id INT NOT NULL,
    
    -- Tipo de evento
    tipo_evento ENUM(
        'creacion_credito',      -- Nueva venta a crédito
        'pago_realizado',        -- Cliente realizó pago
        'pago_parcial',          -- Abono parcial
        'vencimiento',           -- Factura venció
        'reestructuracion',      -- Se reestructuró deuda
        'ajuste_limite',         -- Cambio en límite de crédito
        'cambio_clasificacion',  -- Cambió clasificación A/B/C/D
        'bloqueo',               -- Crédito bloqueado
        'desbloqueo',            -- Crédito desbloqueado
        'suspension',            -- Crédito suspendido
        'reactivacion',          -- Crédito reactivado
        'castigo',               -- Deuda castigada (incobrable)
        'nota_credito',          -- Nota de crédito aplicada
        'nota_debito'            -- Nota de débito aplicada
    ) NOT NULL,
    
    -- Descripción del evento
    descripcion TEXT,
    
    -- Snapshots (estado antes y después)
    datos_anteriores JSON COMMENT 'Estado antes del cambio',
    datos_nuevos JSON COMMENT 'Estado después del cambio',
    
    -- Contexto del momento
    clasificacion_momento ENUM('A','B','C','D') COMMENT 'Clasificación en ese momento',
    score_momento INT COMMENT 'Score crediticio en ese momento',
    saldo_utilizado_momento DECIMAL(12,2) COMMENT 'Saldo utilizado en ese momento',
    saldo_disponible_momento DECIMAL(12,2) COMMENT 'Saldo disponible en ese momento',
    
    -- Referencias externas
    venta_id INT COMMENT 'ID de venta relacionada',
    cxc_id BIGINT COMMENT 'ID de cuenta por cobrar relacionada',
    
    -- Auditoría
    generado_por ENUM('sistema','usuario','trigger','cron') DEFAULT 'sistema',
    usuario_id INT COMMENT 'Usuario que generó el evento (si aplica)',
    
    fecha_evento TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Índices
    INDEX idx_credito (credito_cliente_id),
    INDEX idx_cliente (cliente_id),
    INDEX idx_empresa (empresa_id),
    INDEX idx_tipo_evento (tipo_evento),
    INDEX idx_fecha (fecha_evento),
    INDEX idx_venta (venta_id),
    INDEX idx_cxc (cxc_id),
    
    -- Constraints
    FOREIGN KEY (credito_cliente_id) REFERENCES credito_clientes(id) ON DELETE CASCADE,
    FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
    FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE,
    FOREIGN KEY (venta_id) REFERENCES ventas(id) ON DELETE SET NULL,
    FOREIGN KEY (cxc_id) REFERENCES cuentas_por_cobrar(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci 
COMMENT='Historial completo de eventos crediticios';


-- ============================================
-- TABLA: alertas_credito
-- Sistema de alertas automáticas para gestión de riesgo
-- ============================================
CREATE TABLE alertas_credito (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    credito_cliente_id BIGINT NOT NULL,
    empresa_id INT NOT NULL,
    cliente_id INT NOT NULL,
    
    -- Tipo de alerta
    tipo_alerta ENUM(
        'limite_excedido',           -- Saldo utilizado > límite
        'proximo_vencimiento',       -- Factura vence pronto
        'pago_vencido',              -- Pago atrasado
        'patron_pago_irregular',     -- Patrón de pago sospechoso
        'multiple_reestructuracion', -- Muchas reestructuraciones
        'clasificacion_bajada',      -- Clasificación empeoró
        'score_bajo',                -- Score crediticio bajo
        'uso_credito_alto',          -- Uso > 80% del límite
        'dias_atraso_acumulados',    -- Atrasos frecuentes
        'deuda_vencida_acumulada'    -- Mucha deuda vencida
    ) NOT NULL,
    
    -- Severidad
    severidad ENUM('baja','media','alta','critica') NOT NULL DEFAULT 'media',
    
    -- Estado
    estado ENUM('activa','resuelta','ignorada','expirada') NOT NULL DEFAULT 'activa',
    
    -- Descripción y datos
    titulo VARCHAR(255) NOT NULL,
    descripcion TEXT,
    datos_alerta JSON COMMENT 'Datos específicos de la alerta',
    
    -- Acciones sugeridas
    accion_sugerida TEXT COMMENT 'Qué debería hacer el usuario',
    
    -- Fechas
    fecha_generacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_expiracion TIMESTAMP NULL COMMENT 'Cuándo expira la alerta',
    fecha_resolucion TIMESTAMP NULL COMMENT 'Cuándo se resolvió',
    
    -- Auditoría
    resuelta_por INT COMMENT 'Usuario que resolvió la alerta',
    notas_resolucion TEXT COMMENT 'Notas sobre la resolución',
    
    -- Índices
    INDEX idx_credito (credito_cliente_id),
    INDEX idx_cliente (cliente_id),
    INDEX idx_empresa (empresa_id),
    INDEX idx_tipo (tipo_alerta),
    INDEX idx_severidad (severidad),
    INDEX idx_estado (estado),
    INDEX idx_fecha_generacion (fecha_generacion),
    INDEX idx_activas (estado, severidad) COMMENT 'Para consultas rápidas de alertas activas',
    
    -- Constraints
    FOREIGN KEY (credito_cliente_id) REFERENCES credito_clientes(id) ON DELETE CASCADE,
    FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
    FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE,
    FOREIGN KEY (resuelta_por) REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Sistema de alertas de riesgo crediticio';


ALTER TABLE ventas 
MODIFY COLUMN metodo_pago ENUM(
    'efectivo',
    'tarjeta_debito', 
    'tarjeta_credito',
    'transferencia',
    'cheque',
    'credito'  -- AGREGAR ESTA OPCIÓN
) NOT NULL DEFAULT 'efectivo';