-- =====================================================
-- PLANTILLAS PREDEFINIDAS DE PROYECTOS
-- =====================================================
-- Fecha: 2026-01-21
-- 
-- Este script inserta plantillas predefinidas para proyectos.
-- IMPORTANTE: Ajusta los valores de empresa_id y creado_por según tu base de datos
-- =====================================================

-- NOTA: Antes de ejecutar este script, debes:
-- 1. Ejecutar migracion_plantillas_proyectos.sql
-- 2. Obtener un empresa_id válido (puede ser cualquier empresa existente)
-- 3. Obtener un usuario_id válido (puede ser cualquier usuario existente)
-- 4. Reemplazar @EMPRESA_ID y @USUARIO_ID con los valores reales

-- =====================================================
-- PLANTILLA 1: VIVIENDA UNIFAMILIAR
-- =====================================================

INSERT INTO plantillas_proyecto (
    empresa_id,
    nombre,
    descripcion,
    tipo_plantilla,
    estructura_json,
    activa,
    creado_por
) VALUES (
    @EMPRESA_ID,

    'Vivienda Unifamiliar',
    'Plantilla para proyectos de construcción de viviendas unifamiliares. Incluye estructura base con capítulos comunes de construcción.',

    'vivienda',
    JSON_OBJECT(
        'obras', JSON_ARRAY(
            JSON_OBJECT(
                'nombre', 'Obra Principal',
                'tipo_obra', 'construccion',
                'descripcion', 'Obra principal de construcción de vivienda',
                'presupuestos', JSON_ARRAY(
                    JSON_OBJECT(
                        'nombre', 'Presupuesto General',
                        'descripcion', 'Presupuesto inicial de construcción',
                        'capitulos', JSON_ARRAY(
                            JSON_OBJECT(
                                'codigo', '01',
                                'nombre', 'Movimiento de Tierra',
                                'descripcion', 'Trabajos de excavación y movimiento de tierra',
                                'orden', 1,
                                'tareas', JSON_ARRAY(
                                    JSON_OBJECT(
                                        'codigo', '01.01',
                                        'nombre', 'Excavación de cimientos',
                                        'descripcion', 'Excavación manual y mecánica para cimientos',
                                        'unidad_medida', 'm³',
                                        'cantidad', 50.000,
                                        'precio_unitario_venta', 500.00,
                                        'orden', 1
                                    ),
                                    JSON_OBJECT(
                                        'codigo', '01.02',
                                        'nombre', 'Nivelación de terreno',
                                        'descripcion', 'Nivelación y compactación del terreno',
                                        'unidad_medida', 'm²',
                                        'cantidad', 200.000,
                                        'precio_unitario_venta', 150.00,
                                        'orden', 2
                                    )
                                )
                            ),
                            JSON_OBJECT(
                                'codigo', '02',
                                'nombre', 'Estructura',
                                'descripcion', 'Estructura de concreto y acero',
                                'orden', 2,
                                'tareas', JSON_ARRAY(
                                    JSON_OBJECT(
                                        'codigo', '02.01',
                                        'nombre', 'Cimientos de concreto',
                                        'descripcion', 'Vaciado de cimientos',
                                        'unidad_medida', 'm³',
                                        'cantidad', 25.000,
                                        'precio_unitario_venta', 800.00,
                                        'orden', 1
                                    ),
                                    JSON_OBJECT(
                                        'codigo', '02.02',
                                        'nombre', 'Columnas y vigas',
                                        'descripcion', 'Estructura de columnas y vigas',
                                        'unidad_medida', 'm³',
                                        'cantidad', 30.000,
                                        'precio_unitario_venta', 900.00,
                                        'orden', 2
                                    )
                                )
                            ),
                            JSON_OBJECT(
                                'codigo', '03',
                                'nombre', 'Albañilería',
                                'descripcion', 'Trabajos de albañilería y mampostería',
                                'orden', 3,
                                'tareas', JSON_ARRAY(
                                    JSON_OBJECT(
                                        'codigo', '03.01',
                                        'nombre', 'Muros de bloque',
                                        'descripcion', 'Construcción de muros con bloques',
                                        'unidad_medida', 'm²',
                                        'cantidad', 300.000,
                                        'precio_unitario_venta', 400.00,
                                        'orden', 1
                                    )
                                )
                            ),
                            JSON_OBJECT(
                                'codigo', '04',
                                'nombre', 'Instalaciones',
                                'descripcion', 'Instalaciones eléctricas, plomería y sanitarias',
                                'orden', 4,
                                'tareas', JSON_ARRAY(
                                    JSON_OBJECT(
                                        'codigo', '04.01',
                                        'nombre', 'Instalación eléctrica',
                                        'descripcion', 'Cableado e instalación eléctrica completa',
                                        'unidad_medida', 'unidad',
                                        'cantidad', 1.000,
                                        'precio_unitario_venta', 50000.00,
                                        'orden', 1
                                    ),
                                    JSON_OBJECT(
                                        'codigo', '04.02',
                                        'nombre', 'Instalación de plomería',
                                        'descripcion', 'Instalación de tuberías y sanitarios',
                                        'unidad_medida', 'unidad',
                                        'cantidad', 1.000,
                                        'precio_unitario_venta', 35000.00,
                                        'orden', 2
                                    )
                                )
                            ),
                            JSON_OBJECT(
                                'codigo', '05',
                                'nombre', 'Acabados',
                                'descripcion', 'Trabajos de acabados finales',
                                'orden', 5,
                                'tareas', JSON_ARRAY(
                                    JSON_OBJECT(
                                        'codigo', '05.01',
                                        'nombre', 'Pintura interior y exterior',
                                        'descripcion', 'Pintura completa de la vivienda',
                                        'unidad_medida', 'm²',
                                        'cantidad', 500.000,
                                        'precio_unitario_venta', 200.00,
                                        'orden', 1
                                    ),
                                    JSON_OBJECT(
                                        'codigo', '05.02',
                                        'nombre', 'Pisos y azulejos',
                                        'descripcion', 'Instalación de pisos y azulejos',
                                        'unidad_medida', 'm²',
                                        'cantidad', 200.000,
                                        'precio_unitario_venta', 600.00,
                                        'orden', 2
                                    )
                                )
                            )
                        )
                    )
                )
            )
        )
    ),
    1,
    @USUARIO_ID
);

