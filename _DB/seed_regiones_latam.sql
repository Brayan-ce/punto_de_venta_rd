-- ============================================================
-- Seed: Regiones/Provincias/Estados/Departamentos LATAM
-- ============================================================
-- Ejecutar DESPUES de migracion_paises_latam.sql

-- ============================================================
-- ARGENTINA - Provincias (23) + CABA
-- ============================================================
INSERT INTO regiones (pais_id, nombre, codigo, tipo, activo)
SELECT p.id, r.nombre, r.codigo, 'provincia', 1
FROM (
    SELECT 'Buenos Aires' AS nombre, 'BA' AS codigo UNION ALL
    SELECT 'Catamarca', 'CT' UNION ALL
    SELECT 'Chaco', 'CC' UNION ALL
    SELECT 'Chubut', 'CH' UNION ALL
    SELECT 'Cordoba', 'CB' UNION ALL
    SELECT 'Corrientes', 'CR' UNION ALL
    SELECT 'Entre Rios', 'ER' UNION ALL
    SELECT 'Formosa', 'FO' UNION ALL
    SELECT 'Jujuy', 'JY' UNION ALL
    SELECT 'La Pampa', 'LP' UNION ALL
    SELECT 'La Rioja', 'LR' UNION ALL
    SELECT 'Mendoza', 'MZ' UNION ALL
    SELECT 'Misiones', 'MN' UNION ALL
    SELECT 'Neuquen', 'NQ' UNION ALL
    SELECT 'Rio Negro', 'RN' UNION ALL
    SELECT 'Salta', 'SA' UNION ALL
    SELECT 'San Juan', 'SJ' UNION ALL
    SELECT 'San Luis', 'SL' UNION ALL
    SELECT 'Santa Cruz', 'SC' UNION ALL
    SELECT 'Santa Fe', 'SF' UNION ALL
    SELECT 'Santiago del Estero', 'SE' UNION ALL
    SELECT 'Tierra del Fuego', 'TF' UNION ALL
    SELECT 'Tucuman', 'TM' UNION ALL
    SELECT 'Ciudad Autonoma de Buenos Aires', 'CABA'
) r
JOIN paises p ON p.codigo_iso2 = 'AR'
ON DUPLICATE KEY UPDATE nombre = VALUES(nombre);

-- ============================================================
-- BOLIVIA - Departamentos (9)
-- ============================================================
INSERT INTO regiones (pais_id, nombre, codigo, tipo, activo)
SELECT p.id, r.nombre, r.codigo, 'departamento', 1
FROM (
    SELECT 'Beni' AS nombre, 'B' AS codigo UNION ALL
    SELECT 'Chuquisaca', 'H' UNION ALL
    SELECT 'Cochabamba', 'C' UNION ALL
    SELECT 'La Paz', 'L' UNION ALL
    SELECT 'Oruro', 'O' UNION ALL
    SELECT 'Pando', 'N' UNION ALL
    SELECT 'Potosi', 'P' UNION ALL
    SELECT 'Santa Cruz', 'S' UNION ALL
    SELECT 'Tarija', 'T'
) r
JOIN paises p ON p.codigo_iso2 = 'BO'
ON DUPLICATE KEY UPDATE nombre = VALUES(nombre);

