-- ============================================
-- MÓDULO: MANEJO SIMPLE
-- TABLAS EXCLUSIVAS PARA GESTIÓN SIMPLIFICADA
-- ============================================

-- TABLA: obras_simples
-- Registro simplificado de obras/proyectos
CREATE TABLE obras_simples (
    id INT AUTO_INCREMENT PRIMARY KEY,
    empresa_id INT NOT NULL,
    codigo_obra VARCHAR(50) NOT NULL,
    nombre VARCHAR(200) NOT NULL,
    descripcion TEXT,
    direccion VARCHAR(300),
    cliente_nombre VARCHAR(200),
    cliente_telefono VARCHAR(20),
    cliente_email VARCHAR(100),
    presupuesto_total DECIMAL(12,2) DEFAULT 0.00,
    fecha_inicio DATE,
    fecha_fin_estimada DATE,
    estado ENUM('activa', 'pausada', 'finalizada', 'cancelada') DEFAULT 'activa',
    color_identificacion VARCHAR(7) DEFAULT '#3b82f6',
    notas TEXT,
    usuario_creador INT NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_obra_empresa (empresa_id, codigo_obra),
    INDEX idx_empresa (empresa_id),
    INDEX idx_estado (estado),
    INDEX idx_fechas (fecha_inicio, fecha_fin_estimada),
    FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_creador) REFERENCES usuarios(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- TABLA: trabajadores_simples
-- Trabajadores para manejo simple
CREATE TABLE trabajadores_simples (
    id INT AUTO_INCREMENT PRIMARY KEY,
    empresa_id INT NOT NULL,
    codigo_trabajador VARCHAR(50),
    nombre VARCHAR(150) NOT NULL,
    apellido VARCHAR(150),
    cedula VARCHAR(20),
    telefono VARCHAR(20),
    especialidad VARCHAR(100),
    salario_diario DECIMAL(10,2) DEFAULT 0.00,
    tipo_pago ENUM('diario', 'semanal', 'quincenal', 'mensual') DEFAULT 'diario',
    activo BOOLEAN DEFAULT TRUE,
    foto_url VARCHAR(500),
    direccion VARCHAR(300),
    contacto_emergencia VARCHAR(200),
    telefono_emergencia VARCHAR(20),
    fecha_ingreso DATE,
    notas TEXT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_cedula_empresa (empresa_id, cedula),
    INDEX idx_empresa (empresa_id),
    INDEX idx_activo (activo),
    INDEX idx_especialidad (especialidad),
    FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- TABLA: asignaciones_obra_simple
-- Asignación de trabajadores a obras
CREATE TABLE asignaciones_obra_simple (
    id INT AUTO_INCREMENT PRIMARY KEY,
    obra_id INT NOT NULL,
    trabajador_id INT NOT NULL,
    fecha_asignacion DATE NOT NULL,
    fecha_retiro DATE,
    activo BOOLEAN DEFAULT TRUE,
    rol_en_obra VARCHAR(100),
    salario_acordado DECIMAL(10,2),
    notas TEXT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_obra (obra_id),
    INDEX idx_trabajador (trabajador_id),
    INDEX idx_activo (activo),
    UNIQUE KEY uk_obra_trabajador_activo (obra_id, trabajador_id, activo),
    FOREIGN KEY (obra_id) REFERENCES obras_simples(id) ON DELETE CASCADE,
    FOREIGN KEY (trabajador_id) REFERENCES trabajadores_simples(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- TABLA: asistencias_simple
-- Control de asistencia diaria
CREATE TABLE asistencias_simple (
    id INT AUTO_INCREMENT PRIMARY KEY,
    obra_id INT NOT NULL,
    trabajador_id INT NOT NULL,
    fecha DATE NOT NULL,
    presente BOOLEAN DEFAULT TRUE,
    horas_trabajadas DECIMAL(4,2) DEFAULT 8.00,
    hora_entrada TIME,
    hora_salida TIME,
    tipo_jornada ENUM('completa', 'media', 'horas_extra') DEFAULT 'completa',
    monto_pagar DECIMAL(10,2) DEFAULT 0.00,
    pagado BOOLEAN DEFAULT FALSE,
    observaciones TEXT,
    registrado_por INT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_asistencia (obra_id, trabajador_id, fecha),
    INDEX idx_obra_fecha (obra_id, fecha),
    INDEX idx_trabajador_fecha (trabajador_id, fecha),
    INDEX idx_pagado (pagado),
    INDEX idx_fecha (fecha),
    FOREIGN KEY (obra_id) REFERENCES obras_simples(id) ON DELETE CASCADE,
    FOREIGN KEY (trabajador_id) REFERENCES trabajadores_simples(id) ON DELETE CASCADE,
    FOREIGN KEY (registrado_por) REFERENCES usuarios(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- TABLA: gastos_obra_simple
-- Gastos y compras de la obra
CREATE TABLE gastos_obra_simple (
    id INT AUTO_INCREMENT PRIMARY KEY,
    obra_id INT NOT NULL,
    fecha DATE NOT NULL,
    tipo_gasto ENUM('materiales', 'herramientas', 'transporte', 'alimentacion', 'servicios', 'otros') NOT NULL,
    concepto VARCHAR(200) NOT NULL,
    descripcion TEXT,
    monto DECIMAL(12,2) NOT NULL,
    proveedor VARCHAR(200),
    numero_factura VARCHAR(50),
    metodo_pago ENUM('efectivo', 'transferencia', 'cheque', 'tarjeta') DEFAULT 'efectivo',
    comprobante_url VARCHAR(500),
    registrado_por INT NOT NULL,
    quien_compro_id INT NULL,
    aprobado BOOLEAN DEFAULT FALSE,
    aprobado_por INT,
    fecha_aprobacion TIMESTAMP NULL,
    notas TEXT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_obra_fecha (obra_id, fecha),
    INDEX idx_tipo_gasto (tipo_gasto),
    INDEX idx_aprobado (aprobado),
    INDEX idx_fecha (fecha),
    FOREIGN KEY (obra_id) REFERENCES obras_simples(id) ON DELETE CASCADE,
    FOREIGN KEY (registrado_por) REFERENCES usuarios(id),
    FOREIGN KEY (quien_compro_id) REFERENCES usuarios(id) ON DELETE SET NULL,
    FOREIGN KEY (aprobado_por) REFERENCES usuarios(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- TABLA: pagos_trabajadores_simple
-- Registro de pagos a trabajadores
CREATE TABLE pagos_trabajadores_simple (
    id INT AUTO_INCREMENT PRIMARY KEY,
    obra_id INT NOT NULL,
    trabajador_id INT NOT NULL,
    fecha_pago DATE NOT NULL,
    periodo_inicio DATE NOT NULL,
    periodo_fin DATE NOT NULL,
    dias_trabajados INT DEFAULT 0,
    horas_trabajadas DECIMAL(6,2) DEFAULT 0.00,
    monto_total DECIMAL(12,2) NOT NULL,
    descuentos DECIMAL(10,2) DEFAULT 0.00,
    bonificaciones DECIMAL(10,2) DEFAULT 0.00,
    monto_neto DECIMAL(12,2) NOT NULL,
    metodo_pago ENUM('efectivo', 'transferencia', 'cheque') DEFAULT 'efectivo',
    numero_referencia VARCHAR(50),
    notas TEXT,
    registrado_por INT NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_obra (obra_id),
    INDEX idx_trabajador (trabajador_id),
    INDEX idx_fecha_pago (fecha_pago),
    INDEX idx_periodo (periodo_inicio, periodo_fin),
    FOREIGN KEY (obra_id) REFERENCES obras_simples(id) ON DELETE CASCADE,
    FOREIGN KEY (trabajador_id) REFERENCES trabajadores_simples(id) ON DELETE CASCADE,
    FOREIGN KEY (registrado_por) REFERENCES usuarios(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- TABLA: fotos_obra_simple
-- Registro fotográfico de avances
CREATE TABLE fotos_obra_simple (
    id INT AUTO_INCREMENT PRIMARY KEY,
    obra_id INT NOT NULL,
    fecha_foto DATE NOT NULL,
    titulo VARCHAR(200),
    descripcion TEXT,
    url_foto VARCHAR(500) NOT NULL,
    url_thumbnail VARCHAR(500),
    categoria ENUM('inicio', 'progreso', 'materiales', 'personal', 'problema', 'finalizado') DEFAULT 'progreso',
    subido_por INT NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_obra_fecha (obra_id, fecha_foto),
    INDEX idx_categoria (categoria),
    FOREIGN KEY (obra_id) REFERENCES obras_simples(id) ON DELETE CASCADE,
    FOREIGN KEY (subido_por) REFERENCES usuarios(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- TABLA: notas_obra_simple
-- Notas y observaciones diarias
CREATE TABLE notas_obra_simple (
    id INT AUTO_INCREMENT PRIMARY KEY,
    obra_id INT NOT NULL,
    fecha DATE NOT NULL,
    tipo_nota ENUM('general', 'importante', 'problema', 'solucion', 'recordatorio') DEFAULT 'general',
    titulo VARCHAR(200),
    contenido TEXT NOT NULL,
    prioridad ENUM('baja', 'media', 'alta') DEFAULT 'media',
    resuelta BOOLEAN DEFAULT FALSE,
    fecha_resolucion DATE,
    creado_por INT NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_obra_fecha (obra_id, fecha),
    INDEX idx_tipo_prioridad (tipo_nota, prioridad),
    INDEX idx_resuelta (resuelta),
    FOREIGN KEY (obra_id) REFERENCES obras_simples(id) ON DELETE CASCADE,
    FOREIGN KEY (creado_por) REFERENCES usuarios(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- TABLA: resumen_diario_obra_simple
-- Resumen agregado por día
CREATE TABLE resumen_diario_obra_simple (
    id INT AUTO_INCREMENT PRIMARY KEY,
    obra_id INT NOT NULL,
    fecha DATE NOT NULL,
    trabajadores_presentes INT DEFAULT 0,
    total_horas DECIMAL(6,2) DEFAULT 0.00,
    gastos_materiales DECIMAL(12,2) DEFAULT 0.00,
    gastos_otros DECIMAL(12,2) DEFAULT 0.00,
    gastos_total DECIMAL(12,2) DEFAULT 0.00,
    pagos_realizados DECIMAL(12,2) DEFAULT 0.00,
    clima VARCHAR(50),
    avance_porcentaje DECIMAL(5,2) DEFAULT 0.00,
    observaciones TEXT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_obra_fecha (obra_id, fecha),
    INDEX idx_fecha (fecha),
    FOREIGN KEY (obra_id) REFERENCES obras_simples(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;