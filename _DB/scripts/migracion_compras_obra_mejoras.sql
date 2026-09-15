-- =====================================================
-- MIGRACIÓN: MEJORAS MÓDULO COMPRAS DE OBRA
-- Metodología de Materiales y Plantillas
-- =====================================================
-- 
-- Esta migración agrega:
-- 1. Catálogo de materiales (sugerencias, no obligatorio)
-- 2. Categorías de materiales
-- 3. Historial de precios por proveedor
-- 4. Plantillas de compra reutilizables
-- 5. Campo categoria_material_id en compras_obra_detalle
--
-- Fecha: 2026-01-29
-- =====================================================

-- =====================================================
-- 1. TABLA: materiales_categorias
-- =====================================================
-- Categorías para organizar materiales (Cementos, Agregados, Acero, etc.)

CREATE TABLE IF NOT EXISTS materiales_categorias (
    id INT(11) NOT NULL AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    PRIMARY KEY (id),
    KEY idx_activo (activo),
    KEY idx_nombre (nombre)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Categorías de materiales para organización';

-- =====================================================
-- 2. TABLA: materiales_catalogo
-- =====================================================
-- Catálogo de materiales reutilizables (solo sugerencias, no obligatorio)
-- Los materiales pueden crearse libremente sin estar en el catálogo

CREATE TABLE IF NOT EXISTS materiales_catalogo (
    id INT(11) NOT NULL AUTO_INCREMENT,
    empresa_id INT(11) NOT NULL,
    
    -- Identificación
    codigo VARCHAR(50),
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    
    -- Clasificación
    categoria_id INT(11),
    unidad_medida_base VARCHAR(50) NOT NULL COMMENT 'Unidad por defecto (saco, m³, kg, etc.)',
    
    -- Estado
    es_activo BOOLEAN DEFAULT TRUE,
    
    -- Auditoría
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    PRIMARY KEY (id),
    KEY idx_empresa (empresa_id),
    KEY idx_categoria (categoria_id),
    KEY idx_nombre (nombre),
    KEY idx_activo (es_activo),
    KEY idx_codigo (codigo),
    
    FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
    FOREIGN KEY (categoria_id) REFERENCES materiales_categorias(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Catálogo de materiales para autocompletado y sugerencias (no obligatorio)';

-- =====================================================
-- 3. TABLA: materiales_precios
-- =====================================================
-- Historial de precios por proveedor para sugerencias automáticas

CREATE TABLE IF NOT EXISTS materiales_precios (
    id INT(11) NOT NULL AUTO_INCREMENT,
    
    -- Relaciones
    material_id INT(11) NOT NULL,
    proveedor_id INT(11) NOT NULL,
    
    -- Precio
    precio DECIMAL(10,2) NOT NULL,
    moneda VARCHAR(10) DEFAULT 'RD$',
    
    -- Vigencia
    fecha_inicio DATE,
    fecha_fin DATE COMMENT 'NULL si es precio vigente',
    
    -- Auditoría
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    PRIMARY KEY (id),
    KEY idx_material (material_id),
    KEY idx_proveedor (proveedor_id),
    KEY idx_material_proveedor (material_id, proveedor_id),
    KEY idx_vigente (fecha_fin),
    
    FOREIGN KEY (material_id) REFERENCES materiales_catalogo(id) ON DELETE CASCADE,
    FOREIGN KEY (proveedor_id) REFERENCES proveedores(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Historial de precios de materiales por proveedor para sugerencias';

-- =====================================================
-- 4. TABLA: plantillas_compra_obra
-- =====================================================
-- Plantillas de compra reutilizables para acelerar el registro

CREATE TABLE IF NOT EXISTS plantillas_compra_obra (
    id INT(11) NOT NULL AUTO_INCREMENT,
    empresa_id INT(11) NOT NULL,
    
    -- Identificación
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT,
    
    -- Tipo de destino
    tipo_destino ENUM('obra', 'servicio') NOT NULL COMMENT 'Tipo de destino para el cual aplica la plantilla',
    
    -- Estado
    es_activa BOOLEAN DEFAULT TRUE,
    
    -- Auditoría
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    PRIMARY KEY (id),
    KEY idx_empresa (empresa_id),
    KEY idx_tipo_destino (tipo_destino),
    KEY idx_activa (es_activa),
    
    FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Plantillas de compra para acelerar el registro de compras repetitivas';

-- =====================================================
-- 5. TABLA: plantillas_compra_obra_detalle
-- =====================================================
-- Detalle de materiales en cada plantilla

CREATE TABLE IF NOT EXISTS plantillas_compra_obra_detalle (
    id INT(11) NOT NULL AUTO_INCREMENT,
    plantilla_id INT(11) NOT NULL,
    
    -- Material
    material_id INT(11) NOT NULL COMMENT 'Referencia al catálogo de materiales',
    
    -- Cantidades de referencia (el usuario puede modificarlas)
    unidad_medida VARCHAR(50),
    cantidad_referencial DECIMAL(10,2) COMMENT 'Cantidad sugerida, editable por el usuario',
    
    -- Orden de visualización
    orden INT(11) DEFAULT 0,
    
    PRIMARY KEY (id),
    KEY idx_plantilla (plantilla_id),
    KEY idx_material (material_id),
    KEY idx_orden (orden),
    
    FOREIGN KEY (plantilla_id) REFERENCES plantillas_compra_obra(id) ON DELETE CASCADE,
    FOREIGN KEY (material_id) REFERENCES materiales_catalogo(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Detalle de materiales en plantillas de compra';

-- =====================================================
-- 6. MODIFICACIÓN: compras_obra_detalle
-- =====================================================
-- Agregar campo categoria_material_id para mejor reporte y análisis

ALTER TABLE compras_obra_detalle 
ADD COLUMN categoria_material_id INT(11) NULL COMMENT 'Categoría del material para reportes' AFTER producto_id,
ADD KEY idx_categoria (categoria_material_id),
ADD CONSTRAINT compras_obra_detalle_fk_categoria 
    FOREIGN KEY (categoria_material_id) 
    REFERENCES materiales_categorias(id) 
    ON DELETE SET NULL;

-- =====================================================
-- 7. DATOS INICIALES: Categorías de Materiales
-- =====================================================
-- Insertar categorías comunes para construcción

INSERT INTO materiales_categorias (nombre, descripcion) VALUES
('Cementos', 'Cementos y productos relacionados'),
('Agregados', 'Arena, gravilla, piedra, etc.'),
('Acero', 'Varillas, alambres, mallas, etc.'),
('Acabados', 'Pintura, cerámica, azulejos, etc.'),
('Eléctricos', 'Cables, interruptores, tomas, etc.'),
('Sanitarios', 'Tuberías, grifos, sanitarios, etc.'),
('Herramientas', 'Herramientas de construcción'),
('Otros', 'Otros materiales diversos')
ON DUPLICATE KEY UPDATE nombre=nombre;

-- =====================================================
-- FIN DE MIGRACIÓN
-- =====================================================

INSERT INTO materiales_categorias (nombre, descripcion) VALUES
-- Construcción básica
('Cementos y Morteros', 'Cementos Portland, cola fría, morteros premezclados'),
('Agregados y Áridos', 'Arena, gravilla, piedra chancada, ripio'),
('Acero Estructural', 'Varillas corrugadas, mallas electrosoldadas, perfiles'),
('Hormigón y Concreto', 'Concreto premezclado, aditivos, fibras'),

-- Albañilería y cerramientos
('Ladrillos y Bloques', 'Bloques de hormigón, ladrillos cerámicos, bloques livianos'),
('Madera y Encofrados', 'Pino, eucalipto, terciado fenólico, tablas'),
('Aislación Térmica', 'Lana de vidrio, poliestireno expandido, membrana asfáltica'),

-- Instalaciones
('Instalaciones Eléctricas', 'Cables, cajas, enchufes, interruptores, ductos'),
('Instalaciones Sanitarias', 'PVC, cobre, bronce, grifería, desagües'),
('Gasfitería', 'Tuberías de gas, válvulas, reguladores, flexibles'),
('Climatización', 'Ductos de ventilación, rejillas, aislantes'),

-- Terminaciones
('Revestimientos Cerámicos', 'Cerámicos, porcelanatos, guardapolvos'),
('Pinturas y Barnices', 'Látex, esmaltes, barnices, selladores'),
('Cielos y Tabiques', 'Placas de yeso, perfiles metálicos, lanas'),
('Pisos', 'Cerámica, porcelanato, madera, vinílicos'),

-- Carpintería y herrajes
('Puertas y Ventanas', 'Puertas, marcos, ventanas de aluminio/PVC'),
('Herrajes y Cerrajería', 'Bisagras, cerraduras, picaportes, correderas'),

-- Equipamiento
('Herramientas Manuales', 'Palas, combos, niveles, huinchas'),
('Herramientas Eléctricas', 'Taladros, amoladoras, sierras'),
('Equipos de Seguridad', 'Cascos, guantes, arneses, señalética');

INSERT INTO materiales_catalogo (empresa_id, codigo, nombre, descripcion, categoria_id, unidad_medida_base) VALUES

-- CEMENTOS Y MORTEROS (10)
(2, 'CEM-001', 'Cemento Polpaico Extra Fuerte 42.5kg', 'Cemento Portland puzolánico alta resistencia', 1, 'saco'),
(2, 'CEM-002', 'Cemento Melón Ultra 42.5kg', 'Cemento Portland especial', 1, 'saco'),
(2, 'CEM-003', 'Cemento BioCem 42.5kg', 'Cemento ecológico baja emisión', 1, 'saco'),
(2, 'MOR-001', 'Mortero Topex Pegamento Cerámico 25kg', 'Adhesivo cementicio gris', 1, 'saco'),
(2, 'MOR-002', 'Mortero Bekron Estuco Muro 25kg', 'Estuco fino para terminaciones', 1, 'saco'),
(2, 'MOR-003', 'Yeso Volcanita 25kg', 'Yeso para enlucidos', 1, 'saco'),
(2, 'COL-001', 'Cola Fría Agorex 1kg', 'Adhesivo vinílico carpintería', 1, 'kg'),
(2, 'COL-002', 'Pegamento Bekron Contacto 1lt', 'Adhesivo de contacto multiuso', 1, 'litro'),
(2, 'FRA-001', 'Fragüe Bekron Blanco 1kg', 'Pasta para juntas cerámicas', 1, 'kg'),
(2, 'FRA-002', 'Fragüe Bekron Gris 5kg', 'Pasta para porcelanato', 1, 'kg'),

-- AGREGADOS Y ÁRIDOS (8)
(2, 'ARE-001', 'Arena Fina Lavada m³', 'Arena para mortero y concreto', 2, 'm3'),
(2, 'ARE-002', 'Arena Gruesa m³', 'Arena para rellenos', 2, 'm3'),
(2, 'GRA-001', 'Gravilla 3/8" m³', 'Piedra chancada pequeña', 2, 'm3'),
(2, 'GRA-002', 'Gravilla 3/4" m³', 'Piedra chancada mediana', 2, 'm3'),
(2, 'PIE-001', 'Ripio 1" m³', 'Piedra chancada grande', 2, 'm3'),
(2, 'PIE-002', 'Bolón Desplazado m³', 'Piedra grande para cimientos', 2, 'm3'),
(2, 'ARE-003', 'Arena de Pega m³', 'Arena específica para pega de bloques', 2, 'm3'),
(2, 'GRA-003', 'Gravilla Decorativa Blanca 20kg', 'Para jardines y decoración', 2, 'saco'),

-- ACERO ESTRUCTURAL (15)
(2, 'VAR-008', 'Varilla Estriada 8mm (6m)', 'Fierro corrugado A630-420H', 3, 'unidad'),
(2, 'VAR-010', 'Varilla Estriada 10mm (6m)', 'Fierro corrugado estructural', 3, 'unidad'),
(2, 'VAR-012', 'Varilla Estriada 12mm (6m)', 'Fierro corrugado alta resistencia', 3, 'unidad'),
(2, 'VAR-016', 'Varilla Estriada 16mm (6m)', 'Fierro corrugado columnas', 3, 'unidad'),
(2, 'VAR-020', 'Varilla Estriada 20mm (6m)', 'Fierro corrugado vigas principales', 3, 'unidad'),
(2, 'VAR-025', 'Varilla Estriada 25mm (6m)', 'Fierro corrugado fundaciones', 3, 'unidad'),
(2, 'MAL-001', 'Malla Acma C-92 (2.4x6m)', 'Malla electrosoldada losas', 3, 'plancha'),
(2, 'MAL-002', 'Malla Acma C-131 (2.4x6m)', 'Malla reforzada radieres', 3, 'plancha'),
(2, 'MAL-003', 'Malla Acma C-188 (2.4x6m)', 'Malla alta resistencia muros', 3, 'plancha'),
(2, 'ALA-001', 'Alambre Galvanizado N°18', 'Para amarras de fierro', 3, 'kg'),
(2, 'ALA-002', 'Alambre Recocido N°16', 'Amarra estructural', 3, 'kg'),
(2, 'PER-001', 'Perfil Metálico C 80x40x15x2mm (6m)', 'Canal galvanizado tabiquería', 3, 'unidad'),
(2, 'PER-002', 'Perfil Metálico U 41x30x0.5mm (3m)', 'Montante galvanizado cielos', 3, 'unidad'),
(2, 'ANG-001', 'Ángulo 30x30x3mm (6m)', 'Perfil angular acero negro', 3, 'unidad'),
(2, 'PLN-001', 'Plancha Lisa LAC 1.5mm (1.22x2.44m)', 'Lámina acero carbono', 3, 'plancha'),

-- HORMIGÓN Y CONCRETO (6)
(2, 'HOR-G17', 'Hormigón Premezclado H20 m³', 'Concreto G17 para losas y vigas', 4, 'm3'),
(2, 'HOR-G25', 'Hormigón Premezclado H30 m³', 'Concreto G25 alta resistencia', 4, 'm3'),
(2, 'ADI-001', 'Sika Plastificante 1kg', 'Aditivo reductor agua', 4, 'kg'),
(2, 'ADI-002', 'Sika Acelerante Fraguado 1lt', 'Acelera tiempos de curado', 4, 'litro'),
(2, 'FIB-001', 'Fibra Sintética Sikafiber 600gr', 'Refuerzo para concreto', 4, 'bolsa'),
(2, 'CUR-001', 'Antisol Curador Concreto 20lt', 'Membrana curado superficial', 4, 'tineta'),

-- LADRILLOS Y BLOQUES (12)
(2, 'BLO-010', 'Bloque Cemento 10cm Liso', 'Bloque hormigón tabiquería', 5, 'unidad'),
(2, 'BLO-015', 'Bloque Cemento 15cm Liso', 'Bloque hormigón estructural', 5, 'unidad'),
(2, 'BLO-020', 'Bloque Cemento 20cm Liso', 'Bloque hormigón muros carga', 5, 'unidad'),
(2, 'BLO-H10', 'Bloque Cemento 10cm Hueco', 'Bloque tabique liviano', 5, 'unidad'),
(2, 'BLO-H15', 'Bloque Cemento 15cm Hueco', 'Bloque aislante térmico', 5, 'unidad'),
(2, 'LAD-001', 'Ladrillo Princesa 29x14x7.1cm', 'Ladrillo cerámico fiscal', 5, 'unidad'),
(2, 'LAD-002', 'Ladrillo Titán 29x14x7.1cm', 'Ladrillo cerámico reforzado', 5, 'unidad'),
(2, 'LAD-PAN', 'Ladrillo Pandereta 29x14x8cm', 'Ladrillo perforado tabiques', 5, 'unidad'),
(2, 'LAD-REF', 'Ladrillo Refractario 23x11.4x6.4cm', 'Para hornos y chimeneas', 5, 'unidad'),
(2, 'PIE-HOG', 'Piedra Pizarra Hogar 20x40cm', 'Revestimiento hogares', 5, 'unidad'),
(2, 'ADO-001', 'Adoquín Gris 20x10x6cm', 'Adoquín hormigón pavimentos', 5, 'unidad'),
(2, 'ADO-002', 'Adoquín Rojo 20x10x6cm', 'Adoquín decorativo patios', 5, 'unidad'),

-- MADERA Y ENCOFRADOS (10)
(2, 'TAB-001', 'Tabla Pino 1x8" (3.20m)', 'Madera bruta construcción', 6, 'unidad'),
(2, 'TAB-002', 'Tabla Pino 1x10" (3.20m)', 'Madera encofrado', 6, 'unidad'),
(2, 'TAB-003', 'Tabla Pino 2x4" (3.20m)', 'Pie derecho estructura', 6, 'unidad'),
(2, 'TAB-004', 'Tabla Pino 2x6" (3.20m)', 'Solera superior techumbre', 6, 'unidad'),
(2, 'TER-015', 'Terciado Pino 15mm (1.22x2.44m)', 'Placa contrachapada', 6, 'plancha'),
(2, 'TER-018', 'Terciado Estructural 18mm (1.22x2.44m)', 'Fenólico encofrados', 6, 'plancha'),
(2, 'OSB-011', 'Placa OSB 11mm (1.22x2.44m)', 'Tablero fibra orientada', 6, 'plancha'),
(2, 'CHO-001', 'Cholguán Pino 18mm (1.22x2.44m)', 'Aglomerado melamina', 6, 'plancha'),
(2, 'LIS-001', 'Listón Pino 2x2" (3.20m)', 'Listón cepillado carpintería', 6, 'unidad'),
(2, 'VIG-001', 'Viga Laminada Pino 4x8" (4m)', 'Madera estructural techumbre', 6, 'unidad'),

-- AISLACIÓN TÉRMICA (8)
(2, 'LAN-050', 'Lana de Vidrio Fisiterm 50mm (1.2x10m)', 'Rollo aislante térmico', 7, 'rollo'),
(2, 'LAN-080', 'Lana de Vidrio Fisiterm 80mm (1.2x5m)', 'Rollo alta densidad', 7, 'rollo'),
(2, 'POL-020', 'Poliestireno Expandido 20mm (1x2m)', 'Plancha EPS densidad 10', 7, 'plancha'),
(2, 'POL-050', 'Poliestireno Expandido 50mm (1x2m)', 'Plancha EPS densidad 15', 7, 'plancha'),
(2, 'MEM-001', 'Membrana Asfáltica Alu 4mm (10m²)', 'Impermeabilizante techumbre', 7, 'rollo'),
(2, 'MEM-002', 'Fieltro Asfáltico N°15 (20m²)', 'Membrana base techado', 7, 'rollo'),
(2, 'BAR-VPR', 'Barrera Vapor Reflex (2x50m)', 'Film aluminizado reflectante', 7, 'rollo'),
(2, 'ESP-PUR', 'Espuma Poliuretano 750ml', 'Espuma expansiva sellado', 7, 'lata'),

-- INSTALACIONES ELÉCTRICAS (15)
(2, 'CAB-THH-12', 'Cable THHN/THWN 12 AWG', 'Conductor cobre 2.5mm²', 8, 'metro'),
(2, 'CAB-THH-10', 'Cable THHN/THWN 10 AWG', 'Conductor cobre 4mm²', 8, 'metro'),
(2, 'CAB-THH-08', 'Cable THHN/THWN 8 AWG', 'Conductor cobre 6mm²', 8, 'metro'),
(2, 'CAB-COX-12', 'Cable Cobre Desnudo 12 AWG', 'Cable tierra física', 8, 'metro'),
(2, 'CON-220', 'Conduit PVC 20mm (3m)', 'Tubería eléctrica liviana', 8, 'unidad'),
(2, 'CON-225', 'Conduit PVC 25mm (3m)', 'Tubería eléctrica mediana', 8, 'unidad'),
(2, 'CAJ-REC', 'Caja Rectangular PVC', 'Caja embutir enchufes', 8, 'unidad'),
(2, 'CAJ-OCT', 'Caja Octogonal PVC', 'Caja embutir lámparas', 8, 'unidad'),
(2, 'ENC-SIM', 'Enchufe Simple 10A Blanco', 'Tomacorriente 2P', 8, 'unidad'),
(2, 'ENC-DOB', 'Enchufe Doble 10A Blanco', 'Tomacorriente 2P doble', 8, 'unidad'),
(2, 'INT-SIM', 'Interruptor Simple 10A Blanco', 'Apagador 1 vía', 8, 'unidad'),
(2, 'INT-DOB', 'Interruptor Doble 10A Blanco', 'Apagador 2 vías', 8, 'unidad'),
(2, 'TAB-4CIR', 'Tablero Residencial 4 Circuitos', 'Centro carga embutir', 8, 'unidad'),
(2, 'DIS-2x20', 'Disyuntor Termomagnético 2x20A', 'Breaker bipolar', 8, 'unidad'),
(2, 'CIN-AIS', 'Cinta Aisladora Scotch 3M', 'Cinta vinílica negra', 8, 'unidad'),

-- INSTALACIONES SANITARIAS (12)
(2, 'PVC-DES-110', 'Tubería PVC Desagüe 110mm (3m)', 'Tubo sanitario gris', 9, 'unidad'),
(2, 'PVC-DES-75', 'Tubería PVC Desagüe 75mm (3m)', 'Tubo sanitario mediano', 9, 'unidad'),
(2, 'PVC-DES-50', 'Tubería PVC Desagüe 50mm (3m)', 'Tubo sanitario pequeño', 9, 'unidad'),
(2, 'PVC-PRE-25', 'Tubería PVC Presión 25mm (6m)', 'Tubo agua fría PN10', 9, 'unidad'),
(2, 'PVC-PRE-20', 'Tubería PVC Presión 20mm (6m)', 'Tubo agua ramal', 9, 'unidad'),
(2, 'COD-TEE-110', 'Codo PVC 110mm 90°', 'Conexión desagüe', 9, 'unidad'),
(2, 'TEE-PVC-110', 'Tee PVC 110mm', 'Derivación sanitaria', 9, 'unidad'),
(2, 'REJ-PIS-100', 'Rejilla Piso Bronce 10cm', 'Sumidero ducha', 9, 'unidad'),
(2, 'SIF-LAV', 'Sifón Botella Lavamanos', 'Sifón flexible PVC', 9, 'unidad'),
(2, 'FLE-INO-40', 'Flexible Inodoro 40cm', 'Manguera conexión estanque', 9, 'unidad'),
(2, 'LLA-LAV', 'Llave Lavamanos Monomando', 'Grifería monocomando cromo', 9, 'unidad'),
(2, 'LLA-DUC', 'Llave Ducha Monomando', 'Mezcladora monocomando', 9, 'unidad');

INSERT INTO materiales_catalogo (empresa_id, codigo, nombre, descripcion, categoria_id, unidad_medida_base) VALUES

-- GASFITERÍA (6)
(2, 'TUB-COB-15', 'Tubería Cobre 15mm (5m)', 'Tubo cobre tipo M agua caliente', 10, 'unidad'),
(2, 'TUB-COB-22', 'Tubería Cobre 22mm (5m)', 'Tubo cobre colector principal', 10, 'unidad'),
(2, 'VAL-PAS-20', 'Válvula Paso 20mm Bronce', 'Llave de paso agua', 10, 'unidad'),
(2, 'VAL-CHE-20', 'Válvula Check 20mm', 'Antirretorno agua', 10, 'unidad'),
(2, 'FIT-COD-15', 'Codo Cobre 15mm 90°', 'Fitting soldable', 10, 'unidad'),
(2, 'SOL-EST', 'Soldadura Estaño 50/50 500gr', 'Soldadura gasfitería', 10, 'rollo'),

-- CLIMATIZACIÓN (4)
(2, 'DUC-FLE-150', 'Ducto Flexible Aluminio 150mm (7.6m)', 'Conducto ventilación', 11, 'rollo'),
(2, 'REJ-VEN-200', 'Rejilla Ventilación 20x20cm Blanca', 'Rejilla extracción aire', 11, 'unidad'),
(2, 'EXT-BAÑ', 'Extractor Baño 6" 150mm', 'Ventilador axial doméstico', 11, 'unidad'),
(2, 'CIN-AIS-DUC', 'Cinta Aluminio Ductos 5cm x 45m', 'Cinta sellado ductos', 11, 'rollo'),

-- REVESTIMIENTOS CERÁMICOS (10)
(2, 'CER-PIE-45', 'Cerámica Piso Blanco Mate 45x45cm', 'Cerámico tránsito medio', 12, 'm2'),
(2, 'CER-PIE-60', 'Porcelanato Esmaltado Gris 60x60cm', 'Porcelanato alto tránsito', 12, 'm2'),
(2, 'CER-MUR-30', 'Cerámica Muro Blanco Brillante 30x60cm', 'Revestimiento baños', 12, 'm2'),
(2, 'CER-EXT', 'Cerámica Exterior Antideslizante 45x45cm', 'Cerámico terraza R11', 12, 'm2'),
(2, 'GUA-CER-10', 'Guardapolvo Cerámico 10cm', 'Zócalo cerámico', 12, 'metro'),
(2, 'PED-CER', 'Peldaño Cerámico Antideslizante 30x30cm', 'Huella escalera', 12, 'unidad'),
(2, 'CRU-3MM', 'Cruceta 3mm (100 und)', 'Nivelador junta cerámica', 12, 'bolsa'),
(2, 'PAS-CER', 'Pasta Cerámica Exterior Bekron 25kg', 'Adhesivo flexible C2TE', 12, 'saco'),
(2, 'FRA-BLA-5', 'Fragüe Bekron Blanco Brillante 5kg', 'Pasta junta porcelanato', 12, 'kg'),
(2, 'PER-DES', 'Perfil Despiece Aluminio 10mm (2.5m)', 'Perfil dilatación', 12, 'unidad'),

-- PINTURAS Y BARNICES (12)
(2, 'PIN-LAT-BLA', 'Látex Interior Soquina Blanco 1gl', 'Pintura lavable interior', 13, 'galon'),
(2, 'PIN-LAT-COL', 'Látex Interior Ceresita Color 1gl', 'Pintura tintable interior', 13, 'galon'),
(2, 'PIN-ESM-BLA', 'Esmalte Sintético Blanco Ceresita 1gl', 'Esmalte alto brillo', 13, 'galon'),
(2, 'PIN-FAC-BLA', 'Látex Fachada Soquina Blanco 1gl', 'Pintura exterior alta cobertura', 13, 'galon'),
(2, 'IMP-MUR', 'Imprimante Muros Ceresita 1gl', 'Sellador paredes nuevas', 13, 'galon'),
(2, 'IMP-MAD', 'Imprimante Maderas Ceresita 1gl', 'Sellador madera', 13, 'galon'),
(2, 'BAR-MAR', 'Barniz Marino Caoba 1gl', 'Barniz exterior madera', 13, 'galon'),
(2, 'BAR-PIE', 'Barniz Piso Plastificado 1gl', 'Barniz poliuretano suelos', 13, 'galon'),
(2, 'PAS-MUR', 'Pasta Muro Lista 5kg', 'Estuco interior fino', 13, 'kg'),
(2, 'DIL-PIN', 'Diluyente Aguarrás 1lt', 'Solvente pinturas', 13, 'litro'),
(2, 'ROD-9"', 'Rodillo Esponja 9"', 'Rodillo pintura látex', 13, 'unidad'),
(2, 'BRO-4"', 'Brocha Cerda Natural 4"', 'Brocha pintura', 13, 'unidad');

-- Continuamos con las categorías restantes...
-- (Por brevedad, comparto el patrón completo y puedes replicarlo)
# 💰 3. MATERIALES_PRECIOS (100+ registros para proveedor_id: 1)
INSERT INTO materiales_precios (material_id, proveedor_id, precio, moneda, fecha_inicio, fecha_fin) VALUES
-- Cementos (ajusta los material_id según tus IDs reales)
(1, 1, 8500, 'CLP', '2025-12-01', NULL),
(2, 1, 8700, 'CLP', '2025-12-01', NULL),
(3, 1, 9200, 'CLP', '2026-01-15', NULL),
(4, 1, 12500, 'CLP', '2025-11-20', NULL),
(5, 1, 11800, 'CLP', '2025-12-10', NULL),
(6, 1, 7200, 'CLP', '2025-12-05', NULL),
(7, 1, 4500, 'CLP', '2025-11-15', NULL),
(8, 1, 8900, 'CLP', '2026-01-10', NULL),
(9, 1, 2800, 'CLP', '2025-12-20', NULL),
(10, 1, 13500, 'CLP', '2026-01-05', NULL),

-- Agregados (precios por m³)
(11, 1, 18000, 'CLP', '2025-12-01', NULL),
(12, 1, 16000, 'CLP', '2025-12-01', NULL),
(13, 1, 22000, 'CLP', '2025-12-15', NULL),
(14, 1, 24000, 'CLP', '2026-01-05', NULL),
(15, 1, 28000, 'CLP', '2025-11-25', NULL),
(16, 1, 35000, 'CLP', '2025-12-10', NULL),
(17, 1, 19000, 'CLP', '2026-01-10', NULL),
(18, 1, 5500, 'CLP', '2025-12-20', NULL),

-- Aceros (varillas y mallas)
(19, 1, 7800, 'CLP', '2025-12-01', NULL),
(20, 1, 9500, 'CLP', '2025-12-01', NULL),
(21, 1, 12200, 'CLP', '2025-11-28', NULL),
(22, 1, 18500, 'CLP', '2025-12-15', NULL),
(23, 1, 28000, 'CLP', '2026-01-05', NULL),
(24, 1, 42000, 'CLP', '2025-12-20', NULL),
(25, 1, 45000, 'CLP', '2025-12-10', NULL),
(26, 1, 52000, 'CLP', '2026-01-15', NULL),
(27, 1, 68000, 'CLP', '2025-11-30', NULL),
(28, 1, 3200, 'CLP', '2025-12-05', NULL),
(29, 1, 3500, 'CLP', '2025-12-18', NULL),
(30, 1, 12800, 'CLP', '2026-01-08', NULL),
(31, 1, 6200, 'CLP', '2025-12-22', NULL),
(32, 1, 18500, 'CLP', '2026-01-12', NULL),
(33, 1, 38000, 'CLP', '2025-11-20', NULL),

-- Hormigones y aditivos
(34, 1, 85000, 'CLP', '2025-12-01', NULL),
(35, 1, 95000, 'CLP', '2025-12-01', NULL),
(36, 1, 15500, 'CLP', '2025-12-10', NULL),
(37, 1, 18200, 'CLP', '2026-01-05', NULL),
(38, 1, 12800, 'CLP', '2025-12-15', NULL),
(39, 1, 28000, 'CLP', '2025-11-25', NULL),

-- Bloques y ladrillos (40-51)
(40, 1, 850, 'CLP', '2025-12-01', NULL),
(41, 1, 1100, 'CLP', '2025-12-01', NULL),
(42, 1, 1450, 'CLP', '2025-12-05', NULL),
(43, 1, 780, 'CLP', '2025-12-10', NULL),
(44, 1, 980, 'CLP', '2025-12-15', NULL),
(45, 1, 480, 'CLP', '2025-11-28', NULL),
(46, 1, 520, 'CLP', '2025-12-01', NULL),
(47, 1, 380, 'CLP', '2026-01-05', NULL),
(48, 1, 1200, 'CLP', '2025-12-20', NULL),
(49, 1, 3500, 'CLP', '2025-11-30', NULL),
(50, 1, 650, 'CLP', '2025-12-18', NULL),
(51, 1, 720, 'CLP', '2026-01-10', NULL),

-- Maderas (52-61)
(52, 1, 2800, 'CLP', '2025-12-01', NULL),
(53, 1, 3200, 'CLP', '2025-12-01', NULL),
(54, 1, 4500, 'CLP', '2025-12-05', NULL),
(55, 1, 6800, 'CLP', '2025-12-10', NULL),
(56, 1, 18500, 'CLP', '2025-11-25', NULL),
(57, 1, 22000, 'CLP', '2025-12-15', NULL),
(58, 1, 15800, 'CLP', '2026-01-05', NULL),
(59, 1, 12500, 'CLP', '2025-12-20', NULL),
(60, 1, 1800, 'CLP', '2025-11-30', NULL),
(61, 1, 28000, 'CLP', '2025-12-25', NULL),

-- Aislación (62-69)
(62, 1, 12500, 'CLP', '2025-12-01', NULL),
(63, 1, 18500, 'CLP', '2025-12-01', NULL),
(64, 1, 4200, 'CLP', '2025-12-10', NULL),
(65, 1, 9800, 'CLP', '2025-12-15', NULL),
(66, 1, 32000, 'CLP', '2025-11-28', NULL),
(67, 1, 8500, 'CLP', '2026-01-05', NULL),
(68, 1, 15000, 'CLP', '2025-12-20', NULL),
(69, 1, 6800, 'CLP', '2025-12-18', NULL),

-- Eléctricos (70-84)
(70, 1, 850, 'CLP', '2025-12-01', NULL),
(71, 1, 1200, 'CLP', '2025-12-01', NULL),
(72, 1, 1800, 'CLP', '2025-12-05', NULL),
(73, 1, 980, 'CLP', '2025-12-10', NULL),
(74, 1, 3200, 'CLP', '2025-11-25', NULL),
(75, 1, 4100, 'CLP', '2025-12-15', NULL),
(76, 1, 450, 'CLP', '2026-01-05', NULL),
(77, 1, 580, 'CLP', '2025-12-20', NULL),
(78, 1, 1850, 'CLP', '2025-11-30', NULL),
(79, 1, 2200, 'CLP', '2025-12-25', NULL),
(80, 1, 1650, 'CLP', '2026-01-08', NULL),
(81, 1, 2800, 'CLP', '2025-12-18', NULL),
(82, 1, 28000, 'CLP', '2025-12-10', NULL),
(83, 1, 8500, 'CLP', '2025-12-05', NULL),
(84, 1, 1200, 'CLP', '2026-01-10', NULL),

-- Sanitarios (85-96)
(85, 1, 9800, 'CLP', '2025-12-01', NULL),
(86, 1, 7200, 'CLP', '2025-12-01', NULL),
(87, 1, 5800, 'CLP', '2025-12-05', NULL),
(88, 1, 4500, 'CLP', '2025-12-10', NULL),
(89, 1, 3800, 'CLP', '2025-12-15', NULL),
(90, 1, 850, 'CLP', '2025-11-28', NULL),
(91, 1, 1200, 'CLP', '2026-01-05', NULL),
(92, 1, 4500, 'CLP', '2025-12-20', NULL),
(93, 1, 1800, 'CLP', '2025-11-30', NULL),
(94, 1, 950, 'CLP', '2025-12-25', NULL),
(95, 1, 28000, 'CLP', '2026-01-08', NULL),
(96, 1, 35000, 'CLP', '2025-12-18', NULL),

-- Gasfitería (97-102)
(97, 1, 12500, 'CLP', '2025-12-01', NULL),
(98, 1, 18000, 'CLP', '2025-12-01', NULL),
(99, 1, 8500, 'CLP', '2025-12-10', NULL),
(100, 1, 6200, 'CLP', '2025-12-15', NULL),
(101, 1, 1200, 'CLP', '2026-01-05', NULL),
(102, 1, 15500, 'CLP', '2025-12-20', NULL),

-- Climatización (103-106)
(103, 1, 18500, 'CLP', '2025-12-01', NULL),
(104, 1, 3200, 'CLP', '2025-12-05', NULL),
(105, 1, 28000, 'CLP', '2025-12-10', NULL),
(106, 1, 4500, 'CLP', '2026-01-05', NULL),

-- Cerámicas (107-116)
(107, 1, 12500, 'CLP', '2025-12-01', NULL),
(108, 1, 22000, 'CLP', '2025-12-01', NULL),
(109, 1, 9800, 'CLP', '2025-12-05', NULL),
(110, 1, 15500, 'CLP', '2025-12-10', NULL),
(111, 1, 3200, 'CLP', '2025-12-15', NULL),
(112, 1, 8500, 'CLP', '2026-01-05', NULL),
(113, 1, 2500, 'CLP', '2025-12-20', NULL),
(114, 1, 14500, 'CLP', '2025-11-30', NULL),
(115, 1, 18000, 'CLP', '2025-12-25', NULL),
(116, 1, 4800, 'CLP', '2026-01-08', NULL),

-- Pinturas (117-128)
(117, 1, 18500, 'CLP', '2025-12-01', NULL),
(118, 1, 22000, 'CLP', '2025-12-01', NULL),
(119, 1, 25000, 'CLP', '2025-12-05', NULL),
(120, 1, 21000, 'CLP', '2025-12-10', NULL),
(121, 1, 15500, 'CLP', '2025-12-15', NULL),
(122, 1, 16800, 'CLP', '2026-01-05', NULL),
(123, 1, 28000, 'CLP', '2025-12-20', NULL),
(124, 1, 32000, 'CLP', '2025-11-30', NULL),
(125, 1, 12500, 'CLP', '2025-12-25', NULL),
(126, 1, 5800, 'CLP', '2026-01-08', NULL),
(127, 1, 2200, 'CLP', '2025-12-18', NULL),
(128, 1, 3500, 'CLP', '2025-12-22', NULL);

-- Total: 128 registros de precios

# 📋 4. PLANTILLAS_COMPRA_OBRA (15 plantillas especializadas)
INSERT INTO plantillas_compra_obra (empresa_id, nombre, descripcion, tipo_destino, es_activa) VALUES
(2, 'Cimentación Zapatas Aisladas', 'Materiales para fundaciones superficiales con zapatas', 'obra', TRUE),
(2, 'Losa Radier 100m²', 'Compra estándar hormigón armado piso', 'obra', TRUE),
(2, 'Estructura Hormigón Armado 1 Piso', 'Pilares, vigas y losa entrepiso', 'obra', TRUE),
(2, 'Albañilería Tabiques 50m²', 'Bloques, mortero y mano de obra', 'obra', TRUE),
(2, 'Instalación Eléctrica Casa 80m²', 'Cables, ductos, enchufes y tablero', 'obra', TRUE),
(2, 'Instalación Sanitaria Básica', 'PVC desagüe, presión y grifería', 'obra', TRUE),
(2, 'Revestimiento Baño Completo', 'Cerámicas, adhesivo y fragüe', 'obra', TRUE),
(2, 'Pintura Interior 100m² Muro', 'Látex, imprimante y herramientas', 'obra', TRUE),
(2, 'Cielo Falso Volcanita 60m²', 'Placas yeso, perfiles y tornillos', 'obra', TRUE),
(2, 'Piso Cerámico 80m²', 'Porcelanato, pasta y crucetas', 'obra', TRUE),
(2, 'Techumbre Zinc 60m²', 'Planchas, pernos y estructura', 'obra', TRUE),
(2, 'Ampliación Dormitorio 15m²', 'Kit completo estructura y terminaciones', 'obra', TRUE),
(2, 'Reparación Filtraciones Baño', 'Materiales impermeabilización urgente', 'servicio', TRUE),
(2, 'Mantenimiento Pintura Fachada', 'Látex exterior y herramientas', 'servicio', TRUE),
(2, 'Remodelación Cocina Básica', 'Cerámicas, muebles y gasfitería', 'servicio', TRUE);