-- ============================================================
-- BRASIL - Estados (26) + Distrito Federal
-- ============================================================
INSERT INTO regiones (pais_id, nombre, codigo, tipo, activo)
SELECT p.id, r.nombre, r.codigo, 'estado', 1
FROM (
    SELECT 'Acre' AS nombre, 'AC' AS codigo UNION ALL
    SELECT 'Alagoas', 'AL' UNION ALL
    SELECT 'Amapa', 'AP' UNION ALL
    SELECT 'Amazonas', 'AM' UNION ALL
    SELECT 'Bahia', 'BA' UNION ALL
    SELECT 'Ceara', 'CE' UNION ALL
    SELECT 'Distrito Federal', 'DF' UNION ALL
    SELECT 'Espirito Santo', 'ES' UNION ALL
    SELECT 'Goias', 'GO' UNION ALL
    SELECT 'Maranhao', 'MA' UNION ALL
    SELECT 'Mato Grosso', 'MT' UNION ALL
    SELECT 'Mato Grosso do Sul', 'MS' UNION ALL
    SELECT 'Minas Gerais', 'MG' UNION ALL
    SELECT 'Para', 'PA' UNION ALL
    SELECT 'Paraiba', 'PB' UNION ALL
    SELECT 'Parana', 'PR' UNION ALL
    SELECT 'Pernambuco', 'PE' UNION ALL
    SELECT 'Piaui', 'PI' UNION ALL
    SELECT 'Rio de Janeiro', 'RJ' UNION ALL
    SELECT 'Rio Grande do Norte', 'RN' UNION ALL
    SELECT 'Rio Grande do Sul', 'RS' UNION ALL
    SELECT 'Rondonia', 'RO' UNION ALL
    SELECT 'Roraima', 'RR' UNION ALL
    SELECT 'Santa Catarina', 'SC' UNION ALL
    SELECT 'Sao Paulo', 'SP' UNION ALL
    SELECT 'Sergipe', 'SE' UNION ALL
    SELECT 'Tocantins', 'TO'
) r
JOIN paises p ON p.codigo_iso2 = 'BR'
ON DUPLICATE KEY UPDATE nombre = VALUES(nombre);

-- ============================================================
-- CHILE - Regiones (16)
-- ============================================================
INSERT INTO regiones (pais_id, nombre, codigo, tipo, activo)
SELECT p.id, r.nombre, r.codigo, 'region', 1
FROM (
    SELECT 'Arica y Parinacota' AS nombre, 'XV' AS codigo UNION ALL
    SELECT 'Tarapaca', 'I' UNION ALL
    SELECT 'Antofagasta', 'II' UNION ALL
    SELECT 'Atacama', 'III' UNION ALL
    SELECT 'Coquimbo', 'IV' UNION ALL
    SELECT 'Valparaiso', 'V' UNION ALL
    SELECT 'Metropolitana de Santiago', 'RM' UNION ALL
    SELECT 'Libertador General Bernardo OHiggins', 'VI' UNION ALL
    SELECT 'Maule', 'VII' UNION ALL
    SELECT 'Nuble', 'XVI' UNION ALL
    SELECT 'Biobio', 'VIII' UNION ALL
    SELECT 'La Araucania', 'IX' UNION ALL
    SELECT 'Los Rios', 'XIV' UNION ALL
    SELECT 'Los Lagos', 'X' UNION ALL
    SELECT 'Aysen', 'XI' UNION ALL
    SELECT 'Magallanes y la Antartica Chilena', 'XII'
) r
JOIN paises p ON p.codigo_iso2 = 'CL'
ON DUPLICATE KEY UPDATE nombre = VALUES(nombre);

-- ============================================================
-- COLOMBIA - Departamentos (32) + Distrito Capital
-- ============================================================
INSERT INTO regiones (pais_id, nombre, codigo, tipo, activo)
SELECT p.id, r.nombre, r.codigo, 'departamento', 1
FROM (
    SELECT 'Amazonas' AS nombre, 'AMA' AS codigo UNION ALL
    SELECT 'Antioquia', 'ANT' UNION ALL
    SELECT 'Arauca', 'ARA' UNION ALL
    SELECT 'Atlantico', 'ATL' UNION ALL
    SELECT 'Bolivar', 'BOL' UNION ALL
    SELECT 'Boyaca', 'BOY' UNION ALL
    SELECT 'Caldas', 'CAL' UNION ALL
    SELECT 'Caqueta', 'CAQ' UNION ALL
    SELECT 'Casanare', 'CAS' UNION ALL
    SELECT 'Cauca', 'CAU' UNION ALL
    SELECT 'Cesar', 'CES' UNION ALL
    SELECT 'Choco', 'CHO' UNION ALL
    SELECT 'Cordoba', 'COR' UNION ALL
    SELECT 'Cundinamarca', 'CUN' UNION ALL
    SELECT 'Guainia', 'GUA' UNION ALL
    SELECT 'Guaviare', 'GUV' UNION ALL
    SELECT 'Huila', 'HUI' UNION ALL
    SELECT 'La Guajira', 'LAG' UNION ALL
    SELECT 'Magdalena', 'MAG' UNION ALL
    SELECT 'Meta', 'MET' UNION ALL
    SELECT 'Narino', 'NAR' UNION ALL
    SELECT 'Norte de Santander', 'NSA' UNION ALL
    SELECT 'Putumayo', 'PUT' UNION ALL
    SELECT 'Quindio', 'QUI' UNION ALL
    SELECT 'Risaralda', 'RIS' UNION ALL
    SELECT 'San Andres y Providencia', 'SAP' UNION ALL
    SELECT 'Santander', 'SAN' UNION ALL
    SELECT 'Sucre', 'SUC' UNION ALL
    SELECT 'Tolima', 'TOL' UNION ALL
    SELECT 'Valle del Cauca', 'VAC' UNION ALL
    SELECT 'Vaupes', 'VAU' UNION ALL
    SELECT 'Vichada', 'VID' UNION ALL
    SELECT 'Bogota D.C.', 'DC'
) r
JOIN paises p ON p.codigo_iso2 = 'CO'
ON DUPLICATE KEY UPDATE nombre = VALUES(nombre);

