-- ============================================
-- QUERIES DE DIAGNOSTICO - PAGOS VACIOS
-- ============================================
-- Ejecuta estos queries en tu MariaDB para diagnosticar el problema

-- ============================================
-- 1. VERIFICACIÓN GENERAL
-- ============================================

-- Total de pagos en BD
SELECT COUNT(*) as total_pagos FROM pagos_financiamiento;

-- Pagos por empresa
SELECT empresa_id, COUNT(*) as total 
FROM pagos_financiamiento 
GROUP BY empresa_id;

-- IMPORTANTE: Si solo ves una empresa_id pero esperabas otra, 
-- ese podría ser el problema


-- ============================================
-- 2. VERIFICACIÓN POR ESTADO
-- ============================================

-- Desglose de pagos por estado
SELECT estado, COUNT(*) as total 
FROM pagos_financiamiento 
GROUP BY estado;

-- NOTA: Si todos los pagos están en 'registrado' en lugar de 'confirmado',
-- ese es un problema (revisa el código de registrarPagoCuota)


-- ============================================
-- 3. VERIFICACIÓN DE RELACIONES (JOINS)
-- ============================================

-- Ver relaciones de pagos
SELECT 
    p.id as pago_id,
    p.numero_recibo,
    p.estado,
    c.id as cuota_id,
    co.id as contrato_id,
    cl.id as cliente_id,
    u.id as usuario_id
FROM pagos_financiamiento p
LEFT JOIN cuotas_financiamiento c ON p.cuota_id = c.id
LEFT JOIN contratos_financiamiento co ON p.contrato_id = co.id
LEFT JOIN clientes cl ON p.cliente_id = cl.id
LEFT JOIN usuarios u ON p.registrado_por = u.id
LIMIT 10;

-- BUSCA: Si hay resultados con muchos NULL, significa que faltan datos relacionados


-- ============================================
-- 4. BUSCAR PAGOS HUÉRFANOS (sin relación)
-- ============================================

-- Pagos sin cuota
SELECT COUNT(*) as pagos_sin_cuota
FROM pagos_financiamiento p
WHERE p.cuota_id NOT IN (SELECT id FROM cuotas_financiamiento);

-- Pagos sin contrato
SELECT COUNT(*) as pagos_sin_contrato
FROM pagos_financiamiento p
WHERE p.contrato_id NOT IN (SELECT id FROM contratos_financiamiento);

-- Pagos sin cliente
SELECT COUNT(*) as pagos_sin_cliente
FROM pagos_financiamiento p
WHERE p.cliente_id NOT IN (SELECT id FROM clientes);

-- Pagos sin usuario registrador
SELECT COUNT(*) as pagos_sin_usuario
FROM pagos_financiamiento p
WHERE p.registrado_por NOT IN (SELECT id FROM usuarios);

-- NOTA: Si alguno de estos es > 0, tenemos datos corruptos


-- ============================================
-- 5. VER EJEMPLO COMPLETO DE PAGO
-- ============================================

-- Primer pago con TU empresa_id
SELECT 
    p.*,
    c.numero_cuota,
    c.monto_cuota,
    co.numero_contrato,
    cl.nombre as cliente_nombre,
    u.nombre as usuario_nombre
FROM pagos_financiamiento p
LEFT JOIN cuotas_financiamiento c ON p.cuota_id = c.id
LEFT JOIN contratos_financiamiento co ON p.contrato_id = co.id
LEFT JOIN clientes cl ON p.cliente_id = cl.id
LEFT JOIN usuarios u ON p.registrado_por = u.id
LIMIT 1;


-- ============================================
-- 6. CONTAR DATOS RELACIONADOS
-- ============================================

-- Total de cuotas
SELECT COUNT(*) as total_cuotas FROM cuotas_financiamiento;

-- Total de contratos
SELECT COUNT(*) as total_contratos FROM contratos_financiamiento;

-- Total de clientes
SELECT COUNT(*) as total_clientes FROM clientes;

-- Total de usuarios
SELECT COUNT(*) as total_usuarios FROM usuarios;

-- Total de empresas
SELECT COUNT(*) as total_empresas FROM empresas;


-- ============================================
-- 7. DEPURACIÓN POR EMPRESA ESPECÍFICA
-- ============================================

