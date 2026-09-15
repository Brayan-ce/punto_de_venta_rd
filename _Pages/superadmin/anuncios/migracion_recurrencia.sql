-- ============================================
-- MIGRACIÓN PARA SISTEMA DE ANUNCIOS RECURRENTES
-- ============================================

-- Agregar campos para soportar plantillas e instancias
ALTER TABLE announcements ADD COLUMN parent_id INT NULL AFTER id;
ALTER TABLE announcements ADD COLUMN is_template TINYINT(1) NOT NULL DEFAULT 0 AFTER parent_id;
ALTER TABLE announcements ADD COLUMN month_year VARCHAR(7) NULL AFTER day_of_month; -- Formato: YYYY-MM

-- Índices para optimizar búsquedas de instancias recurrentes
CREATE INDEX idx_parent_id ON announcements(parent_id);
CREATE INDEX idx_is_template ON announcements(is_template);
CREATE INDEX idx_month_year ON announcements(month_year);
CREATE INDEX idx_template_month ON announcements(parent_id, month_year);

-- Foreign key para vincular instancias con plantillas
ALTER TABLE announcements ADD CONSTRAINT fk_announcement_parent 
FOREIGN KEY (parent_id) REFERENCES announcements(id) ON DELETE CASCADE;
