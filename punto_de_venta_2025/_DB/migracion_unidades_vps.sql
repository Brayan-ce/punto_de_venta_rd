-- MIGRACIÓN: UNIDADES DE MEDIDA POR EMPRESA
-- Ejecutar en el VPS: mysql -u root -p punto_venta_rd < este_archivo.sql

-- Paso 1: Limpiar empresa_id de unidades antiguas
UPDATE unidades_medida SET empresa_id = NULL WHERE empresa_id IS NOT NULL;

-- Paso 2: Insertar unidades para cada empresa existente
-- Este INSERT agrega 53 unidades × cada empresa activa

INSERT INTO unidades_medida (empresa_id, codigo, nombre, abreviatura, activo)
SELECT e.id, t.codigo, t.nombre, t.abreviatura, 1
FROM empresas e
CROSS JOIN (
    SELECT 'UN' codigo, 'Unidad' nombre, 'UN' abreviatura UNION ALL
    SELECT 'LB', 'LIBRA', 'LB' UNION ALL
    SELECT 'KG', 'Kilogramo', 'kg' UNION ALL
    SELECT 'GR', 'Gramo', 'gr' UNION ALL
    SELECT 'MG', 'Miligramo', 'mg' UNION ALL
    SELECT 'TON', 'Tonelada', 't' UNION ALL
    SELECT 'LIBRA', 'Libra', 'libra' UNION ALL
    SELECT 'OZ', 'Onza', 'oz' UNION ALL
    SELECT 'ONZA', 'Onza', 'onza' UNION ALL
    SELECT 'TON_US', 'Tonelada US', 'ton US' UNION ALL
    SELECT 'QQ', 'Quintal', 'qq' UNION ALL
    SELECT 'L', 'Litro', 'L' UNION ALL
    SELECT 'LT', 'Litro', 'lt' UNION ALL
    SELECT 'LITRO', 'Litro', 'litro' UNION ALL
    SELECT 'ML', 'Mililitro', 'ml' UNION ALL
    SELECT 'M3', 'Metro cúbico', 'm³' UNION ALL
    SELECT 'PT', 'Pinta', 'pt' UNION ALL
    SELECT 'FL_OZ', 'Onza fluida', 'fl oz' UNION ALL
    SELECT 'M', 'Metro', 'm' UNION ALL
    SELECT 'MT', 'Metro', 'mt' UNION ALL
    SELECT 'METRO', 'Metro', 'metro' UNION ALL
    SELECT 'MM', 'Milímetro', 'mm' UNION ALL
    SELECT 'KM', 'Kilómetro', 'km' UNION ALL
    SELECT 'FT', 'Pie', 'ft' UNION ALL
    SELECT 'PIE', 'Pie', 'pie' UNION ALL
    SELECT 'IN', 'Pulgada', 'in' UNION ALL
    SELECT 'PULGADA', 'Pulgada', 'pulgada' UNION ALL
    SELECT 'YD', 'Yarda', 'yd' UNION ALL
    SELECT 'MI', 'Milla', 'mi' UNION ALL
    SELECT 'M2', 'Metro cuadrado', 'm²' UNION ALL
    SELECT 'KM2', 'Kilómetro cuadrado', 'km²' UNION ALL
    SELECT 'HA', 'Hectárea', 'ha' UNION ALL
    SELECT 'FT2', 'Pie cuadrado', 'ft²' UNION ALL
    SELECT 'IN2', 'Pulgada cuadrada', 'in²' UNION ALL
    SELECT 'TAREA', 'Tarea', 'tarea' UNION ALL
    SELECT 'UND', 'Unidad', 'und' UNION ALL
    SELECT 'UNIDAD', 'Unidad', 'unidad' UNION ALL
    SELECT 'PZ', 'Pieza', 'pz' UNION ALL
    SELECT 'PIEZA', 'Pieza', 'pieza' UNION ALL
    SELECT 'MIL', 'Millar', 'millar' UNION ALL
    SELECT 'PAR', 'Par', 'par' UNION ALL
    SELECT 'SAC', 'Saco', 'saco' UNION ALL
    SELECT 'PAQ', 'Paquete', 'paq' UNION ALL
    SELECT 'FRA', 'Frasco', 'frasco' UNION ALL
    SELECT 'LAT', 'Lata', 'lata' UNION ALL
    SELECT 'TUB', 'Tubo', 'tubo' UNION ALL
    SELECT 'ROL', 'Rollo', 'rollo' UNION ALL
    SELECT 'H', 'Hora', 'h' UNION ALL
    SELECT 'MIN', 'Minuto', 'min' UNION ALL
    SELECT 'SEM', 'Semana', 'sem' UNION ALL
    SELECT 'MES', 'Mes', 'mes'
) t
WHERE e.activo = 1;

-- Verificación de resultados
SELECT empresa_id, COUNT(*) as total_unidades 
FROM unidades_medida 
WHERE empresa_id IS NOT NULL 
GROUP BY empresa_id
ORDER BY empresa_id;

SELECT COUNT(*) as total_general FROM unidades_medida WHERE empresa_id IS NOT NULL;
