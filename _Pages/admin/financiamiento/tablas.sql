-- EMPRESAS (asumido existente)
-- CREATE TABLE empresas (id INT PRIMARY KEY, ...);

-- USUARIOS (asumido existente)
-- CREATE TABLE usuarios (id INT PRIMARY KEY, empresa_id INT, ...);

-- CLIENTES (asumido existente)
-- CREATE TABLE clientes (id INT PRIMARY KEY, empresa_id INT, ...);

-- MÉTODOS DE PAGO (opcional)
-- CREATE TABLE metodos_pago (id INT PRIMARY KEY, nombre VARCHAR(100));

-- PLANES DE FINANCIAMIENTO
CREATE TABLE fin_planes (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    empresa_id INT NOT NULL,
    nombre VARCHAR(150) NOT NULL,
    codigo VARCHAR(50) DEFAULT NULL,
    descripcion TEXT DEFAULT NULL,
    mora_pct DECIMAL(5,2) NOT NULL DEFAULT 5.00,
    dias_gracia INT NOT NULL DEFAULT 5,
    descuento_anticipado_pct DECIMAL(5,2) DEFAULT 0,
    cuotas_minimas_anticipadas INT DEFAULT 0,
    monto_minimo DECIMAL(15,2) DEFAULT 0,
    monto_maximo DECIMAL(15,2) DEFAULT NULL,
    requiere_fiador TINYINT(1) DEFAULT 0,
    permite_anticipado TINYINT(1) DEFAULT 1,
    activo TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
    INDEX idx_empresa_id (empresa_id)
);

-- OPCIONES DE PLAN
CREATE TABLE fin_plan_opciones (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    plan_id INT NOT NULL,
    meses INT NOT NULL,
    tasa_anual_pct DECIMAL(7,4) DEFAULT 0,
    inicial_pct DECIMAL(5,2) DEFAULT 0,
    tipo ENUM('cash','credito') DEFAULT 'credito',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (plan_id) REFERENCES fin_planes(id) ON DELETE CASCADE,
    INDEX idx_plan_id (plan_id)
);

-- CONTRATOS DE FINANCIAMIENTO
CREATE TABLE fin_contratos (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    empresa_id INT NOT NULL,
    usuario_id INT NOT NULL,
    cliente_id INT NOT NULL,
    plan_id INT NOT NULL,
    opcion_id INT NOT NULL,
    numero VARCHAR(30) NOT NULL UNIQUE,
    monto_total DECIMAL(15,2) NOT NULL,
    monto_inicial DECIMAL(15,2) NOT NULL DEFAULT 0,
    monto_financiado DECIMAL(15,2) NOT NULL,
    total_intereses DECIMAL(15,2) NOT NULL DEFAULT 0,
    total_pagar DECIMAL(15,2) NOT NULL,
    saldo_pendiente DECIMAL(15,2) NOT NULL,
    meses INT NOT NULL,
    tasa_anual_pct DECIMAL(7,4) DEFAULT 0,
    cuota_mensual DECIMAL(15,2) NOT NULL,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    notas TEXT DEFAULT NULL,
    estado ENUM('activo','pagado','incumplido','reestructurado','cancelado') DEFAULT 'activo',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
    FOREIGN KEY (cliente_id) REFERENCES clientes(id),
    FOREIGN KEY (plan_id) REFERENCES fin_planes(id),
    FOREIGN KEY (opcion_id) REFERENCES fin_plan_opciones(id),
    INDEX idx_empresa_id (empresa_id),
    INDEX idx_cliente_id (cliente_id)
);

-- ACTIVOS ASOCIADOS AL CONTRATO
CREATE TABLE fin_contrato_activos (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    contrato_id INT NOT NULL,
    empresa_id INT NOT NULL,
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT DEFAULT NULL,
    serial VARCHAR(100) DEFAULT NULL,
    valor DECIMAL(15,2) DEFAULT 0,
    imagen VARCHAR(255) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (contrato_id) REFERENCES fin_contratos(id) ON DELETE CASCADE,
    FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
    INDEX idx_contrato_id (contrato_id)
);

-- FIADORES
CREATE TABLE fin_fiadores (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    contrato_id INT NOT NULL,
    nombre VARCHAR(150) NOT NULL,
    cedula VARCHAR(30) DEFAULT NULL,
    telefono VARCHAR(20) DEFAULT NULL,
    email VARCHAR(150) DEFAULT NULL,
    direccion TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (contrato_id) REFERENCES fin_contratos(id) ON DELETE CASCADE,
    INDEX idx_contrato_id (contrato_id)
);

