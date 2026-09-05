-- ============================================================
-- Migracion: paises, regiones y monedas LATAM
-- ============================================================

-- Asegurar codigo unico para monedas (requisito FK)
ALTER TABLE monedas
    ADD UNIQUE KEY uq_monedas_codigo (codigo);

-- Tabla de paises
CREATE TABLE IF NOT EXISTS paises (
    id INT(11) NOT NULL AUTO_INCREMENT,
    codigo_iso2 CHAR(2) NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    moneda_principal_codigo VARCHAR(3) NOT NULL,
    locale_default VARCHAR(10) DEFAULT 'es-DO',
    activo TINYINT(1) DEFAULT 1,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_paises_codigo (codigo_iso2),
    INDEX idx_paises_activo (activo),
    CONSTRAINT fk_paises_moneda_principal FOREIGN KEY (moneda_principal_codigo)
        REFERENCES monedas (codigo) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- Tabla de regiones (provincias/estados/departamentos)
CREATE TABLE IF NOT EXISTS regiones (
    id INT(11) NOT NULL AUTO_INCREMENT,
    pais_id INT(11) NOT NULL,
    nombre VARCHAR(120) NOT NULL,
    codigo VARCHAR(10) NULL,
    tipo VARCHAR(30) DEFAULT 'region',
    activo TINYINT(1) DEFAULT 1,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_regiones_pais (pais_id),
    INDEX idx_regiones_activo (activo),
    CONSTRAINT fk_regiones_pais FOREIGN KEY (pais_id)
        REFERENCES paises (id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Tabla de relacion paises <-> monedas
CREATE TABLE IF NOT EXISTS paises_monedas (
    pais_id INT(11) NOT NULL,
    moneda_codigo VARCHAR(3) NOT NULL,
    es_principal TINYINT(1) DEFAULT 0,
    PRIMARY KEY (pais_id, moneda_codigo),
    CONSTRAINT fk_paises_monedas_pais FOREIGN KEY (pais_id)
        REFERENCES paises (id) ON DELETE CASCADE,
    CONSTRAINT fk_paises_monedas_moneda FOREIGN KEY (moneda_codigo)
        REFERENCES monedas (codigo) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- Campos nuevos en empresas
ALTER TABLE empresas
    ADD COLUMN pais_id INT(11) NULL AFTER provincia,
    ADD COLUMN region_id INT(11) NULL AFTER pais_id,
    ADD COLUMN locale VARCHAR(10) NULL AFTER simbolo_moneda;

ALTER TABLE empresas
    ADD INDEX idx_empresas_pais (pais_id),
    ADD INDEX idx_empresas_region (region_id),
    ADD CONSTRAINT fk_empresas_pais FOREIGN KEY (pais_id)
        REFERENCES paises (id) ON DELETE SET NULL,
    ADD CONSTRAINT fk_empresas_region FOREIGN KEY (region_id)
        REFERENCES regiones (id) ON DELETE SET NULL;

-- Monedas LATAM (insert/upgrade)
INSERT INTO monedas (codigo, nombre, simbolo, activo) VALUES
('ARS', 'Peso Argentino', '$', 1),
('BOB', 'Boliviano', 'Bs', 1),
('BRL', 'Real Brasileño', 'R$', 1),
('CLP', 'Peso Chileno', '$', 1),
('COP', 'Peso Colombiano', '$', 1),
('CRC', 'Colon Costarricense', 'CRC', 1),
('CUP', 'Peso Cubano', '$', 1),
('DOP', 'Peso Dominicano', 'RD$', 1),
('GTQ', 'Quetzal', 'Q', 1),
('HNL', 'Lempira', 'L', 1),
('HTG', 'Gourde', 'G', 1),
('MXN', 'Peso Mexicano', '$', 1),
('NIO', 'Cordoba', 'C$', 1),
('PAB', 'Balboa', 'B/.', 1),
('PEN', 'Sol Peruano', 'S/', 1),
('PYG', 'Guarani', 'Gs', 1),
('USD', 'Dolar Estadounidense', 'US$', 1),
('UYU', 'Peso Uruguayo', '$U', 1),
('VES', 'Bolivar', 'Bs', 1),
('BZD', 'Dolar Beliceño', 'BZ$', 1)
ON DUPLICATE KEY UPDATE
    nombre = VALUES(nombre),
    simbolo = VALUES(simbolo),
    activo = VALUES(activo);

-- Paises LATAM (ISO2)
INSERT INTO paises (codigo_iso2, nombre, moneda_principal_codigo, locale_default, activo) VALUES
('AR', 'Argentina', 'ARS', 'es-AR', 1),
('BO', 'Bolivia', 'BOB', 'es-BO', 1),
('BR', 'Brasil', 'BRL', 'pt-BR', 1),
('CL', 'Chile', 'CLP', 'es-CL', 1),
('CO', 'Colombia', 'COP', 'es-CO', 1),
('CR', 'Costa Rica', 'CRC', 'es-CR', 1),
('CU', 'Cuba', 'CUP', 'es-CU', 1),
('DO', 'Republica Dominicana', 'DOP', 'es-DO', 1),
('EC', 'Ecuador', 'USD', 'es-EC', 1),
('SV', 'El Salvador', 'USD', 'es-SV', 1),
('GT', 'Guatemala', 'GTQ', 'es-GT', 1),
('HN', 'Honduras', 'HNL', 'es-HN', 1),
('HT', 'Haiti', 'HTG', 'fr-HT', 1),
('MX', 'Mexico', 'MXN', 'es-MX', 1),
('NI', 'Nicaragua', 'NIO', 'es-NI', 1),
('PA', 'Panama', 'PAB', 'es-PA', 1),
('PY', 'Paraguay', 'PYG', 'es-PY', 1),
('PE', 'Peru', 'PEN', 'es-PE', 1),
('UY', 'Uruguay', 'UYU', 'es-UY', 1),
('VE', 'Venezuela', 'VES', 'es-VE', 1),
('BZ', 'Belice', 'BZD', 'en-BZ', 1)
ON DUPLICATE KEY UPDATE
    nombre = VALUES(nombre),
    moneda_principal_codigo = VALUES(moneda_principal_codigo),
    locale_default = VALUES(locale_default),
    activo = VALUES(activo);

-- Relacion paises <-> monedas (principal)
INSERT INTO paises_monedas (pais_id, moneda_codigo, es_principal)
SELECT id, 'ARS', 1 FROM paises WHERE codigo_iso2 = 'AR'
ON DUPLICATE KEY UPDATE es_principal = VALUES(es_principal);
INSERT INTO paises_monedas (pais_id, moneda_codigo, es_principal)
SELECT id, 'BOB', 1 FROM paises WHERE codigo_iso2 = 'BO'
ON DUPLICATE KEY UPDATE es_principal = VALUES(es_principal);
INSERT INTO paises_monedas (pais_id, moneda_codigo, es_principal)
SELECT id, 'BRL', 1 FROM paises WHERE codigo_iso2 = 'BR'
ON DUPLICATE KEY UPDATE es_principal = VALUES(es_principal);
INSERT INTO paises_monedas (pais_id, moneda_codigo, es_principal)
SELECT id, 'CLP', 1 FROM paises WHERE codigo_iso2 = 'CL'
ON DUPLICATE KEY UPDATE es_principal = VALUES(es_principal);
INSERT INTO paises_monedas (pais_id, moneda_codigo, es_principal)
SELECT id, 'COP', 1 FROM paises WHERE codigo_iso2 = 'CO'
ON DUPLICATE KEY UPDATE es_principal = VALUES(es_principal);
INSERT INTO paises_monedas (pais_id, moneda_codigo, es_principal)
SELECT id, 'CRC', 1 FROM paises WHERE codigo_iso2 = 'CR'
ON DUPLICATE KEY UPDATE es_principal = VALUES(es_principal);
INSERT INTO paises_monedas (pais_id, moneda_codigo, es_principal)
SELECT id, 'CUP', 1 FROM paises WHERE codigo_iso2 = 'CU'
ON DUPLICATE KEY UPDATE es_principal = VALUES(es_principal);
INSERT INTO paises_monedas (pais_id, moneda_codigo, es_principal)
SELECT id, 'DOP', 1 FROM paises WHERE codigo_iso2 = 'DO'
ON DUPLICATE KEY UPDATE es_principal = VALUES(es_principal);
INSERT INTO paises_monedas (pais_id, moneda_codigo, es_principal)
SELECT id, 'USD', 1 FROM paises WHERE codigo_iso2 = 'EC'
ON DUPLICATE KEY UPDATE es_principal = VALUES(es_principal);
INSERT INTO paises_monedas (pais_id, moneda_codigo, es_principal)
SELECT id, 'USD', 1 FROM paises WHERE codigo_iso2 = 'SV'
ON DUPLICATE KEY UPDATE es_principal = VALUES(es_principal);
INSERT INTO paises_monedas (pais_id, moneda_codigo, es_principal)
SELECT id, 'GTQ', 1 FROM paises WHERE codigo_iso2 = 'GT'
ON DUPLICATE KEY UPDATE es_principal = VALUES(es_principal);
INSERT INTO paises_monedas (pais_id, moneda_codigo, es_principal)
SELECT id, 'HNL', 1 FROM paises WHERE codigo_iso2 = 'HN'
ON DUPLICATE KEY UPDATE es_principal = VALUES(es_principal);
INSERT INTO paises_monedas (pais_id, moneda_codigo, es_principal)
SELECT id, 'HTG', 1 FROM paises WHERE codigo_iso2 = 'HT'
ON DUPLICATE KEY UPDATE es_principal = VALUES(es_principal);
INSERT INTO paises_monedas (pais_id, moneda_codigo, es_principal)
SELECT id, 'MXN', 1 FROM paises WHERE codigo_iso2 = 'MX'
ON DUPLICATE KEY UPDATE es_principal = VALUES(es_principal);
INSERT INTO paises_monedas (pais_id, moneda_codigo, es_principal)
SELECT id, 'NIO', 1 FROM paises WHERE codigo_iso2 = 'NI'
ON DUPLICATE KEY UPDATE es_principal = VALUES(es_principal);
INSERT INTO paises_monedas (pais_id, moneda_codigo, es_principal)
SELECT id, 'PAB', 1 FROM paises WHERE codigo_iso2 = 'PA'
ON DUPLICATE KEY UPDATE es_principal = VALUES(es_principal);
INSERT INTO paises_monedas (pais_id, moneda_codigo, es_principal)
SELECT id, 'PYG', 1 FROM paises WHERE codigo_iso2 = 'PY'
ON DUPLICATE KEY UPDATE es_principal = VALUES(es_principal);
INSERT INTO paises_monedas (pais_id, moneda_codigo, es_principal)
SELECT id, 'PEN', 1 FROM paises WHERE codigo_iso2 = 'PE'
ON DUPLICATE KEY UPDATE es_principal = VALUES(es_principal);
INSERT INTO paises_monedas (pais_id, moneda_codigo, es_principal)
SELECT id, 'UYU', 1 FROM paises WHERE codigo_iso2 = 'UY'
ON DUPLICATE KEY UPDATE es_principal = VALUES(es_principal);
INSERT INTO paises_monedas (pais_id, moneda_codigo, es_principal)
SELECT id, 'VES', 1 FROM paises WHERE codigo_iso2 = 'VE'
ON DUPLICATE KEY UPDATE es_principal = VALUES(es_principal);
INSERT INTO paises_monedas (pais_id, moneda_codigo, es_principal)
SELECT id, 'BZD', 1 FROM paises WHERE codigo_iso2 = 'BZ'
ON DUPLICATE KEY UPDATE es_principal = VALUES(es_principal);

-- Moneda secundaria para Panama
INSERT INTO paises_monedas (pais_id, moneda_codigo, es_principal)
SELECT id, 'USD', 0 FROM paises WHERE codigo_iso2 = 'PA'
ON DUPLICATE KEY UPDATE es_principal = VALUES(es_principal);

-- Regiones RD (provincias)
INSERT INTO regiones (pais_id, nombre, tipo, activo)
SELECT p.id, r.nombre, 'provincia', 1
FROM (
    SELECT 'Azua' AS nombre UNION ALL
    SELECT 'Bahoruco' UNION ALL
    SELECT 'Barahona' UNION ALL
    SELECT 'Dajabon' UNION ALL
    SELECT 'Distrito Nacional' UNION ALL
    SELECT 'Duarte' UNION ALL
    SELECT 'El Seibo' UNION ALL
    SELECT 'Elias Pina' UNION ALL
    SELECT 'Espaillat' UNION ALL
    SELECT 'Hato Mayor' UNION ALL
    SELECT 'Hermanas Mirabal' UNION ALL
    SELECT 'Independencia' UNION ALL
    SELECT 'La Altagracia' UNION ALL
    SELECT 'La Romana' UNION ALL
    SELECT 'La Vega' UNION ALL
    SELECT 'Maria Trinidad Sanchez' UNION ALL
    SELECT 'Monsenor Nouel' UNION ALL
    SELECT 'Monte Cristi' UNION ALL
    SELECT 'Monte Plata' UNION ALL
    SELECT 'Pedernales' UNION ALL
    SELECT 'Peravia' UNION ALL
    SELECT 'Puerto Plata' UNION ALL
    SELECT 'Samana' UNION ALL
    SELECT 'San Cristobal' UNION ALL
    SELECT 'San Jose de Ocoa' UNION ALL
    SELECT 'San Juan' UNION ALL
    SELECT 'San Pedro de Macoris' UNION ALL
    SELECT 'Sanchez Ramirez' UNION ALL
    SELECT 'Santiago' UNION ALL
    SELECT 'Santiago Rodriguez' UNION ALL
    SELECT 'Santo Domingo' UNION ALL
    SELECT 'Valverde'
) r
JOIN paises p ON p.codigo_iso2 = 'DO';

-- Backfill empresas con pais RD y region cuando aplique
UPDATE empresas e
JOIN paises p ON p.codigo_iso2 = 'DO'
SET e.pais_id = p.id
WHERE e.pais_id IS NULL;

UPDATE empresas e
JOIN paises p ON p.codigo_iso2 = 'DO'
JOIN regiones r ON r.pais_id = p.id AND r.nombre = e.provincia
SET e.region_id = r.id
WHERE e.region_id IS NULL AND e.provincia IS NOT NULL AND e.provincia <> '';

UPDATE empresas e
JOIN paises p ON p.id = e.pais_id
SET e.locale = p.locale_default
WHERE e.locale IS NULL OR e.locale = '';
-- Migracion: soporte multi-pais y multi-moneda LATAM
-- Ejecutar en orden antes del seed

-- 1) Asegurar unicidad de codigo en monedas
ALTER TABLE monedas
    ADD UNIQUE KEY uk_monedas_codigo (codigo);

-- 2) Tabla de paises
CREATE TABLE IF NOT EXISTS paises (
    id INT NOT NULL AUTO_INCREMENT,
    codigo_iso2 VARCHAR(2) NOT NULL,
    codigo_iso3 VARCHAR(3) NULL,
    nombre VARCHAR(100) NOT NULL,
    moneda_principal_codigo VARCHAR(3) NOT NULL,
    locale_default VARCHAR(10) NOT NULL DEFAULT 'es-DO',
    activo TINYINT(1) DEFAULT 1,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_paises_codigo_iso2 (codigo_iso2),
    INDEX idx_paises_activo (activo),
    CONSTRAINT fk_paises_moneda_principal
        FOREIGN KEY (moneda_principal_codigo) REFERENCES monedas(codigo)
        ON DELETE RESTRICT
);

-- 3) Tabla de regiones (provincias/estados/departamentos)
CREATE TABLE IF NOT EXISTS regiones (
    id INT NOT NULL AUTO_INCREMENT,
    pais_id INT NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    codigo VARCHAR(10) NULL,
    tipo VARCHAR(20) NULL,
    activo TINYINT(1) DEFAULT 1,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_regiones_pais_nombre (pais_id, nombre),
    INDEX idx_regiones_pais (pais_id),
    INDEX idx_regiones_activo (activo),
    CONSTRAINT fk_regiones_pais
        FOREIGN KEY (pais_id) REFERENCES paises(id)
        ON DELETE CASCADE
);

-- 4) Relacion paises-monedas
CREATE TABLE IF NOT EXISTS paises_monedas (
    pais_id INT NOT NULL,
    moneda_codigo VARCHAR(3) NOT NULL,
    es_principal TINYINT(1) DEFAULT 0,
    PRIMARY KEY (pais_id, moneda_codigo),
    INDEX idx_paises_monedas_moneda (moneda_codigo),
    CONSTRAINT fk_paises_monedas_pais
        FOREIGN KEY (pais_id) REFERENCES paises(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_paises_monedas_moneda
        FOREIGN KEY (moneda_codigo) REFERENCES monedas(codigo)
        ON DELETE RESTRICT
);

-- 5) Campos nuevos en empresas
ALTER TABLE empresas
    ADD COLUMN pais_id INT NULL,
    ADD COLUMN region_id INT NULL,
    ADD COLUMN locale VARCHAR(10) NULL;

ALTER TABLE empresas
    ADD INDEX idx_empresas_pais (pais_id),
    ADD INDEX idx_empresas_region (region_id);

ALTER TABLE empresas
    ADD CONSTRAINT fk_empresas_pais
        FOREIGN KEY (pais_id) REFERENCES paises(id)
        ON DELETE SET NULL,
    ADD CONSTRAINT fk_empresas_region
        FOREIGN KEY (region_id) REFERENCES regiones(id)
        ON DELETE SET NULL;

