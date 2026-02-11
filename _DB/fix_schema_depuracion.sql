-- ============================================================================
-- SCRIPT DE ESTABILIZACIÓN: DEPURACIÓN & SUSCRIPCIONES
-- Ejecutar este script para corregir errores de "Unknown column"
-- ============================================================================

USE punto_venta_rd;

-- 1. ASEGURAR COLUMNAS EN TABLA EMPRESAS (BLOQUEO)
ALTER TABLE empresas
    ADD COLUMN IF NOT EXISTS bloqueada TINYINT(1) DEFAULT 0 AFTER activo,
    ADD COLUMN IF NOT EXISTS motivo_bloqueo TEXT NULL AFTER bloqueada,
    ADD COLUMN IF NOT EXISTS fecha_bloqueo DATETIME NULL AFTER motivo_bloqueo,
    ADD COLUMN IF NOT EXISTS bloqueada_por INT NULL AFTER fecha_bloqueo;

-- 2. ASEGURAR COLUMNAS EN TABLA CLIENTES (DEPURACIÓN)
ALTER TABLE clientes
    ADD COLUMN IF NOT EXISTS estado ENUM('activo','inactivo','fusionado','bloqueado') DEFAULT 'activo' AFTER activo,
    ADD COLUMN IF NOT EXISTS cliente_principal_id INT NULL AFTER estado,
    ADD COLUMN IF NOT EXISTS motivo_fusion TEXT NULL AFTER cliente_principal_id,
    ADD COLUMN IF NOT EXISTS fecha_fusion TIMESTAMP NULL AFTER motivo_fusion;

-- 3. ASEGURAR COLUMNAS EN TABLA EMPRESAS_SUSCRIPCIONES
ALTER TABLE empresas_suscripciones
    ADD COLUMN IF NOT EXISTS monto_mensual DECIMAL(10,2) DEFAULT 0.00 AFTER estado,
    ADD COLUMN IF NOT EXISTS moneda CHAR(3) DEFAULT 'DOP' AFTER monto_mensual,
    ADD COLUMN IF NOT EXISTS usuarios_actuales INT DEFAULT 0 AFTER limite_ventas_mes,
    ADD COLUMN IF NOT EXISTS productos_actuales INT DEFAULT 0 AFTER usuarios_actuales,
    ADD COLUMN IF NOT EXISTS ventas_mes_actual INT DEFAULT 0 AFTER productos_actuales,
    ADD COLUMN IF NOT EXISTS metodo_pago VARCHAR(50) NULL AFTER ventas_mes_actual,
    ADD COLUMN IF NOT EXISTS notas_admin TEXT NULL AFTER metodo_pago;

-- 4. ASEGURAR TABLA DE AUDITORÍA (NUEVO ESQUEMA)
-- Si la tabla ya existe con el esquema viejo, lo ideal es renombrarla o ajustarla
-- Aquí aseguramos que tenga las columnas mínimas para el nuevo servidor.js
ALTER TABLE auditoria_sistema
    ADD COLUMN IF NOT EXISTS entidad VARCHAR(50) NOT NULL AFTER id,
    ADD COLUMN IF NOT EXISTS entidad_id BIGINT NULL AFTER entidad,
    ADD COLUMN IF NOT EXISTS tipo_accion VARCHAR(20) NOT NULL AFTER entidad_id,
    ADD COLUMN IF NOT EXISTS empresa_id INT NULL AFTER tipo_accion;
