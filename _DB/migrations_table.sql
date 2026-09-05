-- Tabla de control de migraciones
-- Ejecutar UNA SOLA VEZ en el servidor de producción
-- Este script crea la tabla que rastrea qué migraciones ya se ejecutaron

CREATE TABLE IF NOT EXISTS migrations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) UNIQUE NOT NULL,
  executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Nota: Esta tabla debe existir ANTES de ejecutar el primer deploy automatizado
-- Ejecutar manualmente en el VPS:
-- mysql -u pos_deploy -p punto_venta_rd < _DB/migrations_table.sql

