-- ============================================
-- INSERTAR 20 CLIENTES DE PRUEBA
-- Empresa ID: 2
-- Tipo Documento ID: 1 (Cédula de Identidad)
-- ============================================

INSERT INTO clientes (
    empresa_id,
    tipo_documento_id,
    numero_documento,
    nombre,
    apellidos,
    telefono,
    email,
    direccion,
    sector,
    municipio,
    provincia,
    fecha_nacimiento,
    genero,
    total_compras,
    puntos_fidelidad,
    activo,
    estado
) VALUES
-- Cliente 1
(2, 1, '001-1234567-8', 'María', 'González Pérez', '809-555-0101', 'maria.gonzalez@email.com', 'Calle Principal #123', 'Villa Mella', 'Santo Domingo Norte', 'Santo Domingo', '1985-03-15', 'femenino', 0.00, 0, 1, 'activo'),

-- Cliente 2
(2, 1, '001-2345678-9', 'Carlos', 'Rodríguez Martínez', '809-555-0102', 'carlos.rodriguez@email.com', 'Av. Independencia #456', 'Los Alcarrizos', 'Santo Domingo Oeste', 'Santo Domingo', '1990-07-22', 'masculino', 0.00, 0, 1, 'activo'),

-- Cliente 3
(2, 1, '001-3456789-0', 'Ana', 'López Sánchez', '809-555-0103', 'ana.lopez@email.com', 'Calle Duarte #789', 'Centro', 'Santo Domingo', 'Distrito Nacional', '1988-11-30', 'femenino', 0.00, 0, 1, 'activo'),

-- Cliente 4
(2, 1, '001-4567890-1', 'José', 'Hernández Díaz', '829-555-0104', 'jose.hernandez@email.com', 'Av. Winston Churchill #234', 'Piantini', 'Santo Domingo', 'Distrito Nacional', '1992-05-18', 'masculino', 0.00, 0, 1, 'activo'),

-- Cliente 5
(2, 1, '001-5678901-2', 'Laura', 'Martínez Torres', '849-555-0105', 'laura.martinez@email.com', 'Calle Las Mercedes #567', 'Naco', 'Santo Domingo', 'Distrito Nacional', '1987-09-12', 'femenino', 0.00, 0, 1, 'activo'),

-- Cliente 6
(2, 1, '001-6789012-3', 'Roberto', 'García Fernández', '809-555-0106', 'roberto.garcia@email.com', 'Av. Abraham Lincoln #890', 'El Millón', 'Santo Domingo', 'Distrito Nacional', '1991-02-25', 'masculino', 0.00, 0, 1, 'activo'),

-- Cliente 7
(2, 1, '001-7890123-4', 'Carmen', 'Jiménez Ruiz', '829-555-0107', 'carmen.jimenez@email.com', 'Calle 30 de Marzo #123', 'Villa Consuelo', 'Santo Domingo', 'Distrito Nacional', '1989-08-07', 'femenino', 0.00, 0, 1, 'activo'),

-- Cliente 8
(2, 1, '001-8901234-5', 'Miguel', 'Morales Castro', '849-555-0108', 'miguel.morales@email.com', 'Av. Máximo Gómez #456', 'Zona Colonial', 'Santo Domingo', 'Distrito Nacional', '1993-12-14', 'masculino', 0.00, 0, 1, 'activo'),

-- Cliente 9
(2, 1, '001-9012345-6', 'Patricia', 'Ramos Vásquez', '809-555-0109', 'patricia.ramos@email.com', 'Calle El Conde #789', 'Zona Colonial', 'Santo Domingo', 'Distrito Nacional', '1986-04-20', 'femenino', 0.00, 0, 1, 'activo'),

-- Cliente 10
(2, 1, '001-0123456-7', 'Fernando', 'Ortiz Mendoza', '829-555-0110', 'fernando.ortiz@email.com', 'Av. 27 de Febrero #234', 'Ensanche La Fe', 'Santo Domingo', 'Distrito Nacional', '1990-10-03', 'masculino', 0.00, 0, 1, 'activo'),

