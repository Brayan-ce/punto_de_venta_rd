-- Migración: Tabla para OTP de superadmin (doble factor)
-- Ejecutar SOLO si la tabla no existe

CREATE TABLE IF NOT EXISTS superadmin_otp (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    codigo VARCHAR(6) NOT NULL,
    expira_en DATETIME NOT NULL,
    usado TINYINT(1) DEFAULT 0,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    INDEX idx_verificar (usuario_id, usado, expira_en)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