-- ============================================================
-- COSTA RICA - Provincias (7)
-- ============================================================
INSERT INTO regiones (pais_id, nombre, codigo, tipo, activo)
SELECT p.id, r.nombre, r.codigo, 'provincia', 1
FROM (
    SELECT 'Alajuela' AS nombre, 'A' AS codigo UNION ALL
    SELECT 'Cartago', 'C' UNION ALL
    SELECT 'Guanacaste', 'G' UNION ALL
    SELECT 'Heredia', 'H' UNION ALL
    SELECT 'Limon', 'L' UNION ALL
    SELECT 'Puntarenas', 'P' UNION ALL
    SELECT 'San Jose', 'SJ'
) r
JOIN paises p ON p.codigo_iso2 = 'CR'
ON DUPLICATE KEY UPDATE nombre = VALUES(nombre);

-- ============================================================
-- CUBA - Provincias (15) + Municipio Especial
-- ============================================================
INSERT INTO regiones (pais_id, nombre, codigo, tipo, activo)
SELECT p.id, r.nombre, r.codigo, 'provincia', 1
FROM (
    SELECT 'Artemisa' AS nombre, '15' AS codigo UNION ALL
    SELECT 'Camaguey', '09' UNION ALL
    SELECT 'Ciego de Avila', '08' UNION ALL
    SELECT 'Cienfuegos', '06' UNION ALL
    SELECT 'Granma', '12' UNION ALL
    SELECT 'Guantanamo', '14' UNION ALL
    SELECT 'Holguin', '11' UNION ALL
    SELECT 'La Habana', '03' UNION ALL
    SELECT 'Las Tunas', '10' UNION ALL
    SELECT 'Matanzas', '04' UNION ALL
    SELECT 'Mayabeque', '16' UNION ALL
    SELECT 'Pinar del Rio', '01' UNION ALL
    SELECT 'Sancti Spiritus', '07' UNION ALL
    SELECT 'Santiago de Cuba', '13' UNION ALL
    SELECT 'Villa Clara', '05' UNION ALL
    SELECT 'Isla de la Juventud', '99'
) r
JOIN paises p ON p.codigo_iso2 = 'CU'
ON DUPLICATE KEY UPDATE nombre = VALUES(nombre);

