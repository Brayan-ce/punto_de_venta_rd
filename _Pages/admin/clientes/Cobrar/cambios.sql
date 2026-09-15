DROP TRIGGER IF EXISTS after_pago_insert;
DELIMITER $$
CREATE TRIGGER after_pago_insert
AFTER INSERT ON pagos_credito
FOR EACH ROW
BEGIN
    DECLARE nuevo_monto_pagado DECIMAL(12,2);
    DECLARE nuevo_saldo DECIMAL(12,2);
    DECLARE monto_total_cxc DECIMAL(12,2);
    DECLARE nuevo_estado VARCHAR(20);
    DECLARE credito_id BIGINT;
    DECLARE limite_credito DECIMAL(12,2);
    
    -- Obtener datos de la cuenta por cobrar
    SELECT monto_total, monto_pagado, credito_cliente_id
    INTO monto_total_cxc, nuevo_monto_pagado, credito_id
    FROM cuentas_por_cobrar
    WHERE id = NEW.cxc_id;
    
    -- Calcular nuevo monto pagado
    SET nuevo_monto_pagado = nuevo_monto_pagado + NEW.monto_pagado;
    SET nuevo_saldo = monto_total_cxc - nuevo_monto_pagado;
    
    -- Determinar nuevo estado
    IF nuevo_saldo <= 0 THEN
        SET nuevo_estado = 'pagada';
    ELSEIF nuevo_monto_pagado > 0 AND nuevo_saldo > 0 THEN
        SET nuevo_estado = 'parcial';
    END IF;
    
    -- Actualizar cuentas_por_cobrar
    UPDATE cuentas_por_cobrar
    SET 
        monto_pagado = nuevo_monto_pagado,
        estado_cxc = nuevo_estado,
        fecha_ultimo_abono = NOW(),
        numero_abonos = numero_abonos + 1
    WHERE id = NEW.cxc_id;
    
    -- Actualizar solo saldo_utilizado en credito_clientes.
    -- NO escribir en la columna generada `saldo_disponible`.
    UPDATE credito_clientes cc
    SET cc.saldo_utilizado = (
        SELECT COALESCE(SUM(saldo_pendiente), 0)
        FROM cuentas_por_cobrar
        WHERE credito_cliente_id = credito_id
        AND estado_cxc IN ('activa', 'vencida', 'parcial')
    )
    WHERE cc.id = credito_id;
    
    -- Registrar en historial de crédito
    INSERT INTO historial_credito (
        credito_cliente_id,
        empresa_id,
        cliente_id,
        tipo_evento,
        descripcion,
        generado_por,
        usuario_id
    ) VALUES (
        credito_id,
        NEW.empresa_id,
        NEW.cliente_id,
        'pago_realizado',
        CONCAT('Pago recibido: ', NEW.monto_pagado, ' - ', NEW.metodo_pago),
        'sistema',
        NEW.registrado_por
    );
END$$
DELIMITER ;