-- CUOTAS DEL CONTRATO
CREATE TABLE fin_cuotas (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    contrato_id INT NOT NULL,
    empresa_id INT NOT NULL,
    numero INT NOT NULL,
    monto DECIMAL(15,2) NOT NULL,
    capital DECIMAL(15,2) NOT NULL DEFAULT 0,
    interes DECIMAL(15,2) NOT NULL DEFAULT 0,
    mora DECIMAL(15,2) NOT NULL DEFAULT 0,
    fecha_vencimiento DATE NOT NULL,
    fecha_pago DATE DEFAULT NULL,
    estado ENUM('pendiente','pagada','vencida','parcial') DEFAULT 'pendiente',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (contrato_id) REFERENCES fin_contratos(id) ON DELETE CASCADE,
    FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
    INDEX idx_contrato_id (contrato_id)
);

-- PAGOS
CREATE TABLE fin_pagos (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    contrato_id INT NOT NULL,
    empresa_id INT NOT NULL,
    usuario_id INT NOT NULL,
    monto DECIMAL(15,2) NOT NULL,
    monto_capital DECIMAL(15,2) NOT NULL DEFAULT 0,
    monto_interes DECIMAL(15,2) NOT NULL DEFAULT 0,
    monto_mora DECIMAL(15,2) NOT NULL DEFAULT 0,
    metodo_pago_id INT DEFAULT NULL,
    referencia VARCHAR(100) DEFAULT NULL,
    notas TEXT DEFAULT NULL,
    fecha DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (contrato_id) REFERENCES fin_contratos(id) ON DELETE CASCADE,
    FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
    FOREIGN KEY (metodo_pago_id) REFERENCES metodos_pago(id) ON DELETE SET NULL,
    INDEX idx_contrato_id (contrato_id)
);

-- RELACIÓN ENTRE PAGOS Y CUOTAS (para pagos parciales o múltiples cuotas)
CREATE TABLE fin_pago_cuotas (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    pago_id INT NOT NULL,
    cuota_id INT NOT NULL,
    monto DECIMAL(15,2) NOT NULL,
    FOREIGN KEY (pago_id) REFERENCES fin_pagos(id) ON DELETE CASCADE,
    FOREIGN KEY (cuota_id) REFERENCES fin_cuotas(id) ON DELETE CASCADE,
    INDEX idx_pago_id (pago_id),
    INDEX idx_cuota_id (cuota_id)
);

-- ALERTAS DE FINANCIAMIENTO (opcional, para dashboard y seguimiento)
CREATE TABLE fin_alertas (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    empresa_id INT NOT NULL,
    contrato_id INT DEFAULT NULL,
    cuota_id INT DEFAULT NULL,
    tipo ENUM('vencimiento','mora','incumplimiento','otro') NOT NULL,
    mensaje TEXT NOT NULL,
    estado ENUM('activa','resuelta','descartada') DEFAULT 'activa',
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
    FOREIGN KEY (contrato_id) REFERENCES fin_contratos(id) ON DELETE CASCADE,
    FOREIGN KEY (cuota_id) REFERENCES fin_cuotas(id) ON DELETE CASCADE,
    INDEX idx_empresa_id (empresa_id)
);
CREATE TABLE metodos_pago (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL
);


-- Agregar frecuencia y tasa_interes a fin_planes
ALTER TABLE fin_planes 
ADD COLUMN frecuencia ENUM('semanal', 'quincenal', 'mensual') NOT NULL DEFAULT 'mensual' AFTER nombre,
ADD COLUMN tasa_interes DECIMAL(5,2) DEFAULT 0.00 AFTER mora_pct;

-- Agregar frecuencia a fin_contratos
ALTER TABLE fin_contratos 
ADD COLUMN frecuencia ENUM('semanal', 'quincenal', 'mensual') NOT NULL DEFAULT 'mensual' AFTER meses;

-- Cambiar tasa_anual_pct a tasa_interes en fin_contratos
ALTER TABLE fin_contratos 
CHANGE COLUMN tasa_anual_pct tasa_interes DECIMAL(7,4) DEFAULT 0;


CREATE TABLE fin_categorias (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    empresa_id INT NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    color VARCHAR(7) NOT NULL DEFAULT '#6b7280',
    descripcion VARCHAR(255) DEFAULT NULL,
    orden INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
    INDEX idx_empresa_id (empresa_id)
);

CREATE TABLE fin_contrato_categorias (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    contrato_id INT NOT NULL,
    categoria_id INT NOT NULL,
    empresa_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_contrato (contrato_id),
    FOREIGN KEY (contrato_id) REFERENCES fin_contratos(id) ON DELETE CASCADE,
    FOREIGN KEY (categoria_id) REFERENCES fin_categorias(id) ON DELETE CASCADE,
    FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
    INDEX idx_categoria_id (categoria_id),
    INDEX idx_empresa_id (empresa_id)
);