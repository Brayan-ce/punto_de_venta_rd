-- Migration: Configuracion de notificaciones del header por empresa
-- Controla que se muestra en el flotante de notificaciones del header
ALTER TABLE empresas
ADD COLUMN notif_mostrar_proximas TINYINT(1) NOT NULL DEFAULT 1 AFTER otp_habilitado,
ADD COLUMN notif_mostrar_vencidas TINYINT(1) NOT NULL DEFAULT 1 AFTER notif_mostrar_proximas,
ADD COLUMN notif_mostrar_alertas TINYINT(1) NOT NULL DEFAULT 1 AFTER notif_mostrar_vencidas,
ADD COLUMN notif_proximas_dias INT NOT NULL DEFAULT 7 AFTER notif_mostrar_alertas;