-- ============================================================
-- ECUADOR - Provincias (24)
-- ============================================================
INSERT INTO regiones (pais_id, nombre, codigo, tipo, activo)
SELECT p.id, r.nombre, r.codigo, 'provincia', 1
FROM (
    SELECT 'Azuay' AS nombre, 'A' AS codigo UNION ALL
    SELECT 'Bolivar', 'B' UNION ALL
    SELECT 'Canar', 'F' UNION ALL
    SELECT 'Carchi', 'C' UNION ALL
    SELECT 'Chimborazo', 'H' UNION ALL
    SELECT 'Cotopaxi', 'X' UNION ALL
    SELECT 'El Oro', 'O' UNION ALL
    SELECT 'Esmeraldas', 'E' UNION ALL
    SELECT 'Galapagos', 'W' UNION ALL
    SELECT 'Guayas', 'G' UNION ALL
    SELECT 'Imbabura', 'I' UNION ALL
    SELECT 'Loja', 'L' UNION ALL
    SELECT 'Los Rios', 'R' UNION ALL
    SELECT 'Manabi', 'M' UNION ALL
    SELECT 'Morona Santiago', 'S' UNION ALL
    SELECT 'Napo', 'N' UNION ALL
    SELECT 'Orellana', 'Y' UNION ALL
    SELECT 'Pastaza', 'P' UNION ALL
    SELECT 'Pichincha', 'P' UNION ALL
    SELECT 'Santa Elena', 'SE' UNION ALL
    SELECT 'Santo Domingo de los Tsachilas', 'SD' UNION ALL
    SELECT 'Sucumbios', 'U' UNION ALL
    SELECT 'Tungurahua', 'T' UNION ALL
    SELECT 'Zamora Chinchipe', 'Z'
) r
JOIN paises p ON p.codigo_iso2 = 'EC'
ON DUPLICATE KEY UPDATE nombre = VALUES(nombre);

-- ============================================================
-- EL SALVADOR - Departamentos (14)
-- ============================================================
INSERT INTO regiones (pais_id, nombre, codigo, tipo, activo)
SELECT p.id, r.nombre, r.codigo, 'departamento', 1
FROM (
    SELECT 'Ahuachapan' AS nombre, 'AH' AS codigo UNION ALL
    SELECT 'Cabanas', 'CA' UNION ALL
    SELECT 'Chalatenango', 'CH' UNION ALL
    SELECT 'Cuscatlan', 'CU' UNION ALL
    SELECT 'La Libertad', 'LI' UNION ALL
    SELECT 'La Paz', 'PA' UNION ALL
    SELECT 'La Union', 'UN' UNION ALL
    SELECT 'Morazan', 'MO' UNION ALL
    SELECT 'San Miguel', 'SM' UNION ALL
    SELECT 'San Salvador', 'SS' UNION ALL
    SELECT 'San Vicente', 'SV' UNION ALL
    SELECT 'Santa Ana', 'SA' UNION ALL
    SELECT 'Sonsonate', 'SO' UNION ALL
    SELECT 'Usulutan', 'US'
) r
JOIN paises p ON p.codigo_iso2 = 'SV'
ON DUPLICATE KEY UPDATE nombre = VALUES(nombre);

-- ============================================================
-- GUATEMALA - Departamentos (22)
-- ============================================================
INSERT INTO regiones (pais_id, nombre, codigo, tipo, activo)
SELECT p.id, r.nombre, r.codigo, 'departamento', 1
FROM (
    SELECT 'Alta Verapaz' AS nombre, 'AV' AS codigo UNION ALL
    SELECT 'Baja Verapaz', 'BV' UNION ALL
    SELECT 'Chimaltenango', 'CM' UNION ALL
    SELECT 'Chiquimula', 'CQ' UNION ALL
    SELECT 'El Progreso', 'EP' UNION ALL
    SELECT 'Escuintla', 'ES' UNION ALL
    SELECT 'Guatemala', 'GU' UNION ALL
    SELECT 'Huehuetenango', 'HU' UNION ALL
    SELECT 'Izabal', 'IZ' UNION ALL
    SELECT 'Jalapa', 'JA' UNION ALL
    SELECT 'Jutiapa', 'JU' UNION ALL
    SELECT 'Peten', 'PE' UNION ALL
    SELECT 'Quetzaltenango', 'QZ' UNION ALL
    SELECT 'Quiche', 'QC' UNION ALL
    SELECT 'Retalhuleu', 'RE' UNION ALL
    SELECT 'Sacatepequez', 'SA' UNION ALL
    SELECT 'San Marcos', 'SM' UNION ALL
    SELECT 'Santa Rosa', 'SR' UNION ALL
    SELECT 'Solola', 'SO' UNION ALL
    SELECT 'Suchitepequez', 'SU' UNION ALL
    SELECT 'Totonicapan', 'TO' UNION ALL
    SELECT 'Zacapa', 'ZA'
) r
JOIN paises p ON p.codigo_iso2 = 'GT'
ON DUPLICATE KEY UPDATE nombre = VALUES(nombre);

