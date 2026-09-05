-- ============================================================================
-- SCRIPT DE ESTABILIZACIÓN: DEPURACIÓN & SUSCRIPCIONES
-- Ejecutar este script para corregir errores de "Unknown column"
-- ============================================================================

USE punto_venta_rd;

-- 1. ASEGURAR COLUMNAS EN TABLA EMPRESAS (BLOQUEO)

ALTER TABLE empresas ADD COLUMN bloqueada TINYINT(1) DEFAULT 0 AFTER activo;
ALTER TABLE empresas ADD COLUMN motivo_bloqueo TEXT NULL AFTER bloqueada;
ALTER TABLE empresas ADD COLUMN fecha_bloqueo DATETIME NULL AFTER motivo_bloqueo;
ALTER TABLE empresas ADD COLUMN bloqueada_por INT NULL AFTER fecha_bloqueo;


-- 2. ASEGURAR COLUMNAS EN TABLA CLIENTES (DEPURACIÓN)
ALTER TABLE clientes ADD COLUMN estado ENUM('activo','inactivo','fusionado','bloqueado') DEFAULT 'activo';
ALTER TABLE clientes ADD COLUMN cliente_principal_id INT NULL;
ALTER TABLE clientes ADD COLUMN motivo_fusion TEXT NULL;
ALTER TABLE clientes ADD COLUMN fecha_fusion TIMESTAMP NULL;


-- 3. ASEGURAR COLUMNAS EN TABLA EMPRESAS_SUSCRIPCIONES
ALTER TABLE empresas_suscripciones ADD COLUMN monto_mensual DECIMAL(10,2) DEFAULT 0.00;
ALTER TABLE empresas_suscripciones ADD COLUMN moneda CHAR(3) DEFAULT 'DOP';
ALTER TABLE empresas_suscripciones ADD COLUMN usuarios_actuales INT DEFAULT 0;
ALTER TABLE empresas_suscripciones ADD COLUMN productos_actuales INT DEFAULT 0;
ALTER TABLE empresas_suscripciones ADD COLUMN ventas_mes_actual INT DEFAULT 0;
ALTER TABLE empresas_suscripciones ADD COLUMN metodo_pago VARCHAR(50) NULL;
ALTER TABLE empresas_suscripciones ADD COLUMN notas_admin TEXT NULL;


-- 4. ASEGURAR TABLA DE AUDITORÍA (NUEVO ESQUEMA)
-- Si la tabla ya existe con el esquema viejo, lo ideal es renombrarla o ajustarla
-- Aquí aseguramos que tenga las columnas mínimas para el nuevo servidor.js
ALTER TABLE auditoria_sistema ADD COLUMN entidad VARCHAR(50);
ALTER TABLE auditoria_sistema ADD COLUMN entidad_id BIGINT NULL;
ALTER TABLE auditoria_sistema ADD COLUMN tipo_accion VARCHAR(20);
ALTER TABLE auditoria_sistema ADD COLUMN empresa_id INT NULL;