-- =====================================================
-- PLANTILLA 2: PROYECTO COMERCIAL
-- =====================================================

INSERT INTO plantillas_proyecto (
    empresa_id,
    nombre,
    descripcion,
    tipo_plantilla,
    estructura_json,
    activa,
    creado_por
) VALUES (
    @EMPRESA_ID,
    'Proyecto Comercial',
    'Plantilla para proyectos comerciales con múltiples obras. Ideal para locales, oficinas y espacios comerciales.',
    'comercial',
    JSON_OBJECT(
        'obras', JSON_ARRAY(
            JSON_OBJECT(
                'nombre', 'Obra Adecuación',
                'tipo_obra', 'remodelacion',
                'descripcion', 'Adecuación del espacio comercial',
                'presupuestos', JSON_ARRAY(
                    JSON_OBJECT(
                        'nombre', 'Presupuesto Adecuación',
                        'descripcion', 'Presupuesto para adecuación del local',
                        'capitulos', JSON_ARRAY(
                            JSON_OBJECT(
                                'codigo', '01',
                                'nombre', 'Demoliciones',
                                'descripcion', 'Demolición de estructuras existentes',
                                'orden', 1,
                                'tareas', JSON_ARRAY(
                                    JSON_OBJECT(
                                        'codigo', '01.01',
                                        'nombre', 'Demolición de muros',
                                        'descripcion', 'Demolición de muros no estructurales',
                                        'unidad_medida', 'm²',
                                        'cantidad', 100.000,
                                        'precio_unitario_venta', 300.00,
                                        'orden', 1
                                    )
                                )
                            ),
                            JSON_OBJECT(
                                'codigo', '02',
                                'nombre', 'Adecuación de espacios',
                                'descripcion', 'Construcción y adecuación de espacios',
                                'orden', 2,
                                'tareas', JSON_ARRAY(
                                    JSON_OBJECT(
                                        'codigo', '02.01',
                                        'nombre', 'Construcción de muros divisorios',
                                        'descripcion', 'Muros para división de espacios',
                                        'unidad_medida', 'm²',
                                        'cantidad', 150.000,
                                        'precio_unitario_venta', 450.00,
                                        'orden', 1
                                    )
                                )
                            )
                        )
                    )
                )
            ),
            JSON_OBJECT(
                'nombre', 'Obra Instalaciones',
                'tipo_obra', 'construccion',
                'descripcion', 'Instalaciones técnicas del local',
                'presupuestos', JSON_ARRAY(
                    JSON_OBJECT(
                        'nombre', 'Presupuesto Instalaciones',
                        'descripcion', 'Instalaciones eléctricas, aires acondicionados, etc.',
                        'capitulos', JSON_ARRAY(
                            JSON_OBJECT(
                                'codigo', '01',
                                'nombre', 'Instalación Eléctrica',
                                'descripcion', 'Sistema eléctrico completo',
                                'orden', 1,
                                'tareas', JSON_ARRAY(
                                    JSON_OBJECT(
                                        'codigo', '01.01',
                                        'nombre', 'Instalación eléctrica comercial',
                                        'descripcion', 'Cableado y tableros eléctricos',
                                        'unidad_medida', 'unidad',
                                        'cantidad', 1.000,
                                        'precio_unitario_venta', 80000.00,
                                        'orden', 1
                                    )
                                )
                            ),
                            JSON_OBJECT(
                                'codigo', '02',
                                'nombre', 'Aires Acondicionados',
                                'descripcion', 'Instalación de sistema de climatización',
                                'orden', 2,
                                'tareas', JSON_ARRAY(
                                    JSON_OBJECT(
                                        'codigo', '02.01',
                                        'nombre', 'Instalación de aires acondicionados',
                                        'descripcion', 'Instalación y conexión de unidades',
                                        'unidad_medida', 'unidad',
                                        'cantidad', 5.000,
                                        'precio_unitario_venta', 15000.00,
                                        'orden', 1
                                    )

                                )
                            )
                        )
                    )
                )
            )
        )
    ),
    1,
    @USUARIO_ID
);