-- REEMPLAZA '1' con tu empresa_id real
-- Cuanta pagos para empresa 1
SELECT COUNT(*) as pagos_empresa_1
FROM pagos_financiamiento 
WHERE empresa_id = 1;

-- Ver todos los pagos de empresa 1
SELECT 
    id, numero_recibo, estado, fecha_pago, monto_pago, empresa_id
FROM pagos_financiamiento 
WHERE empresa_id = 1
ORDER BY fecha_pago DESC;

-- Ver estados de pagos en empresa 1
SELECT estado, COUNT(*) as total
FROM pagos_financiamiento 
WHERE empresa_id = 1
GROUP BY estado;


-- ============================================
-- 8. DEBUG: VALIDAR INTEGRIDAD
-- ============================================

-- Verificar campos NULL opcionales
SELECT 
    COUNT(*) as total,
    SUM(CASE WHEN cuota_id IS NULL THEN 1 ELSE 0 END) as cuota_null,
    SUM(CASE WHEN contrato_id IS NULL THEN 1 ELSE 0 END) as contrato_null,
    SUM(CASE WHEN cliente_id IS NULL THEN 1 ELSE 0 END) as cliente_null
FROM pagos_financiamiento;

-- Ver registros con problemas
SELECT *
FROM pagos_financiamiento 
WHERE cuota_id IS NULL 
   OR contrato_id IS NULL 
   OR cliente_id IS NULL
LIMIT 10;


-- ============================================
-- 9. ESTADÍSTICAS FINANCIERAS
-- ============================================

-- Total dinero por estado
SELECT 
    estado,
    COUNT(*) as cantidad,
    SUM(monto_pago) as total_monto,
    SUM(aplicado_capital) as capital_total,
    SUM(aplicado_interes) as interes_total,
    SUM(aplicado_mora) as mora_total
FROM pagos_financiamiento
GROUP BY estado;

-- Total por método de pago
SELECT 
    metodo_pago,
    COUNT(*) as cantidad,
    SUM(monto_pago) as total
FROM pagos_financiamiento
GROUP BY metodo_pago;


-- ============================================
-- 10. DIAGNÓSTICO RÁPIDO (EJECUTA ESTO PRIMERO)
-- ============================================

-- Un solo query que te da todo

SELECT 
    'TOTAL PAGOS' as metrica, COUNT(*) as valor
FROM pagos_financiamiento

UNION ALL

SELECT 'PAGOS EMPRESA 1', COUNT(*)
FROM pagos_financiamiento 
WHERE empresa_id = 1

UNION ALL

SELECT 'PAGOS CONFIRMADOS', COUNT(*)
FROM pagos_financiamiento 
WHERE estado = 'confirmado'

UNION ALL

SELECT 'PAGOS REGISTRADOS', COUNT(*)
FROM pagos_financiamiento 
WHERE estado = 'registrado'

UNION ALL

SELECT 'CUOTAS RELACIONADAS OK', 
    COUNT(DISTINCT p.id)
FROM pagos_financiamiento p
INNER JOIN cuotas_financiamiento c ON p.cuota_id = c.id

UNION ALL

SELECT 'CUOTAS RELACIONADAS SIN JOIN',
    COUNT(DISTINCT p.id)
FROM pagos_financiamiento p
WHERE p.cuota_id NOT IN (SELECT id FROM cuotas_financiamiento);


-- ============================================
-- INSTRUCCIONES DE USO
-- ============================================

-- 1. Abre tu cliente MariaDB (mysql -u usuario -p)
-- 2. Usa: USE punto_venta_rd;
-- 3. Copia y pega cada query
-- 4. Busca resultados sospechosos
-- 
-- RESULTADOS ESPERADOS:
-- ✅ "TOTAL PAGOS" > 0 (si hiciste pagos)
-- ✅ "PAGOS CONFIRMADOS" o "PAGOS REGISTRADOS" > 0
-- ✅ Los NULL counts = 0
-- ✅ Relaciones OK = mismo número que TOTAL PAGOS
--
-- ⚠️ PROBLEMAS COMUNES:
-- ❌ TODOS LOS QUERIES = 0 → No hay pagos,crea uno nuevo
-- ❌ TOTAL > 0 pero EMPRESA 1 = 0 → Cambió empresa_id
-- ❌ CONFIRMADOS = 0, REGISTRADOS > 0 → Check ESTADOS_PAGO
-- ❌ Muchos NULL → Datos corruptos en BD