-- ============================================================
-- HONDURAS - Departamentos (18)
-- ============================================================
INSERT INTO regiones (pais_id, nombre, codigo, tipo, activo)
SELECT p.id, r.nombre, r.codigo, 'departamento', 1
FROM (
    SELECT 'Atlantida' AS nombre, 'AT' AS codigo UNION ALL
    SELECT 'Choluteca', 'CH' UNION ALL
    SELECT 'Colon', 'CL' UNION ALL
    SELECT 'Comayagua', 'CM' UNION ALL
    SELECT 'Copan', 'CP' UNION ALL
    SELECT 'Cortes', 'CR' UNION ALL
    SELECT 'El Paraiso', 'EP' UNION ALL
    SELECT 'Francisco Morazan', 'FM' UNION ALL
    SELECT 'Gracias a Dios', 'GD' UNION ALL
    SELECT 'Intibuca', 'IN' UNION ALL
    SELECT 'Islas de la Bahia', 'IB' UNION ALL
    SELECT 'La Paz', 'LP' UNION ALL
    SELECT 'Lempira', 'LE' UNION ALL
    SELECT 'Ocotepeque', 'OC' UNION ALL
    SELECT 'Olancho', 'OL' UNION ALL
    SELECT 'Santa Barbara', 'SB' UNION ALL
    SELECT 'Valle', 'VA' UNION ALL
    SELECT 'Yoro', 'YO'
) r
JOIN paises p ON p.codigo_iso2 = 'HN'
ON DUPLICATE KEY UPDATE nombre = VALUES(nombre);

-- ============================================================
-- HAITI - Departamentos (10)
-- ============================================================
INSERT INTO regiones (pais_id, nombre, codigo, tipo, activo)
SELECT p.id, r.nombre, r.codigo, 'departamento', 1
FROM (
    SELECT 'Artibonite' AS nombre, 'AR' AS codigo UNION ALL
    SELECT 'Centre', 'CE' UNION ALL
    SELECT 'Grand Anse', 'GA' UNION ALL
    SELECT 'Nippes', 'NI' UNION ALL
    SELECT 'Nord', 'ND' UNION ALL
    SELECT 'Nord-Est', 'NE' UNION ALL
    SELECT 'Nord-Ouest', 'NO' UNION ALL
    SELECT 'Ouest', 'OU' UNION ALL
    SELECT 'Sud', 'SD' UNION ALL
    SELECT 'Sud-Est', 'SE'
) r
JOIN paises p ON p.codigo_iso2 = 'HT'
ON DUPLICATE KEY UPDATE nombre = VALUES(nombre);

-- ============================================================
-- MEXICO - Estados (32)
-- ============================================================
INSERT INTO regiones (pais_id, nombre, codigo, tipo, activo)
SELECT p.id, r.nombre, r.codigo, 'estado', 1
FROM (
    SELECT 'Aguascalientes' AS nombre, 'AG' AS codigo UNION ALL
    SELECT 'Baja California', 'BC' UNION ALL
    SELECT 'Baja California Sur', 'BS' UNION ALL
    SELECT 'Campeche', 'CM' UNION ALL
    SELECT 'Chiapas', 'CS' UNION ALL
    SELECT 'Chihuahua', 'CH' UNION ALL
    SELECT 'Ciudad de Mexico', 'CDMX' UNION ALL
    SELECT 'Coahuila', 'CO' UNION ALL
    SELECT 'Colima', 'CL' UNION ALL
    SELECT 'Durango', 'DG' UNION ALL
    SELECT 'Guanajuato', 'GT' UNION ALL
    SELECT 'Guerrero', 'GR' UNION ALL
    SELECT 'Hidalgo', 'HG' UNION ALL
    SELECT 'Jalisco', 'JA' UNION ALL
    SELECT 'Mexico', 'MX' UNION ALL
    SELECT 'Michoacan', 'MI' UNION ALL
    SELECT 'Morelos', 'MO' UNION ALL
    SELECT 'Nayarit', 'NA' UNION ALL
    SELECT 'Nuevo Leon', 'NL' UNION ALL
    SELECT 'Oaxaca', 'OA' UNION ALL
    SELECT 'Puebla', 'PU' UNION ALL
    SELECT 'Queretaro', 'QT' UNION ALL
    SELECT 'Quintana Roo', 'QR' UNION ALL
    SELECT 'San Luis Potosi', 'SL' UNION ALL
    SELECT 'Sinaloa', 'SI' UNION ALL
    SELECT 'Sonora', 'SO' UNION ALL
    SELECT 'Tabasco', 'TB' UNION ALL
    SELECT 'Tamaulipas', 'TM' UNION ALL
    SELECT 'Tlaxcala', 'TL' UNION ALL
    SELECT 'Veracruz', 'VE' UNION ALL
    SELECT 'Yucatan', 'YU' UNION ALL
    SELECT 'Zacatecas', 'ZA'
) r
JOIN paises p ON p.codigo_iso2 = 'MX'
ON DUPLICATE KEY UPDATE nombre = VALUES(nombre);

