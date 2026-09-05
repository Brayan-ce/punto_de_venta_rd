-- ============================================
-- MIGRACIÓN: TABLA DE IMPORTACIONES DE PRODUCTOS
-- ============================================
-- 
-- Tabla para rastrear jobs de importación asíncronos
-- Permite separar upload de procesamiento
-- 
-- Fecha: 2026-01-21

CREATE TABLE IF NOT EXISTS `importaciones_productos` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `empresa_id` INT(11) NOT NULL,
  `usuario_id` INT(11) NOT NULL,
  `file_id` VARCHAR(64) NOT NULL COMMENT 'ID del archivo temporal',
  `estado` ENUM('pending', 'processing', 'completed', 'failed', 'cancelled') NOT NULL DEFAULT 'pending',
  `estadisticas` JSON DEFAULT NULL COMMENT 'Estadísticas de la importación',
  `mensaje` TEXT DEFAULT NULL COMMENT 'Mensaje de resultado',
  `errores` JSON DEFAULT NULL COMMENT 'Array de errores encontrados',
  `fecha_creacion` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_actualizacion` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_empresa` (`empresa_id`),
  KEY `idx_usuario` (`usuario_id`),
  KEY `idx_estado` (`estado`),
  KEY `idx_file_id` (`file_id`),
  KEY `idx_fecha_creacion` (`fecha_creacion`),
  CONSTRAINT `importaciones_productos_ibfk_1` FOREIGN KEY (`empresa_id`) REFERENCES `empresas` (`id`) ON DELETE CASCADE,
  CONSTRAINT `importaciones_productos_ibfk_2` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

