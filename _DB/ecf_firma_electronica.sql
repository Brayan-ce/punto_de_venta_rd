-- Campos para firma electrónica ECF (EFRENIS SOFT API-EECF)
-- Agregar a la tabla ventas

ALTER TABLE ventas 
ADD COLUMN ecf_firmado BOOLEAN DEFAULT FALSE AFTER estado,
ADD COLUMN ecf_comprobante VARCHAR(20) DEFAULT NULL AFTER ecf_firmado,
ADD COLUMN ecf_codigo_seguridad VARCHAR(20) DEFAULT NULL AFTER ecf_comprobante,
ADD COLUMN ecf_fecha_firma DATETIME DEFAULT NULL AFTER ecf_codigo_seguridad,
ADD COLUMN ecf_qr TEXT DEFAULT NULL AFTER ecf_fecha_firma,
ADD COLUMN ecf_ambiente VARCHAR(20) DEFAULT NULL AFTER ecf_qr,
ADD COLUMN ecf_intentos_firma INT DEFAULT 0 AFTER ecf_ambiente,
ADD COLUMN ecf_ultimo_error TEXT DEFAULT NULL AFTER ecf_intentos_firma,
ADD COLUMN ecf_vencimiento_secuencia DATE DEFAULT NULL AFTER ecf_ultimo_error;

-- Tabla de configuración para API ECF
CREATE TABLE IF NOT EXISTS configuracion_ecf (
    id INT PRIMARY KEY AUTO_INCREMENT,
    empresa_id INT NOT NULL,
    servidor_api VARCHAR(255) NOT NULL COMMENT 'Base URL del servidor API-EECF en la red local, ej: http://192.168.1.50:8000',
    ambiente VARCHAR(20) DEFAULT 'testecf' COMMENT 'testecf, certecf, ecf',
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
    UNIQUE KEY uk_empresa_ecf (empresa_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Índices para búsquedas rápidas
CREATE INDEX idx_ventas_ecf_firmado ON ventas(ecf_firmado);
CREATE INDEX idx_ventas_ecf_comprobante ON ventas(ecf_comprobante);

-- Datos de ejemplo (opcional, configurar según empresa)
-- INSERT INTO configuracion_ecf (empresa_id, servidor_api, ambiente, activo) 
-- VALUES (1, 'http://192.168.1.50:8000', 'testecf', TRUE);
-- También puede configurarse desde la pantalla de imprimir venta (admin).
