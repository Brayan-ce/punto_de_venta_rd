-- ============================================
-- MIGRACION: agregar moneda por sucursal
-- Fecha: 2026-04-22
-- Ejecutar en MariaDB paso por paso
-- ============================================

USE punto_venta_rd;

-- PASO 0: cargar/actualizar monedas base (RD, USD, Soles y mas)
INSERT INTO monedas (codigo, nombre, simbolo, activo) VALUES
('DOP', 'Peso Dominicano', 'RD$', 1),
('USD', 'Dolar Estadounidense', 'US$', 1),
('PEN', 'Sol Peruano', 'S/', 1),
('EUR', 'Euro', 'EUR', 1),
('COP', 'Peso Colombiano', 'COP$', 1),
('MXN', 'Peso Mexicano', 'MX$', 1),
('CLP', 'Peso Chileno', 'CLP$', 1),
('ARS', 'Peso Argentino', 'AR$', 1),
('BRL', 'Real Brasileno', 'R$', 1),
('GTQ', 'Quetzal', 'Q', 1),
('CRC', 'Colon Costarricense', 'CRC', 1),
('PAB', 'Balboa', 'B/.', 1),
('VES', 'Bolivar', 'Bs', 1)
ON DUPLICATE KEY UPDATE
    nombre = VALUES(nombre),
    simbolo = VALUES(simbolo),
    activo = VALUES(activo);

-- PASO 1: agregar columna
ALTER TABLE sucursales
ADD COLUMN IF NOT EXISTS moneda_id INT NULL AFTER ciudad;

-- PASO 2: agregar indice
ALTER TABLE sucursales
ADD INDEX IF NOT EXISTS idx_sucursal_moneda (moneda_id);

-- PASO 3: agregar foreign key
-- Si ya existe, MariaDB devolvera error de constraint duplicado. En ese caso, continuar.
ALTER TABLE sucursales
ADD CONSTRAINT fk_sucursales_moneda
FOREIGN KEY (moneda_id)
REFERENCES monedas(id)
ON DELETE SET NULL;

-- PASO 4: setear moneda por defecto a sucursales existentes sin moneda
UPDATE sucursales
SET moneda_id = (
    SELECT id
    FROM monedas
    WHERE activo = TRUE
    ORDER BY CASE WHEN codigo = 'DOP' THEN 0 ELSE 1 END, id ASC
    LIMIT 1
)
WHERE moneda_id IS NULL;

-- PASO 5: verificacion
SELECT id, codigo, nombre, moneda_id
FROM sucursales
ORDER BY id DESC
LIMIT 20;

-- PASO 6: ver monedas activas
SELECT id, codigo, nombre, simbolo, activo
FROM monedas
ORDER BY codigo ASC;
