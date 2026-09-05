-- Migration: Agregar campo otp_habilitado a tabla empresas para OTP por empresa
ALTER TABLE empresas
ADD COLUMN otp_habilitado TINYINT(1) NOT NULL DEFAULT 0 AFTER permite_impresion;
