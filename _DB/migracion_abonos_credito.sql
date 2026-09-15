-- ============================================================
-- MIGRACIÓN: tabla abonos_credito + triggers
-- Base de datos: punto_venta_rd
-- Ejecutar en MariaDB como usuario con privilegios
-- ============================================================

-- ============================================================
-- 1. CREAR TABLA abonos_credito
-- ============================================================
CREATE TABLE IF NOT EXISTS abonos_credito (
    id                   BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
    cxc_id               BIGINT       NOT NULL,
    empresa_id           INT          NOT NULL,
    cliente_id           INT          NOT NULL,
    monto_abonado        DECIMAL(12,2) NOT NULL,
    metodo_pago          ENUM('efectivo','tarjeta_debito','tarjeta_credito','transferencia','cheque','mixto')
                                      NOT NULL DEFAULT 'efectivo',
    referencia_pago      VARCHAR(100)  DEFAULT NULL,
    es_pago_tardio       TINYINT(1)   NOT NULL DEFAULT 0,
    dias_atraso_al_pagar INT          NOT NULL DEFAULT 0,
    notas                TEXT          DEFAULT NULL,
    registrado_por       INT           DEFAULT NULL,
    fecha_abono          TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (cxc_id)         REFERENCES cuentas_por_cobrar(id) ON DELETE CASCADE,
    FOREIGN KEY (empresa_id)     REFERENCES empresas(id)           ON DELETE CASCADE,
    FOREIGN KEY (registrado_por) REFERENCES usuarios(id)           ON DELETE SET NULL,

    INDEX idx_cxc_id     (cxc_id),
    INDEX idx_cliente_id (cliente_id),
    INDEX idx_empresa_id (empresa_id),
    INDEX idx_fecha      (fecha_abono)
);

-- ============================================================
-- 2. TRIGGER BEFORE INSERT → calcula si es pago tardío
-- ============================================================
DROP TRIGGER IF EXISTS trg_abono_credito_calculos;

DELIMITER $$

CREATE TRIGGER trg_abono_credito_calculos
BEFORE INSERT ON abonos_credito
FOR EACH ROW
BEGIN
    DECLARE v_fecha_venc DATE;
    DECLARE v_dias       INT DEFAULT 0;

    SELECT fecha_vencimiento INTO v_fecha_venc
    FROM cuentas_por_cobrar
    WHERE id = NEW.cxc_id;

    IF v_fecha_venc IS NOT NULL THEN
        SET v_dias = DATEDIFF(CURDATE(), v_fecha_venc);
        IF v_dias > 0 THEN
            SET NEW.es_pago_tardio       = 1;
            SET NEW.dias_atraso_al_pagar = v_dias;
        END IF;
    END IF;
END$$

DELIMITER ;

-- ============================================================
-- 3. TRIGGER AFTER INSERT → actualiza cxc y credito_clientes
-- ============================================================
DROP TRIGGER IF EXISTS trg_actualizar_saldo_abono;

DELIMITER $$

CREATE TRIGGER trg_actualizar_saldo_abono
AFTER INSERT ON abonos_credito
FOR EACH ROW
BEGIN
    DECLARE v_monto_total    DECIMAL(12,2);
    DECLARE v_monto_pagado   DECIMAL(12,2);
    DECLARE v_fecha_venc     DATE;
    DECLARE v_credito_id     BIGINT;
    DECLARE v_nuevo_pagado   DECIMAL(12,2);
    DECLARE v_nuevo_estado   VARCHAR(20);
    DECLARE v_nuevo_atraso   INT;
    DECLARE v_era_vencida    TINYINT DEFAULT 0;

    -- Leer datos actuales de la CXC
    SELECT monto_total, monto_pagado, fecha_vencimiento, credito_cliente_id, estado_cxc = 'vencida'
    INTO   v_monto_total, v_monto_pagado, v_fecha_venc, v_credito_id, v_era_vencida
    FROM   cuentas_por_cobrar
    WHERE  id = NEW.cxc_id;

    -- Nuevo monto pagado (no exceder el total)
    SET v_nuevo_pagado = LEAST(v_monto_pagado + NEW.monto_abonado, v_monto_total);

    -- Calcular días de atraso actuales
    SET v_nuevo_atraso = GREATEST(0, DATEDIFF(CURDATE(), v_fecha_venc));

    -- Determinar nuevo estado
    IF v_nuevo_pagado >= v_monto_total THEN
        SET v_nuevo_estado = 'pagada';
        SET v_nuevo_atraso = 0;
    ELSEIF CURDATE() > v_fecha_venc THEN
        SET v_nuevo_estado = 'vencida';
    ELSEIF v_nuevo_pagado > 0 THEN
        SET v_nuevo_estado = 'parcial';
    ELSE
        SET v_nuevo_estado = 'activa';
    END IF;

    -- Actualizar cuentas_por_cobrar
    UPDATE cuentas_por_cobrar
    SET
        monto_pagado       = v_nuevo_pagado,
        estado_cxc         = v_nuevo_estado,
        fecha_ultimo_abono = NOW(),
        numero_abonos      = numero_abonos + 1,
        dias_atraso        = v_nuevo_atraso
    WHERE id = NEW.cxc_id;

    -- Actualizar credito_clientes si existe el perfil
    IF v_credito_id IS NOT NULL THEN
        UPDATE credito_clientes
        SET
            saldo_utilizado        = GREATEST(0, saldo_utilizado - NEW.monto_abonado),
            fecha_ultimo_pago      = NOW(),
            total_creditos_pagados = CASE
                WHEN v_nuevo_estado = 'pagada' THEN total_creditos_pagados + 1
                ELSE total_creditos_pagados
            END,
            total_creditos_vencidos = CASE
                WHEN v_nuevo_estado = 'pagada' AND v_era_vencida = 1
                    THEN GREATEST(0, total_creditos_vencidos - 1)
                ELSE total_creditos_vencidos
            END
        WHERE id = v_credito_id;
    END IF;
END$$

DELIMITER ;

-- ============================================================
-- VERIFICAR
-- ============================================================
-- SHOW CREATE TABLE abonos_credito;
-- SHOW TRIGGERS WHERE `Table` = 'abonos_credito';