-- ============================================================
-- NICARAGUA - Departamentos (15) + Regiones Autonomas (2)
-- ============================================================
INSERT INTO regiones (pais_id, nombre, codigo, tipo, activo)
SELECT p.id, r.nombre, r.codigo, r.tipo, 1
FROM (
    SELECT 'Boaco' AS nombre, 'BO' AS codigo, 'departamento' AS tipo UNION ALL
    SELECT 'Carazo', 'CA', 'departamento' UNION ALL
    SELECT 'Chinandega', 'CI', 'departamento' UNION ALL
    SELECT 'Chontales', 'CO', 'departamento' UNION ALL
    SELECT 'Esteli', 'ES', 'departamento' UNION ALL
    SELECT 'Granada', 'GR', 'departamento' UNION ALL
    SELECT 'Jinotega', 'JI', 'departamento' UNION ALL
    SELECT 'Leon', 'LE', 'departamento' UNION ALL
    SELECT 'Madriz', 'MD', 'departamento' UNION ALL
    SELECT 'Managua', 'MN', 'departamento' UNION ALL
    SELECT 'Masaya', 'MS', 'departamento' UNION ALL
    SELECT 'Matagalpa', 'MT', 'departamento' UNION ALL
    SELECT 'Nueva Segovia', 'NS', 'departamento' UNION ALL
    SELECT 'Rio San Juan', 'SJ', 'departamento' UNION ALL
    SELECT 'Rivas', 'RI', 'departamento' UNION ALL
    SELECT 'Costa Caribe Norte', 'RACN', 'region_autonoma' UNION ALL
    SELECT 'Costa Caribe Sur', 'RACS', 'region_autonoma'
) r
JOIN paises p ON p.codigo_iso2 = 'NI'
ON DUPLICATE KEY UPDATE nombre = VALUES(nombre);

-- ============================================================
-- PANAMA - Provincias (10) + Comarcas
-- ============================================================
INSERT INTO regiones (pais_id, nombre, codigo, tipo, activo)
SELECT p.id, r.nombre, r.codigo, r.tipo, 1
FROM (
    SELECT 'Bocas del Toro' AS nombre, '1' AS codigo, 'provincia' AS tipo UNION ALL
    SELECT 'Chiriqui', '4', 'provincia' UNION ALL
    SELECT 'Cocle', '2', 'provincia' UNION ALL
    SELECT 'Colon', '3', 'provincia' UNION ALL
    SELECT 'Darien', '5', 'provincia' UNION ALL
    SELECT 'Herrera', '7', 'provincia' UNION ALL
    SELECT 'Los Santos', '8', 'provincia' UNION ALL
    SELECT 'Panama', '9', 'provincia' UNION ALL
    SELECT 'Panama Oeste', '10', 'provincia' UNION ALL
    SELECT 'Veraguas', '6', 'provincia' UNION ALL
    SELECT 'Embera-Wounaan', 'EM', 'comarca' UNION ALL
    SELECT 'Guna Yala', 'KY', 'comarca' UNION ALL
    SELECT 'Ngabe-Bugle', 'NB', 'comarca'
) r
JOIN paises p ON p.codigo_iso2 = 'PA'
ON DUPLICATE KEY UPDATE nombre = VALUES(nombre);