-- Cliente 11
(2, 1, '001-1234568-9', 'Sofía', 'Vargas Herrera', '849-555-0111', 'sofia.vargas@email.com', 'Calle José Contreras #567', 'Villa Mella', 'Santo Domingo Norte', 'Santo Domingo', '1994-01-28', 'femenino', 0.00, 0, 1, 'activo'),

-- Cliente 12
(2, 1, '001-2345679-0', 'Luis', 'Cruz Méndez', '809-555-0112', 'luis.cruz@email.com', 'Av. John F. Kennedy #890', 'Los Prados', 'Santo Domingo', 'Distrito Nacional', '1988-06-15', 'masculino', 0.00, 0, 1, 'activo'),

-- Cliente 13
(2, 1, '001-3456780-1', 'Isabel', 'Peña Guzmán', '829-555-0113', 'isabel.pena@email.com', 'Calle Mella #123', 'Villa Consuelo', 'Santo Domingo', 'Distrito Nacional', '1992-03-09', 'femenino', 0.00, 0, 1, 'activo'),

-- Cliente 14
(2, 1, '001-4567891-2', 'Ricardo', 'Santos Pichardo', '849-555-0114', 'ricardo.santos@email.com', 'Av. Tiradentes #456', 'Villa Mella', 'Santo Domingo Norte', 'Santo Domingo', '1987-11-22', 'masculino', 0.00, 0, 1, 'activo'),

-- Cliente 15
(2, 1, '001-5678902-3', 'Gabriela', 'Núñez Valdez', '809-555-0115', 'gabriela.nunez@email.com', 'Calle Restauración #789', 'Centro', 'Santo Domingo', 'Distrito Nacional', '1991-07-05', 'femenino', 0.00, 0, 1, 'activo'),

-- Cliente 16
(2, 1, '001-6789013-4', 'Andrés', 'Báez Rosario', '829-555-0116', 'andres.baez@email.com', 'Av. Charles de Gaulle #234', 'Piantini', 'Santo Domingo', 'Distrito Nacional', '1989-09-18', 'masculino', 0.00, 0, 1, 'activo'),

-- Cliente 17
(2, 1, '001-7890124-5', 'Valentina', 'De León Espinal', '849-555-0117', 'valentina.deleon@email.com', 'Calle Las Mercedes #567', 'Naco', 'Santo Domingo', 'Distrito Nacional', '1993-04-11', 'femenino', 0.00, 0, 1, 'activo'),

-- Cliente 18
(2, 1, '001-8901235-6', 'Diego', 'Mejía Acosta', '809-555-0118', 'diego.mejia@email.com', 'Av. Lope de Vega #890', 'Los Cacicazgos', 'Santo Domingo', 'Distrito Nacional', '1990-12-26', 'masculino', 0.00, 0, 1, 'activo'),

-- Cliente 19
(2, 1, '001-9012346-7', 'Natalia', 'Reyes Polanco', '829-555-0119', 'natalia.reyes@email.com', 'Calle Modesto Díaz #123', 'Villa Mella', 'Santo Domingo Norte', 'Santo Domingo', '1986-08-14', 'femenino', 0.00, 0, 1, 'activo'),

-- Cliente 20
(2, 1, '001-0123457-8', 'Alejandro', 'Torres Suárez', '849-555-0120', 'alejandro.torres@email.com', 'Av. Sarasota #456', 'Bella Vista', 'Santo Domingo', 'Distrito Nacional', '1992-02-19', 'masculino', 0.00, 0, 1, 'activo');

-- ============================================
-- VERIFICAR INSERCIÓN
-- ============================================
-- SELECT COUNT(*) as total_clientes FROM clientes WHERE empresa_id = 2;
-- SELECT * FROM clientes WHERE empresa_id = 2 ORDER BY id DESC LIMIT 20;

