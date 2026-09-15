-- =====================================================
-- MIGRACIÓN: Crear tabla reglas_credito e insertar datos iniciales
-- =====================================================
-- Fecha: 2026-01-26
-- Descripción: Crea la tabla reglas_credito si no existe
--              e inserta las 6 reglas predeterminadas del sistema
-- =====================================================

USE punto_venta_rd;

SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;
SET time_zone = "+00:00";

-- =====================================================
-- CREAR TABLA: reglas_credito
-- =====================================================

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

    -- Estado
    activo              BOOLEAN     DEFAULT TRUE,
    orden_ejecucion     INT          DEFAULT 0 COMMENT 'Orden en que se aplican las reglas',

    -- Auditoría
    creado_por          INT,
    modificado_por      INT,
    fecha_creacion      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

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
  COLLATE = utf8mb4_unicode_ci
    COMMENT ='Reglas configurables de negocio para crédito';

-- =====================================================
-- INSERTAR REGLAS PREDETERMINADAS DEL SISTEMA
-- =====================================================
-- Usamos INSERT IGNORE para evitar errores si los registros ya existen

-- Regla 1: LIMITE_DEFAULT
INSERT IGNORE INTO reglas_credito
    (id, empresa_id, codigo, nombre, descripcion, categoria, configuracion, activo, orden_ejecucion, creado_por, modificado_por, fecha_creacion, fecha_actualizacion)
VALUES
    (
        1,
        NULL,
        'LIMITE_DEFAULT',
        'Límite de crédito por defecto',
        'Límite inicial para nuevos clientes',
        'limite_credito',
        JSON_OBJECT(
            'moneda', 'DOP',
            'limite_default', 5000
        ),
        1,
        0,
        NULL,
        NULL,
        '2026-01-21 20:53:35',
        '2026-01-21 20:53:35'
    );

-- Regla 2: CLASIFICACION_A
INSERT IGNORE INTO reglas_credito
    (id, empresa_id, codigo, nombre, descripcion, categoria, configuracion, activo, orden_ejecucion, creado_por, modificado_por, fecha_creacion, fecha_actualizacion)
VALUES
    (
        2,
        NULL,
        'CLASIFICACION_A',
        'Criterios para clasificación A',
        'Cliente excelente - sin atrasos',
        'clasificacion',
        JSON_OBJECT(
            'score_minimo', 90,
            'min_creditos_pagados', 3,
            'max_atrasos_ultimo_ano', 0
        ),
        1,
        0,
        NULL,
        NULL,
        '2026-01-21 20:53:35',
        '2026-01-21 20:53:35'
    );

-- Regla 3: CLASIFICACION_B
INSERT IGNORE INTO reglas_credito
    (id, empresa_id, codigo, nombre, descripcion, categoria, configuracion, activo, orden_ejecucion, creado_por, modificado_por, fecha_creacion, fecha_actualizacion)
VALUES
    (
        3,
        NULL,
        'CLASIFICACION_B',
        'Criterios para clasificación B',
        'Cliente bueno - atrasos ocasionales',
        'clasificacion',
        JSON_OBJECT(
            'score_minimo', 70,
            'max_atrasos_ultimo_ano', 2,
            'max_dias_atraso_promedio', 7
        ),
        1,
        0,
        NULL,
        NULL,
        '2026-01-21 20:53:35',
        '2026-01-21 20:53:35'
    );

-- Regla 4: CLASIFICACION_C
INSERT IGNORE INTO reglas_credito
    (id, empresa_id, codigo, nombre, descripcion, categoria, configuracion, activo, orden_ejecucion, creado_por, modificado_por, fecha_creacion, fecha_actualizacion)
VALUES
    (
        4,
        NULL,
        'CLASIFICACION_C',
        'Criterios para clasificación C',
        'Cliente regular - atrasos frecuentes',
        'clasificacion',
        JSON_OBJECT(
            'score_minimo', 50,
            'max_atrasos_ultimo_ano', 5,
            'max_dias_atraso_promedio', 15
        ),
        1,
        0,
        NULL,
        NULL,
        '2026-01-21 20:53:35',
        '2026-01-21 20:53:35'
    );

-- Regla 5: BLOQUEO_AUTO
INSERT IGNORE INTO reglas_credito
    (id, empresa_id, codigo, nombre, descripcion, categoria, configuracion, activo, orden_ejecucion, creado_por, modificado_por, fecha_creacion, fecha_actualizacion)
VALUES
    (
        5,
        NULL,
        'BLOQUEO_AUTO',
        'Bloqueo automático de crédito',
        'Bloquear si excede límite o tiene atrasos graves',
        'bloqueo',
        JSON_OBJECT(
            'bloquear_si_dias_atraso', 30,
            'bloquear_si_clasificacion', 'D',
            'bloquear_si_excede_limite', true
        ),
        1,
        0,
        NULL,
        NULL,
        '2026-01-21 20:53:35',
        '2026-01-21 20:53:35'
    );

-- Regla 6: ALERTA_VENCIMIENTO
INSERT IGNORE INTO reglas_credito
    (id, empresa_id, codigo, nombre, descripcion, categoria, configuracion, activo, orden_ejecucion, creado_por, modificado_por, fecha_creacion, fecha_actualizacion)
VALUES
    (
        6,
        NULL,
        'ALERTA_VENCIMIENTO',
        'Alerta de vencimiento próximo',
        'Alertar X días antes del vencimiento',
        'alerta',
        JSON_OBJECT(
            'severidad', 'media',
            'dias_antes_vencimiento', 3
        ),
        1,
        0,
        NULL,
        NULL,
        '2026-01-21 20:53:35',
        '2026-01-21 20:53:35'
    );

-- =====================================================
-- FINALIZAR TRANSACCIÓN
-- =====================================================

COMMIT;
SET FOREIGN_KEY_CHECKS = 1;

-- =====================================================
-- VERIFICACIÓN
-- =====================================================

SELECT 'Migración completada exitosamente' AS resultado;
SELECT COUNT(*) AS total_reglas FROM reglas_credito;
SELECT codigo, nombre, categoria, activo FROM reglas_credito ORDER BY id;