-- ============================================================
-- PARAGUAY - Departamentos (17) + Capital
-- ============================================================
INSERT INTO regiones (pais_id, nombre, codigo, tipo, activo)
SELECT p.id, r.nombre, r.codigo, 'departamento', 1
FROM (
    SELECT 'Alto Paraguay' AS nombre, '16' AS codigo UNION ALL
    SELECT 'Alto Parana', '10' UNION ALL
    SELECT 'Amambay', '13' UNION ALL
    SELECT 'Asuncion', 'ASU' UNION ALL
    SELECT 'Boqueron', '19' UNION ALL
    SELECT 'Caaguazu', '5' UNION ALL
    SELECT 'Caazapa', '6' UNION ALL
    SELECT 'Canindeyu', '14' UNION ALL
    SELECT 'Central', '11' UNION ALL
    SELECT 'Concepcion', '1' UNION ALL
    SELECT 'Cordillera', '3' UNION ALL
    SELECT 'Guaira', '4' UNION ALL
    SELECT 'Itapua', '7' UNION ALL
    SELECT 'Misiones', '8' UNION ALL
    SELECT 'Neembucu', '12' UNION ALL
    SELECT 'Paraguari', '9' UNION ALL
    SELECT 'Presidente Hayes', '15' UNION ALL
    SELECT 'San Pedro', '2'
) r
JOIN paises p ON p.codigo_iso2 = 'PY'
ON DUPLICATE KEY UPDATE nombre = VALUES(nombre);

-- ============================================================
-- PERU - Regiones (25)
-- ============================================================
INSERT INTO regiones (pais_id, nombre, codigo, tipo, activo)
SELECT p.id, r.nombre, r.codigo, 'region', 1
FROM (
    SELECT 'Amazonas' AS nombre, 'AMA' AS codigo UNION ALL
    SELECT 'Ancash', 'ANC' UNION ALL
    SELECT 'Apurimac', 'APU' UNION ALL
    SELECT 'Arequipa', 'ARE' UNION ALL
    SELECT 'Ayacucho', 'AYA' UNION ALL
    SELECT 'Cajamarca', 'CAJ' UNION ALL
    SELECT 'Callao', 'CAL' UNION ALL
    SELECT 'Cusco', 'CUS' UNION ALL
    SELECT 'Huancavelica', 'HUV' UNION ALL
    SELECT 'Huanuco', 'HUC' UNION ALL
    SELECT 'Ica', 'ICA' UNION ALL
    SELECT 'Junin', 'JUN' UNION ALL
    SELECT 'La Libertad', 'LAL' UNION ALL
    SELECT 'Lambayeque', 'LAM' UNION ALL
    SELECT 'Lima', 'LIM' UNION ALL
    SELECT 'Loreto', 'LOR' UNION ALL
    SELECT 'Madre de Dios', 'MDD' UNION ALL
    SELECT 'Moquegua', 'MOQ' UNION ALL
    SELECT 'Pasco', 'PAS' UNION ALL
    SELECT 'Piura', 'PIU' UNION ALL
    SELECT 'Puno', 'PUN' UNION ALL
    SELECT 'San Martin', 'SAM' UNION ALL
    SELECT 'Tacna', 'TAC' UNION ALL
    SELECT 'Tumbes', 'TUM' UNION ALL
    SELECT 'Ucayali', 'UCA'
) r
JOIN paises p ON p.codigo_iso2 = 'PE'
ON DUPLICATE KEY UPDATE nombre = VALUES(nombre);

