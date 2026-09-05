-- =====================================================
-- TABLA PARA PRODUCTOS ARCHIVADOS (Backup de eliminados)
-- Preserva historial de ventas/compras/movimientos
-- =====================================================

CREATE TABLE IF NOT EXISTS productos_archivados (
    id INT(11) NOT NULL,  -- Mantiene el ID original para referencias
    empresa_id INT(11) NOT NULL,
    codigo_barras VARCHAR(50) NULL,
    sku VARCHAR(50) NULL,
    nombre VARCHAR(200) NOT NULL,
    descripcion TEXT NULL,
    categoria_id INT(11) NULL,
    marca_id INT(11) NULL,
    unidad_medida_id INT(11) NULL,
    precio_compra DECIMAL(10,2) NOT NULL,
    precio_venta DECIMAL(10,2) NOT NULL,
    precio_oferta DECIMAL(10,2) NULL,
    precio_mayorista DECIMAL(10,2) NULL,
    cantidad_mayorista INT(11) NULL DEFAULT 6,
    stock DECIMAL(13,3) NOT NULL DEFAULT 0.000,
    stock_minimo DECIMAL(13,3) NULL DEFAULT 5.000,
    stock_maximo DECIMAL(13,3) NULL DEFAULT 100.000,
    imagen_url VARCHAR(1000) NULL,
    aplica_itbis TINYINT(1) NULL DEFAULT 1,
    activo TINYINT(1) NULL DEFAULT 0,  -- Siempre 0 para archivados
    fecha_vencimiento DATE NULL,
    lote VARCHAR(50) NULL,
    ubicacion_bodega VARCHAR(100) NULL,
    es_rastreable TINYINT(1) NOT NULL DEFAULT 0,
    tipo_activo ENUM('no_rastreable','vehiculo','electronico','electrodomestico','mueble','otro') NOT NULL DEFAULT 'no_rastreable',
    requiere_serie TINYINT(1) NOT NULL DEFAULT 0,
    permite_financiamiento TINYINT(1) NOT NULL DEFAULT 0,
    meses_max_financiamiento INT(11) NULL,
    meses_garantia INT(11) NULL DEFAULT 0,
    tasa_depreciacion DECIMAL(5,2) NULL,
    precio_por_unidad DECIMAL(12,2) NULL,
    permite_decimales TINYINT(1) NULL DEFAULT 0,
    unidad_venta_default_id INT(11) NULL,
    
    -- Campos de control de archivado
    fecha_eliminacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    eliminado_por INT(11) NULL,
    razon_eliminacion VARCHAR(255) NULL,
    
    -- Referencias a tablas relacionadas para auditoría
    total_ventas INT(11) NULL DEFAULT 0,  -- Cantidad de ventas al momento de eliminar
    total_compras INT(11) NULL DEFAULT 0, -- Cantidad de compras al momento de eliminar
    ultimo_movimiento DATETIME NULL,      -- Último movimiento registrado
    
    PRIMARY KEY (id),
    INDEX idx_empresa (empresa_id),
    INDEX idx_codigo_barras (codigo_barras),
    INDEX idx_sku (sku),
    INDEX idx_nombre (nombre),
    INDEX idx_fecha_eliminacion (fecha_eliminacion)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLA DE RELACIÓN: Ventas vs Productos Archivados
-- Permite mantener el historial intacto
-- =====================================================

CREATE TABLE IF NOT EXISTS ventas_productos_archivados (
    id INT(11) NOT NULL AUTO_INCREMENT,
    venta_id INT(11) NOT NULL,
    producto_archivado_id INT(11) NOT NULL,
    producto_original_id INT(11) NOT NULL,
    cantidad DECIMAL(13,3) NOT NULL,
    precio_unitario DECIMAL(10,2) NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    fecha_venta DATETIME NOT NULL,
    
    PRIMARY KEY (id),
    INDEX idx_venta (venta_id),
    INDEX idx_producto_archivado (producto_archivado_id),
    INDEX idx_producto_original (producto_original_id),
    INDEX idx_fecha (fecha_venta)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- PROCEDIMIENTO: Archivar y Eliminar Producto
-- =====================================================

DELIMITER //

CREATE PROCEDURE IF NOT EXISTS sp_archivar_y_eliminar_producto(
    IN p_producto_id INT,
    IN p_eliminado_por INT,
    IN p_razon VARCHAR(255)
)
BEGIN
    DECLARE v_empresa_id INT;
    DECLARE v_total_ventas INT DEFAULT 0;
    DECLARE v_total_compras INT DEFAULT 0;
    DECLARE v_ultimo_movimiento DATETIME;
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;
    
    START TRANSACTION;
    
    -- Obtener datos del producto
    SELECT empresa_id INTO v_empresa_id 
    FROM productos WHERE id = p_producto_id;
    
    IF v_empresa_id IS NULL THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'Producto no encontrado';
    END IF;
    
    -- Contar ventas relacionadas
    SELECT COUNT(*) INTO v_total_ventas 
    FROM detalle_ventas 
    WHERE producto_id = p_producto_id;
    
    -- Contar compras relacionadas
    SELECT COUNT(*) INTO v_total_compras 
    FROM detalle_compras 
    WHERE producto_id = p_producto_id;
    
    -- Obtener último movimiento
    SELECT MAX(fecha) INTO v_ultimo_movimiento 
    FROM movimientos_inventario 
    WHERE producto_id = p_producto_id;
    
    -- Copiar producto a archivados (con mismo ID)
    INSERT INTO productos_archivados (
        id, empresa_id, codigo_barras, sku, nombre, descripcion,
        categoria_id, marca_id, unidad_medida_id,
        precio_compra, precio_venta, precio_oferta, precio_mayorista,
        cantidad_mayorista, stock, stock_minimo, stock_maximo,
        imagen_url, aplica_itbis, activo,
        fecha_vencimiento, lote, ubicacion_bodega,
        es_rastreable, tipo_activo, requiere_serie,
        permite_financiamiento, meses_max_financiamiento,
        meses_garantia, tasa_depreciacion, precio_por_unidad,
        permite_decimales, unidad_venta_default_id,
        fecha_eliminacion, eliminado_por, razon_eliminacion,
        total_ventas, total_compras, ultimo_movimiento
    )
    SELECT 
        id, empresa_id, codigo_barras, sku, nombre, descripcion,
        categoria_id, marca_id, unidad_medida_id,
        precio_compra, precio_venta, precio_oferta, precio_mayorista,
        cantidad_mayorista, stock, stock_minimo, stock_maximo,
        imagen_url, aplica_itbis, 0,
        fecha_vencimiento, lote, ubicacion_bodega,
        es_rastreable, tipo_activo, requiere_serie,
        permite_financiamiento, meses_max_financiamiento,
        meses_garantia, tasa_depreciacion, precio_por_unidad,
        permite_decimales, unidad_venta_default_id,
        NOW(), p_eliminado_por, p_razon,
        v_total_ventas, v_total_compras, v_ultimo_movimiento
    FROM productos 
    WHERE id = p_producto_id;
    
    -- Copiar ventas relacionadas a tabla de respaldo
    INSERT INTO ventas_productos_archivados (
        venta_id, producto_archivado_id, producto_original_id,
        cantidad, precio_unitario, total, fecha_venta
    )
    SELECT 
        dv.venta_id, p_producto_id, p_producto_id,
        dv.cantidad, dv.precio_unitario, dv.total, v.fecha_venta
    FROM detalle_ventas dv
    JOIN ventas v ON dv.venta_id = v.id
    WHERE dv.producto_id = p_producto_id;
    
    -- Actualizar detalle_ventas para referenciar al producto archivado
    -- Esto mantiene la integridad referencial
    -- (Opcional: podemos poner NULL o mantener el ID que ahora existe en archivados)
    
    -- Eliminar registros de tablas que no son históricas esenciales
    DELETE FROM stock_sucursal WHERE producto_id = p_producto_id;
    DELETE FROM alertas_cantidad_producto WHERE producto_id = p_producto_id;
    DELETE FROM productos_catalogo WHERE producto_id = p_producto_id;
    DELETE FROM transferencias_stock_detalle WHERE producto_id = p_producto_id;
    DELETE FROM movimientos_stock_sucursal WHERE producto_id = p_producto_id;
    DELETE FROM presupuesto_tareas WHERE producto_id = p_producto_id;
    DELETE FROM servicios_recursos WHERE producto_id = p_producto_id;
    DELETE FROM compras_obra_detalle WHERE producto_id = p_producto_id;
    DELETE FROM saldo_despacho WHERE producto_id = p_producto_id;
    DELETE FROM historial_unidades_venta WHERE producto_id = p_producto_id;
    DELETE FROM pedidos_online_items WHERE producto_id = p_producto_id;
    
    -- NOTA: Las siguientes tablas NO se eliminan para preservar historial:
    -- detalle_ventas - Preservado (referencia al producto archivado)
    -- detalle_compras - Preservado
    -- cotizacion_detalle - Preservado
    -- conduce_detalle - Preservado
    -- movimientos_inventario - Preservado
    
    -- Finalmente, eliminar el producto original
    DELETE FROM productos WHERE id = p_producto_id;
    
    COMMIT;
    
    SELECT 'Producto archivado y eliminado exitosamente' AS mensaje;
END //

DELIMITER ;

-- =====================================================
-- VISTA: Productos Eliminados con Info de Ventas
-- =====================================================

CREATE OR REPLACE VIEW vista_productos_archivados AS
SELECT 
    pa.*,
    c.nombre as categoria_nombre,
    m.nombre as marca_nombre,
    um.abreviatura as unidad_medida,
    u.nombre as eliminado_por_nombre
FROM productos_archivados pa
LEFT JOIN categorias c ON pa.categoria_id = c.id
LEFT JOIN marcas m ON pa.marca_id = m.id
LEFT JOIN unidades_medida um ON pa.unidad_medida_id = um.id
LEFT JOIN usuarios u ON pa.eliminado_por = u.id;