-- =====================================================
-- PLANTILLA 3: SERVICIOS TÉCNICOS
-- =====================================================

INSERT INTO plantillas_proyecto (
    empresa_id,
    nombre,
    descripcion,
    tipo_plantilla,
    estructura_json,
    activa,
    creado_por
) VALUES (
    @EMPRESA_ID,
    'Servicios Técnicos',
    'Plantilla para servicios técnicos rápidos. Ideal para trabajos de electricidad, plomería, pintura y reparaciones.',
    'servicios',
    JSON_OBJECT(
        'obras', JSON_ARRAY(
            JSON_OBJECT(
                'nombre', 'Obra Servicios',
                'tipo_obra', 'servicio',
                'descripcion', 'Obra contenedora para servicios técnicos',
                'presupuestos', JSON_ARRAY(
                    JSON_OBJECT(
                        'nombre', 'Presupuesto Referencial',
                        'descripcion', 'Presupuesto base para servicios técnicos',
                        'capitulos', JSON_ARRAY(
                            JSON_OBJECT(
                                'codigo', '01',
                                'nombre', 'Mano de Obra',
                                'descripcion', 'Costos de mano de obra especializada',
                                'orden', 1,
                                'tareas', JSON_ARRAY(
                                    JSON_OBJECT(
                                        'codigo', '01.01',
                                        'nombre', 'Técnico especializado',
                                        'descripcion', 'Servicio de técnico por horas',
                                        'unidad_medida', 'hora',
                                        'cantidad', 8.000,
                                        'precio_unitario_venta', 800.00,
                                        'orden', 1
                                    )
                                )
                            ),
                            JSON_OBJECT(
                                'codigo', '02',
                                'nombre', 'Materiales',
                                'descripcion', 'Materiales y repuestos necesarios',
                                'orden', 2,
                                'tareas', JSON_ARRAY(
                                    JSON_OBJECT(
                                        'codigo', '02.01',
                                        'nombre', 'Materiales varios',
                                        'descripcion', 'Materiales y repuestos según necesidad',
                                        'unidad_medida', 'unidad',
                                        'cantidad', 1.000,
                                        'precio_unitario_venta', 5000.00,
                                        'orden', 1
                                    )
                                )
                            )
                        )
                    )
                )
            )
        )
    ),
    1,
    @USUARIO_ID
);

-- =====================================================
-- NOTAS FINALES
-- =====================================================
-- 
-- Para usar estas plantillas:
-- 1. Reemplaza @EMPRESA_ID con un ID de empresa válido
-- 2. Reemplaza @USUARIO_ID con un ID de usuario válido
-- 
-- Ejemplo:
-- SET @EMPRESA_ID = 1;
-- SET @USUARIO_ID = 1;
-- 
-- Luego ejecuta este script completo.

