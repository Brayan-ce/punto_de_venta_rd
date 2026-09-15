-- ACTUALIZACIÓN: UNIDADES DE MEDIDA POR EMPRESA
-- Ejecutar en el VPS para migrar unidades a modelo por empresa

-- Paso 1: Limpiar unidades existentes que podrían tener empresa_id asignada
UPDATE unidades_medida SET empresa_id = NULL WHERE empresa_id IS NOT NULL;

-- Paso 2: Para cada empresa existente, insertar sus propias unidades
SET @empresaId = NULL;
SET @contador = 0;

CREATE TEMPORARY TABLE empresas_tmp AS SELECT id FROM empresas WHERE activo = 1;

DELIMITER $$

CREATE PROCEDURE insertar_unidades_por_empresa()
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE v_empresa_id INT;
    DECLARE cur CURSOR FOR SELECT id FROM empresas_tmp;
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    
    OPEN cur;
    read_loop: LOOP
        FETCH cur INTO v_empresa_id;
        IF done THEN
            LEAVE read_loop;
        END IF;
        
        INSERT INTO unidades_medida (empresa_id, codigo, nombre, abreviatura, activo) VALUES
        (v_empresa_id, 'UN', 'Unidad', 'UN', 1),
        (v_empresa_id, 'LB', 'LIBRA', 'LB', 1),
        (v_empresa_id, 'KG', 'Kilogramo', 'kg', 1),
        (v_empresa_id, 'GR', 'Gramo', 'gr', 1),
        (v_empresa_id, 'MG', 'Miligramo', 'mg', 1),
        (v_empresa_id, 'TON', 'Tonelada', 't', 1),
        (v_empresa_id, 'LIBRA', 'Libra', 'libra', 1),
        (v_empresa_id, 'OZ', 'Onza', 'oz', 1),
        (v_empresa_id, 'ONZA', 'Onza', 'onza', 1),
        (v_empresa_id, 'TON_US', 'Tonelada US', 'ton US', 1),
        (v_empresa_id, 'QQ', 'Quintal', 'qq', 1),
        (v_empresa_id, 'L', 'Litro', 'L', 1),
        (v_empresa_id, 'LT', 'Litro', 'lt', 1),
        (v_empresa_id, 'LITRO', 'Litro', 'litro', 1),
        (v_empresa_id, 'ML', 'Mililitro', 'ml', 1),
        (v_empresa_id, 'M3', 'Metro cúbico', 'm³', 1),
        (v_empresa_id, 'PT', 'Pinta', 'pt', 1),
        (v_empresa_id, 'FL_OZ', 'Onza fluida', 'fl oz', 1),
        (v_empresa_id, 'M', 'Metro', 'm', 1),
        (v_empresa_id, 'MT', 'Metro', 'mt', 1),
        (v_empresa_id, 'METRO', 'Metro', 'metro', 1),
        (v_empresa_id, 'MM', 'Milímetro', 'mm', 1),
        (v_empresa_id, 'KM', 'Kilómetro', 'km', 1),
        (v_empresa_id, 'FT', 'Pie', 'ft', 1),
        (v_empresa_id, 'PIE', 'Pie', 'pie', 1),
        (v_empresa_id, 'IN', 'Pulgada', 'in', 1),
        (v_empresa_id, 'PULGADA', 'Pulgada', 'pulgada', 1),
        (v_empresa_id, 'YD', 'Yarda', 'yd', 1),
        (v_empresa_id, 'MI', 'Milla', 'mi', 1),
        (v_empresa_id, 'M2', 'Metro cuadrado', 'm²', 1),
        (v_empresa_id, 'KM2', 'Kilómetro cuadrado', 'km²', 1),
        (v_empresa_id, 'HA', 'Hectárea', 'ha', 1),
        (v_empresa_id, 'FT2', 'Pie cuadrado', 'ft²', 1),
        (v_empresa_id, 'IN2', 'Pulgada cuadrada', 'in²', 1),
        (v_empresa_id, 'TAREA', 'Tarea', 'tarea', 1),
        (v_empresa_id, 'UND', 'Unidad', 'und', 1),
        (v_empresa_id, 'UNIDAD', 'Unidad', 'unidad', 1),
        (v_empresa_id, 'PZ', 'Pieza', 'pz', 1),
        (v_empresa_id, 'PIEZA', 'Pieza', 'pieza', 1),
        (v_empresa_id, 'MIL', 'Millar', 'millar', 1),
        (v_empresa_id, 'PAR', 'Par', 'par', 1),
        (v_empresa_id, 'SAC', 'Saco', 'saco', 1),
        (v_empresa_id, 'PAQ', 'Paquete', 'paq', 1),
        (v_empresa_id, 'FRA', 'Frasco', 'frasco', 1),
        (v_empresa_id, 'LAT', 'Lata', 'lata', 1),
        (v_empresa_id, 'TUB', 'Tubo', 'tubo', 1),
        (v_empresa_id, 'ROL', 'Rollo', 'rollo', 1),
        (v_empresa_id, 'H', 'Hora', 'h', 1),
        (v_empresa_id, 'MIN', 'Minuto', 'min', 1),
        (v_empresa_id, 'SEM', 'Semana', 'sem', 1),
        (v_empresa_id, 'MES', 'Mes', 'mes', 1);
    END LOOP;
    CLOSE cur;
END$$

DELIMITER ;

CALL insertar_unidades_por_empresa();

DROP PROCEDURE insertar_unidades_por_empresa;
DROP TEMPORARY TABLE empresas_tmp;

-- Verificación
SELECT empresa_id, COUNT(*) as total_unidades FROM unidades_medida WHERE empresa_id IS NOT NULL GROUP BY empresa_id;
