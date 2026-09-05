-- Migración para Microservicio de Control de Obras y Costos
-- Autor: Antigravity AI
-- Fecha: 2026-01-21

-- 1. Agregar system_mode a la tabla de usuarios
ALTER TABLE `usuarios` ADD COLUMN `system_mode` ENUM('POS', 'OBRAS') DEFAULT 'POS';

-- 2. Tabla de Obras
CREATE TABLE IF NOT EXISTS `obras` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `nombre` VARCHAR(255) NOT NULL,
  `ubicacion` TEXT NOT NULL,
  `presupuesto_aprobado` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  `fecha_inicio` DATE NOT NULL,
  `fecha_fin_estimada` DATE DEFAULT NULL,
  `estado` ENUM('ACTIVA', 'CERRADA', 'SUSPENDIDA') DEFAULT 'ACTIVA',
  `creado_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `actualizado_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Tabla de Trabajadores
CREATE TABLE IF NOT EXISTS `trabajadores` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `nombre` VARCHAR(255) NOT NULL,
  `documento` VARCHAR(50) UNIQUE NOT NULL,
  `rol` VARCHAR(100) NOT NULL, -- Electricista, Albañil, etc.
  `estado` ENUM('ACTIVO', 'INACTIVO') DEFAULT 'ACTIVO',
  `creado_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Asignaciones de Trabajadores a Obras (Control de quién pertenece a qué obra)
CREATE TABLE IF NOT EXISTS `asignaciones_obra` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `obra_id` INT NOT NULL,
  `trabajador_id` INT NOT NULL,
  `fecha_asignacion` DATE NOT NULL,
  `estado` ENUM('ACTIVO', 'FINALIZADO') DEFAULT 'ACTIVO',
  FOREIGN KEY (`obra_id`) REFERENCES `obras`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`trabajador_id`) REFERENCES `trabajadores`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Bitácoras Diarias
CREATE TABLE IF NOT EXISTS `bitacoras_diarias` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `obra_id` INT NOT NULL,
  `fecha` DATE NOT NULL,
  `zona` VARCHAR(255) DEFAULT NULL, -- Frente, Techo, Apto 2B
  `trabajo_realizado` TEXT NOT NULL,
  `observaciones` TEXT,
  `fotos_json` JSON DEFAULT NULL, -- URLs de fotos
  `creado_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`obra_id`) REFERENCES `obras`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Asistencias/Trabajo en Bitácora (Detalle de quién trabajó en esa bitácora)
CREATE TABLE IF NOT EXISTS `asistencias_bitacora` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `bitacora_id` INT NOT NULL,
  `trabajador_id` INT NOT NULL,
  `hora_inicio` TIME DEFAULT NULL,
  `hora_fin` TIME DEFAULT NULL,
  `horas_trabajadas` DECIMAL(5, 2) DEFAULT 0.00,
  FOREIGN KEY (`bitacora_id`) REFERENCES `bitacoras_diarias`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`trabajador_id`) REFERENCES `trabajadores`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Órdenes de Trabajo (Autorización)
CREATE TABLE IF NOT EXISTS `ordenes_trabajo` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `obra_id` INT NOT NULL,
  `descripcion` TEXT NOT NULL,
  `autoriza_compra` BOOLEAN DEFAULT FALSE,
  `estado` ENUM('PENDIENTE', 'COMPLETADA', 'CANCELADA') DEFAULT 'PENDIENTE',
  `creado_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`obra_id`) REFERENCES `obras`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Compras de Materiales por Obra
CREATE TABLE IF NOT EXISTS `compras_obra` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `obra_id` INT NOT NULL,
  `orden_id` INT DEFAULT NULL,
  `proveedor_id` INT DEFAULT NULL, -- Debería vincularse a la tabla de proveedores existente
  `monto` DECIMAL(15, 2) NOT NULL,
  `forma_pago` ENUM('EFECTIVO', 'TRANSFERENCIA', 'CREDITO') NOT NULL,
  `factura_ncf` VARCHAR(50) DEFAULT NULL,
  `factura_url` TEXT DEFAULT NULL,
  `creado_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`obra_id`) REFERENCES `obras`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`orden_id`) REFERENCES `ordenes_trabajo`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Conduces (Despacho Parcial)
CREATE TABLE IF NOT EXISTS `conduces_obra` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `factura_id` INT DEFAULT NULL, -- Vinculado a ventas/facturas existentes
  `obra_id` INT NOT NULL,
  `numero_conduce` VARCHAR(50) UNIQUE NOT NULL,
  `material` VARCHAR(255) NOT NULL,
  `cantidad` DECIMAL(15, 2) NOT NULL,
  `receptor` VARCHAR(255) NOT NULL,
  `evidencia_url` TEXT DEFAULT NULL,
  `fecha_despacho` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`obra_id`) REFERENCES `obras`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
