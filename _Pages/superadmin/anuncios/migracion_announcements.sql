-- ============================================
-- SISTEMA DE ANUNCIOS / MENSAJES PROGRAMADOS
-- ============================================

CREATE TABLE IF NOT EXISTS announcements (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    title           VARCHAR(255)   NOT NULL,
    message         TEXT           NOT NULL,
    type            VARCHAR(50)    NOT NULL DEFAULT 'info',   -- info, warning, pago, alerta
    target_type     ENUM('all','specific') NOT NULL DEFAULT 'all',
    is_mandatory    TINYINT(1)     NOT NULL DEFAULT 1,
    scheduled_at    DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at      DATETIME       NULL,
    recurrence      VARCHAR(20)    NULL,     -- 'monthly' | NULL
    day_of_month    INT            NULL,     -- 1-31
    created_at      TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    activo          TINYINT(1)     NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS announcement_targets (
    id                  INT AUTO_INCREMENT PRIMARY KEY,
    announcement_id     INT  NOT NULL,
    empresa_id          INT  NULL,
    user_id             INT  NULL,
    FOREIGN KEY (announcement_id) REFERENCES announcements(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS announcement_reads (
    id                  INT AUTO_INCREMENT PRIMARY KEY,
    announcement_id     INT       NOT NULL,
    user_id             INT       NOT NULL,
    read_at             TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_read (announcement_id, user_id),
    FOREIGN KEY (announcement_id) REFERENCES announcements(id) ON DELETE CASCADE
);