-- ============================================================
-- URUGUAY - Departamentos (19)
-- ============================================================
INSERT INTO regiones (pais_id, nombre, codigo, tipo, activo)
SELECT p.id, r.nombre, r.codigo, 'departamento', 1
FROM (
    SELECT 'Artigas' AS nombre, 'AR' AS codigo UNION ALL
    SELECT 'Canelones', 'CA' UNION ALL
    SELECT 'Cerro Largo', 'CL' UNION ALL
    SELECT 'Colonia', 'CO' UNION ALL
    SELECT 'Durazno', 'DU' UNION ALL
    SELECT 'Flores', 'FS' UNION ALL
    SELECT 'Florida', 'FD' UNION ALL
    SELECT 'Lavalleja', 'LA' UNION ALL
    SELECT 'Maldonado', 'MA' UNION ALL
    SELECT 'Montevideo', 'MO' UNION ALL
    SELECT 'Paysandu', 'PA' UNION ALL
    SELECT 'Rio Negro', 'RN' UNION ALL
    SELECT 'Rivera', 'RV' UNION ALL
    SELECT 'Rocha', 'RO' UNION ALL
    SELECT 'Salto', 'SA' UNION ALL
    SELECT 'San Jose', 'SJ' UNION ALL
    SELECT 'Soriano', 'SO' UNION ALL
    SELECT 'Tacuarembo', 'TA' UNION ALL
    SELECT 'Treinta y Tres', 'TT'
) r
JOIN paises p ON p.codigo_iso2 = 'UY'
ON DUPLICATE KEY UPDATE nombre = VALUES(nombre);

-- ============================================================
-- VENEZUELA - Estados (23) + Distrito Capital + Dependencias
-- ============================================================
INSERT INTO regiones (pais_id, nombre, codigo, tipo, activo)
SELECT p.id, r.nombre, r.codigo, r.tipo, 1
FROM (
    SELECT 'Amazonas' AS nombre, 'Z' AS codigo, 'estado' AS tipo UNION ALL
    SELECT 'Anzoategui', 'B', 'estado' UNION ALL
    SELECT 'Apure', 'C', 'estado' UNION ALL
    SELECT 'Aragua', 'D', 'estado' UNION ALL
    SELECT 'Barinas', 'E', 'estado' UNION ALL
    SELECT 'Bolivar', 'F', 'estado' UNION ALL
    SELECT 'Carabobo', 'G', 'estado' UNION ALL
    SELECT 'Cojedes', 'H', 'estado' UNION ALL
    SELECT 'Delta Amacuro', 'Y', 'estado' UNION ALL
    SELECT 'Distrito Capital', 'A', 'distrito' UNION ALL
    SELECT 'Falcon', 'I', 'estado' UNION ALL
    SELECT 'Guarico', 'J', 'estado' UNION ALL
    SELECT 'Lara', 'K', 'estado' UNION ALL
    SELECT 'Merida', 'L', 'estado' UNION ALL
    SELECT 'Miranda', 'M', 'estado' UNION ALL
    SELECT 'Monagas', 'N', 'estado' UNION ALL
    SELECT 'Nueva Esparta', 'O', 'estado' UNION ALL
    SELECT 'Portuguesa', 'P', 'estado' UNION ALL
    SELECT 'Sucre', 'R', 'estado' UNION ALL
    SELECT 'Tachira', 'S', 'estado' UNION ALL
    SELECT 'Trujillo', 'T', 'estado' UNION ALL
    SELECT 'Vargas', 'X', 'estado' UNION ALL
    SELECT 'Yaracuy', 'U', 'estado' UNION ALL
    SELECT 'Zulia', 'V', 'estado' UNION ALL
    SELECT 'Dependencias Federales', 'W', 'dependencia'
) r
JOIN paises p ON p.codigo_iso2 = 'VE'
ON DUPLICATE KEY UPDATE nombre = VALUES(nombre);

-- ============================================================
-- BELICE - Distritos (6)
-- ============================================================
INSERT INTO regiones (pais_id, nombre, codigo, tipo, activo)
SELECT p.id, r.nombre, r.codigo, 'distrito', 1
FROM (
    SELECT 'Belice' AS nombre, 'BZ' AS codigo UNION ALL
    SELECT 'Cayo', 'CY' UNION ALL
    SELECT 'Corozal', 'CZ' UNION ALL
    SELECT 'Orange Walk', 'OW' UNION ALL
    SELECT 'Stann Creek', 'SC' UNION ALL
    SELECT 'Toledo', 'TO'
) r
JOIN paises p ON p.codigo_iso2 = 'BZ'
ON DUPLICATE KEY UPDATE nombre = VALUES(nombre);

-- ============================================================
-- FIN DEL SEED
-- ============================================================

