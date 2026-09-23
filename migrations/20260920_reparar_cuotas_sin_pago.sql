-- =====================================================
-- REPARACIÓN: Cuotas marcadas 'pagada' sin enlace en
-- fin_pago_cuotas (datos legacy / anteriores al enlace).
--
-- El botón "Imprimir recibo" en /admin/cuotas requiere
-- un pago_id. Estas cuotas marcan pagadas pero no tienen
-- fila en fin_pago_cuotas, por eso no mostraban el icono.
--
-- Estrategia: buscar un fin_pagos del mismo contrato con
-- fecha igual a la fecha_pago de la cuota, y crear el
-- enlace en fin_pago_cuotas con el monto pendiente.
-- =====================================================

-- 1) Diagnosticar: cuotas pagadas sin enlace
SELECT cu.id,
       cu.contrato_id,
       cu.numero,
       cu.monto,
       cu.fecha_pago,
       cu.empresa_id
FROM fin_cuotas cu
WHERE cu.estado IN ('pagada', 'parcial')
  AND NOT EXISTS (SELECT 1 FROM fin_pago_cuotas pc WHERE pc.cuota_id = cu.id);

-- 2) Crear enlaces faltantes (subconsulta correlacionada: 1 pago por cuota)
INSERT INTO fin_pago_cuotas (pago_id, cuota_id, monto)
SELECT (
    SELECT pg.id FROM fin_pagos pg
    WHERE pg.contrato_id = cu.contrato_id
      AND pg.empresa_id = cu.empresa_id
      AND pg.fecha     = cu.fecha_pago
    ORDER BY pg.id DESC
    LIMIT 1
) AS pago_id,
       cu.id,
       cu.monto
FROM fin_cuotas cu
WHERE cu.estado IN ('pagada', 'parcial')
  AND cu.fecha_pago IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM fin_pago_cuotas pc WHERE pc.cuota_id = cu.id)
  AND EXISTS (
    SELECT 1 FROM fin_pagos pg2
    WHERE pg2.contrato_id = cu.contrato_id
      AND pg2.empresa_id = cu.empresa_id
      AND pg2.fecha     = cu.fecha_pago
  );
-- NOTA: usa el último pago (id más alto) del contrato con la misma
-- fecha que fecha_pago. Revisa el diagnóstico anterior antes de
-- ejecutar si hay ambigüedad (varios pagos el mismo día).

-- 3) Verificar después de reparar
SELECT cu.id,
       cu.contrato_id,
       cu.numero,
       cu.estado,
       cu.fecha_pago,
       (SELECT MAX(pago_id) FROM fin_pago_cuotas pc WHERE pc.cuota_id = cu.id) AS ultimo_pago_id
FROM fin_cuotas cu
WHERE cu.estado IN ('pagada', 'parcial')
ORDER BY cu.contrato_id, cu.numero;
