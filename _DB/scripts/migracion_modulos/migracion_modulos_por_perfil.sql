-- ============================================
-- SCRIPT DE MIGRACIÓN: Habilitar Módulos por Perfil de Negocio
-- Fecha: 2026-01-21
-- Descripción: Permite habilitar módulos según el tipo de negocio de cada empresa
-- ============================================

USE punto_venta_rd;

-- ============================================
-- PERFILES DE NEGOCIO PREDEFINIDOS
-- ============================================

-- Perfil 1: POS Básico
-- Solo módulos core y POS básico
-- Ideal para: Tiendas pequeñas, negocios de retail básico

-- Perfil 2: POS con Crédito
-- Core + POS + Crédito
-- Ideal para: Negocios que venden a crédito

-- Perfil 3: Financiamiento de Scooters
-- Core + POS + Financiamiento
-- Ideal para: Negocios que financian scooters u otros activos

-- Perfil 4: Constructora
-- Core + POS + Construcción
-- Ideal para: Empresas constructoras, control de obras

-- Perfil 5: Completo
-- Todos los módulos habilitados
-- Ideal para: Empresas grandes que necesitan todas las funcionalidades

-- ============================================
-- FUNCIÓN AUXILIAR PARA HABILITAR MÓDULOS POR PERFIL
-- ============================================

DELIMITER //

CREATE PROCEDURE IF NOT EXISTS habilitar_modulos_por_perfil(
    IN p_empresa_id INT,
    IN p_perfil VARCHAR(50)
)
BEGIN
    DECLARE v_modulo_id INT;
    DECLARE done INT DEFAULT FALSE;
    
    -- Cursor para iterar sobre los módulos del perfil
    DECLARE cur_modulos CURSOR FOR
        SELECT m.id
        FROM modulos m
        WHERE m.activo = TRUE
        AND (
            -- Core siempre habilitado
            m.codigo = 'core'
            OR
            -- Perfil POS Básico
            (p_perfil = 'pos_basico' AND m.codigo = 'pos')
            OR
            -- Perfil POS con Crédito
            (p_perfil = 'pos_credito' AND m.codigo IN ('pos', 'credito'))
            OR
            -- Perfil Financiamiento
            (p_perfil = 'financiamiento_scooters' AND m.codigo IN ('pos', 'financiamiento'))
            OR
            -- Perfil Constructora
            (p_perfil = 'constructora' AND m.codigo IN ('pos', 'constructora'))
            OR
            -- Perfil Completo
            (p_perfil = 'completo' AND m.codigo IN ('pos', 'credito', 'financiamiento', 'constructora', 'catalogo'))
        );
    
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    
    -- Abrir cursor
    OPEN cur_modulos;
    
    -- Iterar sobre módulos
    read_loop: LOOP
        FETCH cur_modulos INTO v_modulo_id;
        
        IF done THEN
            LEAVE read_loop;
        END IF;
        
        -- Insertar o actualizar relación empresa-módulo
        INSERT INTO empresa_modulos (empresa_id, modulo_id, habilitado)
        VALUES (p_empresa_id, v_modulo_id, TRUE)
        ON DUPLICATE KEY UPDATE 
            habilitado = TRUE,
            fecha_actualizacion = CURRENT_TIMESTAMP;
        
    END LOOP;
    
    -- Cerrar cursor
    CLOSE cur_modulos;
    
END //

DELIMITER ;

-- ============================================
-- EJEMPLOS DE USO
-- ============================================

-- Ejemplo 1: Habilitar módulos POS Básico para empresa ID 1
-- CALL habilitar_modulos_por_perfil(1, 'pos_basico');

-- Ejemplo 2: Habilitar módulos POS con Crédito para empresa ID 2
-- CALL habilitar_modulos_por_perfil(2, 'pos_credito');

-- Ejemplo 3: Habilitar módulos de Financiamiento para empresa ID 3
-- CALL habilitar_modulos_por_perfil(3, 'financiamiento_scooters');

-- Ejemplo 4: Habilitar módulos de Construcción para empresa ID 4
-- CALL habilitar_modulos_por_perfil(4, 'constructora');

-- Ejemplo 5: Habilitar todos los módulos para empresa ID 5
-- CALL habilitar_modulos_por_perfil(5, 'completo');

-- ============================================
-- SCRIPT PARA MIGRAR EMPRESAS EXISTENTES
-- ============================================

-- Por defecto, habilitar POS básico para todas las empresas existentes
-- (esto mantiene la funcionalidad actual)

-- Obtener todas las empresas activas
-- SELECT id, nombre_empresa FROM empresas WHERE activo = TRUE;

-- Para cada empresa, ejecutar:
-- CALL habilitar_modulos_por_perfil(EMPRESA_ID, 'pos_basico');

-- ============================================
-- NOTAS IMPORTANTES
-- ============================================

-- 1. El módulo 'core' siempre está habilitado automáticamente
-- 2. Los módulos siempre habilitados no pueden ser deshabilitados
-- 3. Antes de cambiar el perfil de una empresa, considera:
--    - Hacer backup de la base de datos
--    - Verificar que no haya datos dependientes del módulo que se va a deshabilitar
--    - Notificar a los usuarios de la empresa sobre los cambios

-- ============================================
-- QUERY PARA VERIFICAR MÓDULOS HABILITADOS POR EMPRESA
-- ============================================

-- SELECT 
--     e.id as empresa_id,
--     e.nombre_empresa,
--     m.codigo as modulo_codigo,
--     m.nombre as modulo_nombre,
--     em.habilitado,
--     em.fecha_habilitacion
-- FROM empresas e
-- LEFT JOIN empresa_modulos em ON e.id = em.empresa_id
-- LEFT JOIN modulos m ON em.modulo_id = m.id
-- WHERE e.id = EMPRESA_ID
-- ORDER BY m.categoria, m.nombre;

