-- ================================================================
-- MÓDULO DE EVALUACIÓN Y CONTROL DE CRÉDITO - POS ISIWEEK
-- Versión: 1.0
-- Fecha: 2025-01-21
-- Descripción: Schema completo para gestión de créditos a clientes
-- ================================================================

-- ================================================================
-- TABLA 1: CONFIGURACIÓN DE CRÉDITO POR CLIENTE
-- Almacena los límites y condiciones de crédito autorizados
-- ================================================================
CREATE TABLE IF NOT EXISTS credito_clientes
(
    id                        BIGINT AUTO_INCREMENT PRIMARY KEY,

    -- Relaciones
    cliente_id                INT                                                       NOT NULL,
    empresa_id                INT                                                       NOT NULL,

    -- Límites de crédito
    limite_credito            DECIMAL(12, 2)                                            NOT NULL DEFAULT 0.00
        COMMENT 'Monto máximo autorizado para crédito',
    saldo_utilizado           DECIMAL(12, 2)                                            NOT NULL DEFAULT 0.00
        COMMENT 'Monto actualmente en uso',
    saldo_disponible          DECIMAL(12, 2) GENERATED ALWAYS AS (limite_credito - saldo_utilizado) STORED
        COMMENT 'Crédito disponible (calculado automáticamente)',

    -- Frecuencia de pago
    frecuencia_pago           ENUM ('semanal', 'quincenal', 'mensual', 'personalizada') NOT NULL DEFAULT 'mensual',
    dias_plazo                INT                                                                DEFAULT 30
        COMMENT 'Días de plazo para pago (usado si es personalizada)',

    -- Estado del crédito
    estado_credito            ENUM ('normal', 'atrasado', 'bloqueado', 'suspendido')    NOT NULL DEFAULT 'normal',
    razon_estado              VARCHAR(255)
        COMMENT 'Motivo del estado actual (ej: "Pago atrasado 15 días")',

    -- Clasificación crediticia
    clasificacion             ENUM ('A', 'B', 'C', 'D')                                          DEFAULT 'A'
        COMMENT 'A=Excelente, B=Bueno, C=Regular, D=Moroso',
    score_crediticio          INT                                                                DEFAULT 100
        COMMENT 'Puntaje de 0-100, calculado automáticamente',

    -- Fechas de control
    fecha_ultima_evaluacion   TIMESTAMP                                                 NULL
        COMMENT 'Última vez que se recalculó la clasificación',
    fecha_proximo_vencimiento DATE                                                      NULL
        COMMENT 'Próxima fecha de pago esperada',
    fecha_ultimo_pago         TIMESTAMP                                                 NULL,

    -- Métricas de comportamiento
    total_creditos_otorgados  INT                                                                DEFAULT 0,
    total_creditos_pagados    INT                                                                DEFAULT 0,
    total_creditos_vencidos   INT                                                                DEFAULT 0,
    promedio_dias_pago        DECIMAL(5, 2)                                                      DEFAULT 0.00
        COMMENT 'Promedio de días que tarda en pagar',

    -- Auditoría
    creado_por                INT                                                       NOT NULL,
    modificado_por            INT                                                       NULL,
    fecha_creacion            TIMESTAMP                                                          DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion       TIMESTAMP                                                          DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- Índices
    INDEX idx_cliente (cliente_id),
    INDEX idx_empresa (empresa_id),
    INDEX idx_estado (estado_credito),
    INDEX idx_clasificacion (clasificacion),
    INDEX idx_vencimiento (fecha_proximo_vencimiento),

    -- Claves foráneas
    CONSTRAINT fk_credito_cliente
        FOREIGN KEY (cliente_id) REFERENCES clientes (id) ON DELETE CASCADE,
    CONSTRAINT fk_credito_empresa
        FOREIGN KEY (empresa_id) REFERENCES empresas (id) ON DELETE CASCADE,
    CONSTRAINT fk_credito_creador
        FOREIGN KEY (creado_por) REFERENCES usuarios (id),
    CONSTRAINT fk_credito_modificador
        FOREIGN KEY (modificado_por) REFERENCES usuarios (id) ON DELETE SET NULL,

    -- Restricciones
    CONSTRAINT uk_cliente_empresa UNIQUE (cliente_id, empresa_id),
    CONSTRAINT chk_limite_positivo CHECK (limite_credito >= 0),
    CONSTRAINT chk_saldo_valido CHECK (saldo_utilizado >= 0 AND saldo_utilizado <= limite_credito),
    CONSTRAINT chk_score_rango CHECK (score_crediticio BETWEEN 0 AND 100)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_0900_ai_ci
    COMMENT ='Configuración de crédito autorizado por cliente';


-- ================================================================
-- TABLA 2: DEUDAS/CUENTAS POR COBRAR
-- Registra cada venta a crédito como una deuda individual
-- ================================================================
CREATE TABLE IF NOT EXISTS cuentas_por_cobrar
(
    id                         BIGINT AUTO_INCREMENT PRIMARY KEY,

    -- Relaciones
    credito_cliente_id         BIGINT         NOT NULL,
    empresa_id                 INT            NOT NULL,
    cliente_id                 INT            NOT NULL,
    venta_id                   INT            NULL COMMENT 'Venta que originó la deuda',
    cotizacion_id              INT            NULL COMMENT 'Cotización que originó la deuda',

    -- Tipo de origen
    origen                     ENUM ('venta', 'cotizacion', 'ajuste_manual')
                                              NOT NULL DEFAULT 'venta',
    numero_documento           VARCHAR(50)
                                              NOT NULL COMMENT 'NCF o número de documento',

    -- Montos
    monto_total                DECIMAL(12, 2) NOT NULL,
    monto_pagado               DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    saldo_pendiente            DECIMAL(12, 2)
        GENERATED ALWAYS AS (monto_total - monto_pagado) STORED,

    -- Fechas críticas
    fecha_emision              DATE           NOT NULL,
    fecha_vencimiento          DATE           NOT NULL,
    fecha_vencimiento_original DATE           NOT NULL
        COMMENT 'Vencimiento original (por si se reestructura)',

    -- ⚠️ CORREGIDO: ya NO es columna generada
    dias_atraso                INT            NOT NULL DEFAULT 0
        COMMENT 'Días de atraso calculados por trigger o proceso automático',

    -- Estado de la cuenta
    estado_cxc                 ENUM (
        'activa',
        'vencida',
        'pagada',
        'parcial',
        'reestructurada',
        'castigada'
        )                                     NOT NULL DEFAULT 'activa',

    -- Clasificación de antigüedad (Aging)
    rango_antiguedad           ENUM (
        'corriente',
        '1-7_dias',
        '8-15_dias',
        '16-30_dias',
        'mas_30_dias'
        )
        GENERATED ALWAYS AS (
            CASE
                WHEN dias_atraso = 0 THEN 'corriente'
                WHEN dias_atraso BETWEEN 1 AND 7 THEN '1-7_dias'
                WHEN dias_atraso BETWEEN 8 AND 15 THEN '8-15_dias'
                WHEN dias_atraso BETWEEN 16 AND 30 THEN '16-30_dias'
                ELSE 'mas_30_dias'
                END
            ) STORED,

    -- Control de pagos
    fecha_ultimo_abono         TIMESTAMP      NULL,
    numero_abonos              INT                     DEFAULT 0,

    -- Observaciones
    notas                      TEXT,
    razon_reestructuracion     TEXT COMMENT 'Si fue reestructurada, explicar por qué',

    -- Auditoría
    creado_por                 INT            NOT NULL,
    fecha_creacion             TIMESTAMP               DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion        TIMESTAMP               DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    -- Índices
    INDEX idx_credito (credito_cliente_id),
    INDEX idx_empresa (empresa_id),
    INDEX idx_cliente (cliente_id),
    INDEX idx_venta (venta_id),
    INDEX idx_estado (estado_cxc),
    INDEX idx_vencimiento (fecha_vencimiento),
    INDEX idx_emision (fecha_emision),
    INDEX idx_antiguedad (rango_antiguedad),

    -- Claves foráneas
    CONSTRAINT fk_cxc_credito
        FOREIGN KEY (credito_cliente_id)
            REFERENCES credito_clientes (id)
            ON DELETE CASCADE,

    CONSTRAINT fk_cxc_empresa
        FOREIGN KEY (empresa_id)
            REFERENCES empresas (id)
            ON DELETE CASCADE,

    CONSTRAINT fk_cxc_cliente
        FOREIGN KEY (cliente_id)
            REFERENCES clientes (id)
            ON DELETE CASCADE,

    CONSTRAINT fk_cxc_venta
        FOREIGN KEY (venta_id)
            REFERENCES ventas (id)
            ON DELETE SET NULL,

    CONSTRAINT fk_cxc_cotizacion
        FOREIGN KEY (cotizacion_id)
            REFERENCES cotizaciones (id)
            ON DELETE SET NULL,

    CONSTRAINT fk_cxc_creador
        FOREIGN KEY (creado_por)
            REFERENCES usuarios (id),

    -- Restricciones
    CONSTRAINT chk_monto_positivo
        CHECK (monto_total > 0),

    CONSTRAINT chk_pagado_valido
        CHECK (monto_pagado >= 0 AND monto_pagado <= monto_total),

    CONSTRAINT chk_fechas_validas
        CHECK (fecha_vencimiento >= fecha_emision)
)
    ENGINE = InnoDB
    DEFAULT CHARSET = utf8mb4
    COLLATE = utf8mb4_0900_ai_ci
    COMMENT = 'Registro de deudas y cuentas por cobrar';



-- ================================================================
-- TABLA 3: ABONOS A CUENTAS POR COBRAR
-- Registra cada pago parcial o total
-- ================================================================
CREATE TABLE IF NOT EXISTS abonos_credito
(
    id                   BIGINT AUTO_INCREMENT PRIMARY KEY,

    -- Relaciones
    cxc_id               BIGINT         NOT NULL,
    empresa_id           INT            NOT NULL,
    cliente_id           INT            NOT NULL,

    -- Monto del abono
    monto_abonado        DECIMAL(12, 2) NOT NULL,

    -- Método de pago
    metodo_pago          ENUM (
        'efectivo',
        'tarjeta_debito',
        'tarjeta_credito',
        'transferencia',
        'cheque',
        'mixto'
        )                               NOT NULL,

    referencia_pago      VARCHAR(100)
        COMMENT 'Número de cheque, referencia de transferencia, etc.',

    -- Análisis del pago (⚠️ YA NO GENERADO)
    es_pago_tardio       TINYINT(1)     NOT NULL DEFAULT 0
        COMMENT '1 = pago realizado con atraso',

    dias_atraso_al_pagar INT            NOT NULL DEFAULT 0
        COMMENT 'Días de atraso exactos al momento del pago',

    -- Observaciones
    notas                TEXT,

    -- Auditoría
    registrado_por       INT            NOT NULL,
    fecha_abono          TIMESTAMP               DEFAULT CURRENT_TIMESTAMP,

    -- Índices
    INDEX idx_cxc (cxc_id),
    INDEX idx_empresa (empresa_id),
    INDEX idx_cliente (cliente_id),
    INDEX idx_fecha (fecha_abono),
    INDEX idx_metodo (metodo_pago),

    -- Claves foráneas
    CONSTRAINT fk_abono_cxc
        FOREIGN KEY (cxc_id)
            REFERENCES cuentas_por_cobrar (id)
            ON DELETE CASCADE,

    CONSTRAINT fk_abono_empresa
        FOREIGN KEY (empresa_id)
            REFERENCES empresas (id)
            ON DELETE CASCADE,

    CONSTRAINT fk_abono_cliente
        FOREIGN KEY (cliente_id)
            REFERENCES clientes (id)
            ON DELETE CASCADE,

    CONSTRAINT fk_abono_usuario
        FOREIGN KEY (registrado_por)
            REFERENCES usuarios (id),

    -- Restricciones
    CONSTRAINT chk_abono_positivo
        CHECK (monto_abonado > 0)
)
    ENGINE = InnoDB
    DEFAULT CHARSET = utf8mb4
    COLLATE = utf8mb4_0900_ai_ci
    COMMENT = 'Registro de pagos/abonos a cuentas por cobrar';


-- ================================================================
-- TABLA 4: HISTORIAL DE EVALUACIÓN CREDITICIA
-- Registro inmutable de cambios en la clasificación del cliente
-- ================================================================
CREATE TABLE IF NOT EXISTS historial_credito
(
    id                    BIGINT AUTO_INCREMENT PRIMARY KEY,

    -- Relaciones
    credito_cliente_id    BIGINT                      NOT NULL,
    empresa_id            INT                         NOT NULL,
    cliente_id            INT                         NOT NULL,

    -- Tipo de evento
    tipo_evento           ENUM (
        'creacion_credito',
        'ajuste_limite',
        'pago_realizado',
        'pago_tardio',
        'credito_vencido',
        'bloqueo_credito',
        'desbloqueo_credito',
        'cambio_clasificacion',
        'reestructuracion',
        'castigo_deuda',
        'nota_manual'
        )                                             NOT NULL,

    -- Detalles del evento
    descripcion           TEXT                        NOT NULL,

    -- Datos del cambio (JSON)
    datos_anteriores      JSON COMMENT 'Estado antes del cambio',
    datos_nuevos          JSON COMMENT 'Estado después del cambio',

    -- Clasificación al momento del evento
    clasificacion_momento ENUM ('A', 'B', 'C', 'D'),
    score_momento         INT,

    -- Auditoría
    generado_por          ENUM ('sistema', 'usuario') NOT NULL DEFAULT 'sistema',
    usuario_id            INT                         NULL,
    fecha_evento          TIMESTAMP                            DEFAULT CURRENT_TIMESTAMP,

    -- Índices
    INDEX idx_credito (credito_cliente_id),
    INDEX idx_empresa (empresa_id),
    INDEX idx_cliente (cliente_id),
    INDEX idx_tipo (tipo_evento),
    INDEX idx_fecha (fecha_evento),

    -- Claves foráneas
    CONSTRAINT fk_historial_credito
        FOREIGN KEY (credito_cliente_id) REFERENCES credito_clientes (id) ON DELETE CASCADE,
    CONSTRAINT fk_historial_empresa
        FOREIGN KEY (empresa_id) REFERENCES empresas (id) ON DELETE CASCADE,
    CONSTRAINT fk_historial_cliente
        FOREIGN KEY (cliente_id) REFERENCES clientes (id) ON DELETE CASCADE,
    CONSTRAINT fk_historial_usuario
        FOREIGN KEY (usuario_id) REFERENCES usuarios (id) ON DELETE SET NULL
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_0900_ai_ci
    COMMENT ='Historial inmutable de eventos crediticios';


-- ================================================================
-- TABLA 5: ALERTAS DE CRÉDITO
-- Alertas automáticas generadas por el sistema
-- ================================================================
CREATE TABLE IF NOT EXISTS alertas_credito
(
    id                 BIGINT AUTO_INCREMENT PRIMARY KEY,

    -- Relaciones
    empresa_id         INT                                                NOT NULL,
    cliente_id         INT                                                NOT NULL,
    credito_cliente_id BIGINT                                             NULL,
    cxc_id             BIGINT                                             NULL,

    -- Tipo de alerta
    tipo_alerta        ENUM (
        'credito_excedido',
        'vencimiento_proximo',
        'credito_vencido',
        'atraso_grave',
        'clasificacion_degradada',
        'stock_bajo_cliente_moroso',
        'otra'
        )                                                                 NOT NULL,

    -- Severidad
    severidad          ENUM ('baja', 'media', 'alta', 'critica')          NOT NULL DEFAULT 'media',

    -- Contenido
    titulo             VARCHAR(255)                                       NOT NULL,
    mensaje            TEXT                                               NOT NULL,
    datos_contexto     JSON COMMENT 'Datos adicionales de la alerta',

    -- Estado
    estado             ENUM ('activa', 'vista', 'resuelta', 'descartada') NOT NULL DEFAULT 'activa',

    -- Asignación
    asignada_a         INT                                                NULL COMMENT 'Usuario asignado para resolver',
    resuelta_por       INT                                                NULL,
    accion_tomada      TEXT,

    -- Fechas
    fecha_generacion   TIMESTAMP                                                   DEFAULT CURRENT_TIMESTAMP,
    fecha_vista        TIMESTAMP                                          NULL,
    fecha_resolucion   TIMESTAMP                                          NULL,

    -- Índices
    INDEX idx_empresa (empresa_id),
    INDEX idx_cliente (cliente_id),
    INDEX idx_tipo (tipo_alerta),
    INDEX idx_severidad (severidad),
    INDEX idx_estado (estado),
    INDEX idx_asignada (asignada_a),
    INDEX idx_fecha (fecha_generacion),

    -- Claves foráneas
    CONSTRAINT fk_alerta_empresa
        FOREIGN KEY (empresa_id) REFERENCES empresas (id) ON DELETE CASCADE,
    CONSTRAINT fk_alerta_cliente
        FOREIGN KEY (cliente_id) REFERENCES clientes (id) ON DELETE CASCADE,
    CONSTRAINT fk_alerta_credito
        FOREIGN KEY (credito_cliente_id) REFERENCES credito_clientes (id) ON DELETE SET NULL,
    CONSTRAINT fk_alerta_cxc
        FOREIGN KEY (cxc_id) REFERENCES cuentas_por_cobrar (id) ON DELETE SET NULL,
    CONSTRAINT fk_alerta_asignada
        FOREIGN KEY (asignada_a) REFERENCES usuarios (id) ON DELETE SET NULL,
    CONSTRAINT fk_alerta_resuelta
        FOREIGN KEY (resuelta_por) REFERENCES usuarios (id) ON DELETE SET NULL
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_0900_ai_ci
    COMMENT ='Alertas automáticas del sistema de crédito';


-- ================================================================
-- TABLA 6: REGLAS DE NEGOCIO CONFIGURABLES
-- Permite al negocio definir sus propias políticas de crédito
-- ================================================================
CREATE TABLE IF NOT EXISTS reglas_credito
(
    id                  INT AUTO_INCREMENT PRIMARY KEY,

    empresa_id          INT          NULL COMMENT 'NULL = regla global del sistema',

    -- Identificación de la regla
    codigo              VARCHAR(50)  NOT NULL UNIQUE,
    nombre              VARCHAR(100) NOT NULL,
    descripcion         TEXT,

    -- Tipo de regla
    categoria           ENUM (
        'limite_credito',
        'clasificacion',
        'bloqueo',
        'alerta',
        'scoring'
        )                            NOT NULL,

    -- Configuración (JSON)
    configuracion       JSON         NOT NULL COMMENT 'Parámetros específicos de la regla',

    -- Ejemplo de configuración:
    -- {
    --   "limite_default": 5000,
    --   "dias_gracia": 3,
    --   "penalizacion_por_atraso": 10,
    --   "dias_para_degradar_clasificacion": 15
    -- }

    -- Estado
    activo              BOOLEAN   DEFAULT TRUE,
    orden_ejecucion     INT       DEFAULT 0 COMMENT 'Orden en que se aplican las reglas',

    -- Auditoría
    creado_por          INT,
    modificado_por      INT,
    fecha_creacion      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- Índices
    INDEX idx_empresa (empresa_id),
    INDEX idx_categoria (categoria),
    INDEX idx_activo (activo),
    INDEX idx_orden (orden_ejecucion),

    -- Claves foráneas
    CONSTRAINT fk_regla_empresa
        FOREIGN KEY (empresa_id) REFERENCES empresas (id) ON DELETE CASCADE,
    CONSTRAINT fk_regla_creador
        FOREIGN KEY (creado_por) REFERENCES usuarios (id) ON DELETE SET NULL,
    CONSTRAINT fk_regla_modificador
        FOREIGN KEY (modificado_por) REFERENCES usuarios (id) ON DELETE SET NULL
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_0900_ai_ci
    COMMENT ='Reglas configurables de negocio para crédito';


-- ================================================================
-- INSERTAR REGLAS PREDETERMINADAS DEL SISTEMA
-- ================================================================
-- ================================================================
-- INSERTAR REGLAS PREDETERMINADAS DEL SISTEMA
-- ================================================================

INSERT INTO reglas_credito
(
    empresa_id,
    codigo,
    nombre,
    descripcion,
    categoria,
    configuracion,
    activo
)
SELECT
    NULL,
    'LIMITE_DEFAULT',
    'Límite de crédito por defecto',
    'Límite inicial para nuevos clientes',
    'limite_credito',
    JSON_OBJECT(
            'limite_default', 5000,
            'moneda', 'DOP'
    ),
    1
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1
    FROM reglas_credito
    WHERE codigo = 'LIMITE_DEFAULT'
);

