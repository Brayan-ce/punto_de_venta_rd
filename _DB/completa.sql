punto_venta_rd: schema
    + tables
        abonos_credito: table collate utf8mb4_0900_ai_ci
            --  Registro de pagos/abonos a cuentas por cobrar
            + columns
                id: bigint(20) NN auto_increment = 1
                cxc_id: bigint(20) NN
                empresa_id: int(11) NN
                cliente_id: int(11) NN
                monto_abonado: decimal(12,2) NN
                metodo_pago: enum('efectivo', 'tarjeta_debito', 'tarjeta_credito', 'transferencia', 'cheque', 'mixto') NN
                referencia_pago: varchar(100)
                    --  Número de cheque, referencia de transferencia, etc.
                es_pago_tardio: tinyint(1) NN default 0
                    --  1 = pago realizado con atraso
                dias_atraso_al_pagar: int(11) NN default 0
                    --  Días de atraso exactos al momento del pago
                notas: text
                registrado_por: int(11) NN
                fecha_abono: timestamp default CURRENT_TIMESTAMP
            + indices
                idx_cxc: index (cxc_id) type btree
                idx_empresa: index (empresa_id) type btree
                idx_cliente: index (cliente_id) type btree
                idx_metodo: index (metodo_pago) type btree
                idx_fecha: index (fecha_abono) type btree
            + keys
                #1: PK (id) (underlying index PRIMARY)
            + foreign-keys
                fk_abono_cxc: foreign key (cxc_id) -> cuentas_por_cobrar (id) d:cascade
                fk_abono_empresa: foreign key (empresa_id) -> empresas (id) d:cascade
                fk_abono_cliente: foreign key (cliente_id) -> clientes (id) d:cascade
                fk_abono_usuario: foreign key (registrado_por) -> usuarios (id)
            + checks
                chk_abono_positivo: check (`monto_abonado` > 0)
            + triggers
                trg_abono_credito_calculos: trigger before row insert definer root@localhost
                trg_actualizar_saldo_abono: trigger after row insert definer root@localhost
        alertas_credito: table collate utf8mb4_0900_ai_ci
            --  Alertas automáticas del sistema de crédito
            + columns
                id: bigint(20) NN auto_increment = 1
                empresa_id: int(11) NN
                cliente_id: int(11) NN
                credito_cliente_id: bigint(20)
                cxc_id: bigint(20)
                tipo_alerta: enum('credito_excedido', 'vencimiento_proximo', 'credito_vencido', 'atraso_grave', 'clasificacion_degradada', 'stock_bajo_cliente_moroso', 'otra') NN
                severidad: enum('baja', 'media', 'alta', 'critica') NN default 'media'
                titulo: varchar(255) NN
                mensaje: text NN
                datos_contexto: json
                    --  Datos adicionales de la alerta
                estado: enum('activa', 'vista', 'resuelta', 'descartada') NN default 'activa'
                asignada_a: int(11)
                    --  Usuario asignado para resolver
                resuelta_por: int(11)
                accion_tomada: text
                fecha_generacion: timestamp default CURRENT_TIMESTAMP
                fecha_vista: timestamp
                fecha_resolucion: timestamp
            + indices
                idx_empresa: index (empresa_id) type btree
                idx_cliente: index (cliente_id) type btree
                idx_tipo: index (tipo_alerta) type btree
                idx_severidad: index (severidad) type btree
                idx_estado: index (estado) type btree
                idx_asignada: index (asignada_a) type btree
                idx_fecha: index (fecha_generacion) type btree
            + keys
                #1: PK (id) (underlying index PRIMARY)
            + foreign-keys
                fk_alerta_empresa: foreign key (empresa_id) -> empresas (id) d:cascade
                fk_alerta_cliente: foreign key (cliente_id) -> clientes (id) d:cascade
                fk_alerta_credito: foreign key (credito_cliente_id) -> credito_clientes (id) d:set_null
                fk_alerta_cxc: foreign key (cxc_id) -> cuentas_por_cobrar (id) d:set_null
                fk_alerta_asignada: foreign key (asignada_a) -> usuarios (id) d:set_null
                fk_alerta_resuelta: foreign key (resuelta_por) -> usuarios (id) d:set_null
        alertas_sistema: table collate utf8mb4_0900_ai_ci
            + columns
                id: bigint(20) NN auto_increment = 1
                tipo_alerta: enum('cajas_abiertas_prolongadas', 'ventas_anomalas', 'clientes_duplicados', 'stock_inconsistente', 'suscripcion_vencida', 'uso_excesivo', 'intentos_fallidos', 'otra') NN
                severidad: enum('baja', 'media', 'alta', 'critica') default 'media'
                empresa_id: int(11)
                modulo: varchar(50) NN
                titulo: varchar(255) NN
                descripcion: text NN
                datos_contexto: json
                estado: enum('activa', 'revisada', 'resuelta', 'descartada') default 'activa'
                asignada_a: int(11)
                resuelta_por: int(11)
                fecha_generacion: timestamp default CURRENT_TIMESTAMP
                fecha_revision: timestamp
                fecha_resolucion: timestamp
                acciones_tomadas: text
            + indices
                empresa_id: index (empresa_id) type btree
                asignada_a: index (asignada_a) type btree
                resuelta_por: index (resuelta_por) type btree
            + keys
                #1: PK (id) (underlying index PRIMARY)
            + foreign-keys
                alertas_sistema_ibfk_1: foreign key (empresa_id) -> empresas (id) d:cascade
                alertas_sistema_ibfk_2: foreign key (asignada_a) -> usuarios (id) d:set_null
                alertas_sistema_ibfk_3: foreign key (resuelta_por) -> usuarios (id) d:set_null
        auditoria_sistema: table
            --  Registro completo de auditoría del sistema para trazabilidad
            + columns
                id: bigint(20) NN auto_increment = 1
                modulo: varchar(50) NN
                    --  Módulo afectado (clientes, ventas, cajas, etc.)
                accion: varchar(100) NN
                    --  Acción realizada (fusion, inactivacion, bloqueo, etc.)
                tipo_accion: enum('lectura', 'escritura', 'eliminacion', 'fusion', 'bloqueo', 'desbloqueo') NN
                empresa_id: int(11)
                    --  Empresa afectada (NULL si es acción global)
                entidad_tipo: varchar(50) NN
                    --  Tipo de entidad (cliente, venta, caja, usuario, etc.)
                entidad_id: int(11) NN
                    --  ID de la entidad afectada
                entidad_id_secundaria: int(11)
                    --  ID secundario (ej: en fusiones)
                usuario_id: int(11) NN
                    --  Usuario que realizó la acción
                tipo_usuario: enum('superadmin', 'admin', 'vendedor') NN
                descripcion: text
                    --  Descripción detallada de la acción
                datos_anteriores: json
                    --  Estado anterior de los datos
                datos_nuevos: json
                    --  Estado nuevo de los datos
                ip_address: varchar(45)
                    --  IP desde donde se realizó la acción
                user_agent: text
                    --  Navegador/cliente utilizado
                fecha_accion: timestamp default CURRENT_TIMESTAMP
                entidad: varchar(50)
            + indices
                idx_modulo: index (modulo) type btree
                idx_accion: index (accion) type btree
                idx_tipo_accion: index (tipo_accion) type btree
                idx_empresa: index (empresa_id) type btree
                idx_entidad: index (entidad_tipo, entidad_id) type btree
                idx_usuario: index (usuario_id) type btree
                idx_fecha: index (fecha_accion) type btree
            + keys
                #1: PK (id) (underlying index PRIMARY)
            + foreign-keys
                auditoria_sistema_ibfk_1: foreign key (empresa_id) -> empresas (id) d:set_null
                auditoria_sistema_ibfk_2: foreign key (usuario_id) -> usuarios (id) d:cascade
        cajas: table
            + columns
                id: int(11) NN auto_increment = 82
                empresa_id: int(11) NN
                usuario_id: int(11) NN
                numero_caja: int(11) NN
                fecha_caja: date NN
                monto_inicial: decimal(10,2) NN
                monto_final: decimal(10,2)
                total_ventas: decimal(10,2) default 0.00
                total_efectivo: decimal(10,2) default 0.00
                total_tarjeta_debito: decimal(10,2) default 0.00
                total_tarjeta_credito: decimal(10,2) default 0.00
                total_transferencia: decimal(10,2) default 0.00
                total_cheque: decimal(10,2) default 0.00
                total_gastos: decimal(10,2) default 0.00
                diferencia: decimal(10,2) default 0.00
                estado: enum('abierta', 'cerrada') default 'abierta'
                notas: text
                fecha_apertura: timestamp default CURRENT_TIMESTAMP
                fecha_cierre: timestamp
            + indices
                idx_empresa: index (empresa_id) type btree
                idx_usuario: index (usuario_id) type btree
                idx_fecha_caja: index (fecha_caja) type btree
                idx_estado: index (estado) type btree
                idx_fecha_apertura: index (fecha_apertura) type btree
            + keys
                #1: PK (id) (underlying index PRIMARY)
                unique_caja_dia: AK (empresa_id, fecha_caja, numero_caja)
            + foreign-keys
                cajas_ibfk_1: foreign key (empresa_id) -> empresas (id) d:cascade
                cajas_ibfk_2: foreign key (usuario_id) -> usuarios (id)
        catalogo_config: table
            + columns
                id: int(11) NN auto_increment = 2
                empresa_id: int(11) NN
                nombre_catalogo: varchar(255)
                descripcion: text
                logo_url: varchar(500)
                color_primario: varchar(50) default '#FF6B35'
                color_secundario: varchar(50) default '#004E89'
                activo: tinyint(1) default 1
                url_slug: varchar(255)
                whatsapp: varchar(50)
                direccion: text
                horario: varchar(255)
                fecha_creacion: datetime default CURRENT_TIMESTAMP
                fecha_actualizacion: datetime default CURRENT_TIMESTAMP on update CURRENT_TIMESTAMP
            + indices
                idx_empresa: index (empresa_id) type btree
                idx_activo: index (activo) type btree
                idx_slug: index (url_slug) type btree
            + keys
                #1: PK (id) (underlying index PRIMARY)
                url_slug: AK (url_slug)
            + foreign-keys
                catalogo_config_ibfk_1: foreign key (empresa_id) -> empresas (id) d:cascade
        catalogo_superadmin_config: table
            + columns
                id: int(11) NN auto_increment = 1
                nombre_catalogo: varchar(255) default 'Tienda Online'
                descripcion: text
                logo_url: varchar(500)
                color_primario: varchar(50) default '#FF6B35'
                color_secundario: varchar(50) default '#004E89'
                activo: tinyint(1) default 1
                url_slug: varchar(255) default 'tienda'
                whatsapp: varchar(50)
                direccion: text
                horario: varchar(255)
                fecha_creacion: datetime default CURRENT_TIMESTAMP
                fecha_actualizacion: datetime default CURRENT_TIMESTAMP on update CURRENT_TIMESTAMP
            + indices
                idx_activo: index (activo) type btree
                idx_slug: index (url_slug) type btree
            + keys
                #1: PK (id) (underlying index PRIMARY)
                url_slug: AK (url_slug)
        categorias: table
            + columns
                id: int(11) NN auto_increment = 20
                empresa_id: int(11) NN
                nombre: varchar(100) NN
                descripcion: text
                activo: tinyint(1) default 1
                fecha_creacion: timestamp default CURRENT_TIMESTAMP
            + indices
                idx_empresa: index (empresa_id) type btree
                idx_nombre: index (nombre) type btree
            + keys
                #1: PK (id) (underlying index PRIMARY)
            + foreign-keys
                categorias_ibfk_1: foreign key (empresa_id) -> empresas (id) d:cascade
        clientes: table
            + columns
                id: int(11) NN auto_increment = 25
                empresa_id: int(11) NN
                tipo_documento_id: int(11) NN
                numero_documento: varchar(20) NN
                nombre: varchar(150) NN
                apellidos: varchar(150)
                telefono: varchar(20)
                email: varchar(100)
                foto_url: varchar(1000)
                direccion: text
                sector: varchar(100)
                municipio: varchar(100)
                provincia: varchar(100)
                fecha_nacimiento: date
                genero: enum('masculino', 'femenino', 'otro', 'prefiero_no_decir')
                total_compras: decimal(12,2) default 0.00
                puntos_fidelidad: int(11) default 0
                activo: tinyint(1) default 1
                fecha_creacion: timestamp default CURRENT_TIMESTAMP
                fecha_actualizacion: timestamp default CURRENT_TIMESTAMP on update CURRENT_TIMESTAMP
                estado: enum('activo', 'inactivo', 'fusionado', 'bloqueado') default 'activo'
                cliente_padre_id: int(11)
                motivo_estado: varchar(255)
                fecha_cambio_estado: timestamp
                cliente_principal_id: int(11)
                motivo_fusion: text
                fecha_fusion: timestamp
            + indices
                idx_empresa: index (empresa_id) type btree
                tipo_documento_id: index (tipo_documento_id) type btree
                idx_documento: index (numero_documento) type btree
                idx_nombre: index (nombre) type btree
                idx_telefono: index (telefono) type btree
                idx_clientes_estado: index (estado) type btree
                idx_clientes_padre: index (cliente_padre_id) type btree
            + keys
                #1: PK (id) (underlying index PRIMARY)
            + foreign-keys
                clientes_ibfk_1: foreign key (empresa_id) -> empresas (id) d:cascade
                clientes_ibfk_2: foreign key (tipo_documento_id) -> tipos_documento (id)
                fk_clientes_padre: foreign key (cliente_padre_id) -> clientes (id) d:set_null
        clientes_duplicados_detecciones: table collate utf8mb4_0900_ai_ci
            + columns
                id: bigint(20) NN auto_increment = 1
                empresa_id: int(11) NN
                cliente_principal_id: int(11) NN
                cliente_duplicado_id: int(11) NN
                criterio_deteccion: enum('telefono', 'rnc', 'email', 'nombre_similar', 'manual') NN
                similitud_porcentaje: decimal(5,2)
                estado: enum('pendiente', 'revisado', 'fusionado', 'descartado') default 'pendiente'
                accion_tomada: varchar(100)
                detectado_por: int(11)
                revisado_por: int(11)
                notas: text
                fecha_deteccion: timestamp default CURRENT_TIMESTAMP
                fecha_revision: timestamp
                fecha_accion: timestamp
            + indices
                cliente_principal_id: index (cliente_principal_id) type btree
                cliente_duplicado_id: index (cliente_duplicado_id) type btree
                detectado_por: index (detectado_por) type btree
                revisado_por: index (revisado_por) type btree
            + keys
                #1: PK (id) (underlying index PRIMARY)
                uk_duplicados: AK (empresa_id, cliente_principal_id, cliente_duplicado_id)
            + foreign-keys
                clientes_duplicados_detecciones_ibfk_1: foreign key (empresa_id) -> empresas (id) d:cascade
                clientes_duplicados_detecciones_ibfk_2: foreign key (cliente_principal_id) -> clientes (id) d:cascade
                clientes_duplicados_detecciones_ibfk_3: foreign key (cliente_duplicado_id) -> clientes (id) d:cascade
                clientes_duplicados_detecciones_ibfk_4: foreign key (detectado_por) -> usuarios (id) d:set_null
                clientes_duplicados_detecciones_ibfk_5: foreign key (revisado_por) -> usuarios (id) d:set_null
        compras: table
            + columns
                id: int(11) NN auto_increment = 1
                empresa_id: int(11) NN
                tipo_comprobante_id: int(11) NN
                ncf: varchar(19) NN
                proveedor_id: int(11) NN
                usuario_id: int(11) NN
                subtotal: decimal(10,2) NN
                itbis: decimal(10,2) default 0.00
                total: decimal(10,2) NN
                metodo_pago: enum('efectivo', 'tarjeta_debito', 'tarjeta_credito', 'transferencia', 'cheque', 'mixto') NN default 'efectivo'
                efectivo_pagado: decimal(10,2)
                cambio: decimal(10,2)
                estado: enum('recibida', 'pendiente', 'anulada') default 'recibida'
                notas: text
                fecha_compra: timestamp default CURRENT_TIMESTAMP
            + indices
                idx_empresa: index (empresa_id) type btree
                tipo_comprobante_id: index (tipo_comprobante_id) type btree
                idx_ncf: index (ncf) type btree
                idx_proveedor: index (proveedor_id) type btree
                usuario_id: index (usuario_id) type btree
                idx_fecha: index (fecha_compra) type btree
            + keys
                #1: PK (id) (underlying index PRIMARY)
            + foreign-keys
                compras_ibfk_1: foreign key (empresa_id) -> empresas (id) d:cascade
                compras_ibfk_2: foreign key (tipo_comprobante_id) -> tipos_comprobante (id)
                compras_ibfk_3: foreign key (proveedor_id) -> proveedores (id)
                compras_ibfk_4: foreign key (usuario_id) -> usuarios (id)
        conduce_detalle: table
            + columns
                id: int(11) NN auto_increment = 1
                conduce_id: int(11) NN
                producto_id: int(11) NN
                nombre_producto: varchar(255) NN
                cantidad_despachada: decimal(10,2) NN
                created_at: timestamp default CURRENT_TIMESTAMP
            + indices
                idx_conduce: index (conduce_id) type btree
                idx_producto: index (producto_id) type btree
            + keys
                #1: PK (id) (underlying index PRIMARY)
            + foreign-keys
                conduce_detalle_ibfk_1: foreign key (conduce_id) -> conduces (id) d:cascade
                conduce_detalle_ibfk_2: foreign key (producto_id) -> productos (id)
        conduces: table
            + columns
                id: int(11) NN auto_increment = 1
                empresa_id: int(11) NN
                tipo_origen: enum('venta', 'cotizacion') NN
                origen_id: int(11) NN
                numero_origen: varchar(50) NN
                numero_conduce: varchar(20) NN
                fecha_conduce: date NN
                cliente_id: int(11)
                usuario_id: int(11) NN
                chofer: varchar(100)
                vehiculo: varchar(100)
                placa: varchar(20)
                estado: enum('emitido', 'entregado', 'anulado') default 'emitido'
                observaciones: text
                firma_receptor: text
                nombre_receptor: varchar(255)
                fecha_entrega: timestamp
                created_at: timestamp default CURRENT_TIMESTAMP
                updated_at: timestamp default CURRENT_TIMESTAMP on update CURRENT_TIMESTAMP
            + indices
                idx_empresa: index (empresa_id) type btree
                idx_origen: index (tipo_origen, origen_id) type btree
                idx_numero_origen: index (numero_origen) type btree
                idx_fecha: index (fecha_conduce) type btree
                idx_cliente: index (cliente_id) type btree
                idx_usuario: index (usuario_id) type btree
                idx_estado: index (estado) type btree
            + keys
                #1: PK (id) (underlying index PRIMARY)
                uk_numero_empresa: AK (numero_conduce, empresa_id)
            + foreign-keys
                conduces_ibfk_1: foreign key (empresa_id) -> empresas (id) d:cascade
                conduces_ibfk_2: foreign key (cliente_id) -> clientes (id) d:set_null
                conduces_ibfk_3: foreign key (usuario_id) -> usuarios (id)
        cotizacion_detalle: table
            + columns
                id: int(11) NN auto_increment = 1
                cotizacion_id: int(11) NN
                producto_id: int(11) NN
                nombre_producto: varchar(255) NN
                descripcion_producto: text
                cantidad: decimal(10,2) NN
                precio_unitario: decimal(10,2) NN
                subtotal: decimal(10,2) NN
                aplica_itbis: tinyint(1) default 1
                monto_gravado: decimal(10,2) NN
                itbis: decimal(10,2) default 0.00
                total: decimal(10,2) NN
                created_at: timestamp default CURRENT_TIMESTAMP
            + indices
                idx_cotizacion: index (cotizacion_id) type btree
                idx_producto: index (producto_id) type btree
            + keys
                #1: PK (id) (underlying index PRIMARY)
            + foreign-keys
                cotizacion_detalle_ibfk_1: foreign key (cotizacion_id) -> cotizaciones (id) d:cascade
                cotizacion_detalle_ibfk_2: foreign key (producto_id) -> productos (id)
        cotizaciones: table
            + columns
                id: int(11) NN auto_increment = 1
                empresa_id: int(11) NN
                cliente_id: int(11)
                usuario_id: int(11) NN
                numero_cotizacion: varchar(20) NN
                estado: enum('borrador', 'enviada', 'aprobada', 'convertida', 'vencida', 'anulada') default 'borrador'
                subtotal: decimal(10,2) NN
                descuento: decimal(10,2) default 0.00
                monto_gravado: decimal(10,2) NN
                itbis: decimal(10,2) NN default 0.00
                total: decimal(10,2) NN
                fecha_emision: date NN
                fecha_vencimiento: date NN
                observaciones: text
                venta_id: int(11)
                fecha_conversion: timestamp
                created_at: timestamp default CURRENT_TIMESTAMP
                updated_at: timestamp default CURRENT_TIMESTAMP on update CURRENT_TIMESTAMP
            + indices
                idx_empresa: index (empresa_id) type btree
                idx_cliente: index (cliente_id) type btree
                idx_usuario: index (usuario_id) type btree
                idx_numero: index (numero_cotizacion) type btree
                idx_estado: index (estado) type btree
                idx_fecha_emision: index (fecha_emision) type btree
                venta_id: index (venta_id) type btree
            + keys
                #1: PK (id) (underlying index PRIMARY)
                uk_numero_empresa: AK (numero_cotizacion, empresa_id)
            + foreign-keys
                cotizaciones_ibfk_1: foreign key (empresa_id) -> empresas (id) d:cascade
                cotizaciones_ibfk_2: foreign key (cliente_id) -> clientes (id) d:set_null
                cotizaciones_ibfk_3: foreign key (usuario_id) -> usuarios (id)
                cotizaciones_ibfk_4: foreign key (venta_id) -> ventas (id) d:set_null
        credito_clientes: table collate utf8mb4_0900_ai_ci
            --  Configuración de crédito autorizado por cliente
            + columns
                id: bigint(20) NN auto_increment = 1
                cliente_id: int(11) NN
                empresa_id: int(11) NN
                limite_credito: decimal(12,2) NN default 0.00
                    --  Monto máximo autorizado para crédito
                saldo_utilizado: decimal(12,2) NN default 0.00
                    --  Monto actualmente en uso
                saldo_disponible: computed by default decimal(12,2) default (`limite_credito` - `saldo_utilizado`)
                    --  Crédito disponible (calculado automáticamente)
                frecuencia_pago: enum('semanal', 'quincenal', 'mensual', 'personalizada') NN default 'mensual'
                dias_plazo: int(11) default 30
                    --  Días de plazo para pago (usado si es personalizada)
                estado_credito: enum('normal', 'atrasado', 'bloqueado', 'suspendido') NN default 'normal'
                razon_estado: varchar(255)
                    --  Motivo del estado actual (ej: "Pago atrasado 15 días")
                clasificacion: enum('A', 'B', 'C', 'D') default 'A'
                    --  A=Excelente, B=Bueno, C=Regular, D=Moroso
                score_crediticio: int(11) default 100
                    --  Puntaje de 0-100, calculado automáticamente
                fecha_ultima_evaluacion: timestamp
                    --  Última vez que se recalculó la clasificación
                fecha_proximo_vencimiento: date
                    --  Próxima fecha de pago esperada
                fecha_ultimo_pago: timestamp
                total_creditos_otorgados: int(11) default 0
                total_creditos_pagados: int(11) default 0
                total_creditos_vencidos: int(11) default 0
                promedio_dias_pago: decimal(5,2) default 0.00
                    --  Promedio de días que tarda en pagar
                activo: tinyint(1) default 1
                creado_por: int(11) NN
                modificado_por: int(11)
                fecha_creacion: timestamp default CURRENT_TIMESTAMP
                fecha_actualizacion: timestamp default CURRENT_TIMESTAMP on update CURRENT_TIMESTAMP
            + indices
                idx_cliente: index (cliente_id) type btree
                idx_empresa: index (empresa_id) type btree
                idx_estado: index (estado_credito) type btree
                idx_clasificacion: index (clasificacion) type btree
                idx_vencimiento: index (fecha_proximo_vencimiento) type btree
            + keys
                #1: PK (id) (underlying index PRIMARY)
                uk_cliente_empresa: AK (cliente_id, empresa_id)
            + foreign-keys
                fk_credito_cliente: foreign key (cliente_id) -> clientes (id) d:cascade
                fk_credito_empresa: foreign key (empresa_id) -> empresas (id) d:cascade
                fk_credito_creador: foreign key (creado_por) -> usuarios (id)
                fk_credito_modificador: foreign key (modificado_por) -> usuarios (id) d:set_null
            + checks
                chk_saldo_valido: check ((`saldo_utilizado` >= 0) and (`saldo_utilizado` <= `limite_credito`))
                chk_limite_positivo: check (`limite_credito` >= 0)
                chk_score_rango: check (`score_crediticio` between 0 and 100)
            + triggers
                trg_historial_cambio_clasificacion: trigger after row update definer root@localhost
        cuentas_por_cobrar: table collate utf8mb4_0900_ai_ci
            --  Registro de deudas y cuentas por cobrar
            + columns
                id: bigint(20) NN auto_increment = 1
                credito_cliente_id: bigint(20) NN
                empresa_id: int(11) NN
                cliente_id: int(11) NN
                venta_id: int(11)
                    --  Venta que originó la deuda
                cotizacion_id: int(11)
                    --  Cotización que originó la deuda
                origen: enum('venta', 'cotizacion', 'ajuste_manual') NN default 'venta'
                numero_documento: varchar(50) NN
                    --  NCF o número de documento
                monto_total: decimal(12,2) NN
                monto_pagado: decimal(12,2) NN default 0.00
                saldo_pendiente: computed by default decimal(12,2) default (`monto_total` - `monto_pagado`)
                fecha_emision: date NN
                fecha_vencimiento: date NN
                fecha_vencimiento_original: date NN
                    --  Vencimiento original (por si se reestructura)
                dias_atraso: int(11) NN default 0
                    --  Días de atraso calculados por trigger o proceso automático
                estado_cxc: enum('activa', 'vencida', 'pagada', 'parcial', 'reestructurada', 'castigada') NN default 'activa'
                rango_antiguedad: computed by default enum('corriente', '1-7_dias', '8-15_dias', '16-30_dias', 'mas_30_dias') default (case when (`dias_atraso` = 0) then _utf8mb4'corriente' when (`dias_atraso` between 1 and 7) then _utf8mb4'1-7_dias' when (`dias_atraso` between 8 and 15) then _utf8mb4'8-15_dias' when (`dias_atraso` between 16 and 30) then _utf8mb4'16-30_dias' else _utf8mb4'mas_30_dias' end)
                fecha_ultimo_abono: timestamp
                numero_abonos: int(11) default 0
                notas: text
                razon_reestructuracion: text
                    --  Si fue reestructurada, explicar por qué
                creado_por: int(11) NN
                fecha_creacion: timestamp default CURRENT_TIMESTAMP
                fecha_actualizacion: timestamp default CURRENT_TIMESTAMP on update CURRENT_TIMESTAMP
            + indices
                idx_credito: index (credito_cliente_id) type btree
                idx_empresa: index (empresa_id) type btree
                idx_cliente: index (cliente_id) type btree
                idx_venta: index (venta_id) type btree
                idx_emision: index (fecha_emision) type btree
                idx_vencimiento: index (fecha_vencimiento) type btree
                idx_estado: index (estado_cxc) type btree
                idx_antiguedad: index (rango_antiguedad) type btree
            + keys
                #1: PK (id) (underlying index PRIMARY)
            + foreign-keys
                fk_cxc_credito: foreign key (credito_cliente_id) -> credito_clientes (id) d:cascade
                fk_cxc_empresa: foreign key (empresa_id) -> empresas (id) d:cascade
                fk_cxc_cliente: foreign key (cliente_id) -> clientes (id) d:cascade
                fk_cxc_venta: foreign key (venta_id) -> ventas (id) d:set_null
                fk_cxc_cotizacion: foreign key (cotizacion_id) -> cotizaciones (id) d:set_null
                fk_cxc_creador: foreign key (creado_por) -> usuarios (id)
            + checks
                chk_pagado_valido: check ((`monto_pagado` >= 0) and (`monto_pagado` <= `monto_total`))
                chk_fechas_validas: check (`fecha_vencimiento` >= `fecha_emision`)
                chk_monto_positivo: check (`monto_total` > 0)
            + triggers
                trg_actualizar_saldo_credito_insert: trigger after row insert definer root@localhost
                trg_calcular_atraso_cxc: trigger before row update definer root@localhost
        despachos: table
            + columns
                id: int(11) NN auto_increment = 35
                venta_id: int(11) NN
                numero_despacho: int(11) NN
                usuario_id: int(11) NN
                fecha_despacho: timestamp default CURRENT_TIMESTAMP
                observaciones: text
                estado: enum('activo', 'cerrado', 'anulado') default 'activo'
            + indices
                idx_venta: index (venta_id) type btree
                usuario_id: index (usuario_id) type btree
                idx_fecha: index (fecha_despacho) type btree
                idx_estado: index (estado) type btree
            + keys
                #1: PK (id) (underlying index PRIMARY)
            + foreign-keys
                despachos_ibfk_1: foreign key (venta_id) -> ventas (id) d:cascade
                despachos_ibfk_2: foreign key (usuario_id) -> usuarios (id)
        detalle_compras: table
            + columns
                id: int(11) NN auto_increment = 1
                compra_id: int(11) NN
                producto_id: int(11) NN
                cantidad: int(11) NN
                precio_unitario: decimal(10,2) NN
                subtotal: decimal(10,2) NN
            + indices
                idx_compra: index (compra_id) type btree
                idx_producto: index (producto_id) type btree
            + keys
                #1: PK (id) (underlying index PRIMARY)
            + foreign-keys
                detalle_compras_ibfk_1: foreign key (compra_id) -> compras (id) d:cascade
                detalle_compras_ibfk_2: foreign key (producto_id) -> productos (id) d:cascade
        detalle_despachos: table
            + columns
                id: int(11) NN auto_increment = 42
                despacho_id: int(11) NN
                detalle_venta_id: int(11) NN
                cantidad_despachada: int(11) NN
            + indices
                idx_despacho: index (despacho_id) type btree
                idx_detalle_venta: index (detalle_venta_id) type btree
            + keys
                #1: PK (id) (underlying index PRIMARY)
            + foreign-keys
                detalle_despachos_ibfk_1: foreign key (despacho_id) -> despachos (id) d:cascade
                detalle_despachos_ibfk_2: foreign key (detalle_venta_id) -> detalle_ventas (id) d:cascade
        detalle_ventas: table
            + columns
                id: int(11) NN auto_increment = 119
                venta_id: int(11) NN
                producto_id: int(11) NN
                cantidad: int(11) NN
                cantidad_despachada: int(11) default 0
                cantidad_pendiente: int(11) default 0
                precio_unitario: decimal(10,2) NN
                subtotal: decimal(10,2) NN
                descuento: decimal(10,2) default 0.00
                monto_gravado: decimal(10,2) NN
                itbis: decimal(10,2) default 0.00
                total: decimal(10,2) NN
            + indices
                idx_venta: index (venta_id) type btree
                idx_producto: index (producto_id) type btree
            + keys
                #1: PK (id) (underlying index PRIMARY)
            + foreign-keys
                detalle_ventas_ibfk_1: foreign key (venta_id) -> ventas (id) d:cascade
                detalle_ventas_ibfk_2: foreign key (producto_id) -> productos (id) d:cascade
        empresas: table
            + columns
                id: int(11) NN auto_increment = 36
                nombre_empresa: varchar(200) NN
                rnc: varchar(11) NN
                razon_social: varchar(250) NN
                nombre_comercial: varchar(200) NN
                actividad_economica: varchar(200) NN
                direccion: text NN
                sector: varchar(100) NN
                municipio: varchar(100) NN
                provincia: varchar(100) NN
                telefono: varchar(20)
                email: varchar(100)
                moneda: varchar(3) default 'DOP'
                simbolo_moneda: varchar(5) default 'RD$'
                impuesto_nombre: varchar(50) default 'ITBIS'
                impuesto_porcentaje: decimal(5,2) default 18.00
                logo_url: varchar(255)
                color_fondo: varchar(7) default '#FFFFFF'
                mensaje_factura: text
                secuencia_ncf_fiscal: varchar(20)
                secuencia_ncf_consumidor: varchar(20)
                secuencia_ncf_gubernamental: varchar(20)
                secuencia_ncf_regimenes: varchar(20)
                fecha_vencimiento_ncf: date
                usuario_dgii: varchar(100)
                ambiente_dgii: enum('prueba', 'produccion') default 'prueba'
                activo: tinyint(1) default 1
                bloqueada: tinyint(1) default 0
                motivo_bloqueo: text
                fecha_bloqueo: datetime
                bloqueada_por: int(11)
                fecha_creacion: timestamp default CURRENT_TIMESTAMP
                fecha_actualizacion: timestamp default CURRENT_TIMESTAMP on update CURRENT_TIMESTAMP
            + indices
                idx_rnc: index (rnc) type btree
                idx_activo: index (activo) type btree
                idx_empresas_bloqueada: index (bloqueada) type btree
            + keys
                #1: PK (id) (underlying index PRIMARY)
            + foreign-keys
                fk_empresas_bloqueada_por: foreign key (bloqueada_por) -> usuarios (id) d:set_null
        empresas_bloqueos_log: table collate utf8mb4_0900_ai_ci
            + columns
                id: bigint(20) NN auto_increment = 1
                empresa_id: int(11) NN
                motivo: text NN
                bloqueada_por: int(11)
                fecha_bloqueo: timestamp default CURRENT_TIMESTAMP
            + keys
                #1: PK (id) (underlying index PRIMARY)
            + foreign-keys
                fk_bloqueo_empresa: foreign key (empresa_id) -> empresas (id) d:cascade
                fk_bloqueo_usuario: foreign key (bloqueada_por) -> usuarios (id) d:set_null
        empresas_pagos: table collate utf8mb4_0900_ai_ci
            + columns
                id: bigint(20) NN auto_increment = 1
                suscripcion_id: int(11) NN
                empresa_id: int(11) NN
                monto: decimal(10,2) NN
                metodo_pago: varchar(50) NN
                estado: enum('pendiente', 'procesado', 'rechazado', 'reembolsado') default 'pendiente'
                fecha_pago: timestamp default CURRENT_TIMESTAMP
            + indices
                suscripcion_id: index (suscripcion_id) type btree
                empresa_id: index (empresa_id) type btree
            + keys
                #1: PK (id) (underlying index PRIMARY)
            + foreign-keys
                empresas_pagos_ibfk_1: foreign key (suscripcion_id) -> empresas_suscripciones (id) d:cascade
                empresas_pagos_ibfk_2: foreign key (empresa_id) -> empresas (id) d:cascade
        empresas_suscripciones: table collate utf8mb4_0900_ai_ci
            + columns
                id: int(11) NN auto_increment = 1
                empresa_id: int(11) NN
                plan_nombre: varchar(100) default 'Básico'
                plan_tipo: enum('basico', 'profesional', 'empresarial', 'personalizado') default 'basico'
                limite_usuarios: int(11) default 2
                limite_productos: int(11) default 500
                estado: enum('activa', 'vencida', 'suspendida', 'cancelada', 'prueba') default 'prueba'
                fecha_inicio: date NN
                fecha_vencimiento: date NN
                monto_mensual: decimal(10,2) default 0.00
                moneda: varchar(3) default 'DOP'
                dias_gracia: int(11) default 7
                en_periodo_gracia: tinyint(1) default 0
                fecha_creacion: timestamp default CURRENT_TIMESTAMP
                fecha_actualizacion: timestamp default CURRENT_TIMESTAMP on update CURRENT_TIMESTAMP
                usuarios_actuales: int(11) default 0
                productos_actuales: int(11) default 0
                ventas_mes_actual: int(11) default 0
                metodo_pago: varchar(50)
                notas_admin: text
            + keys
                #1: PK (id) (underlying index PRIMARY)
                empresa_id: AK (empresa_id)
            + foreign-keys
                empresas_suscripciones_ibfk_1: foreign key (empresa_id) -> empresas (id) d:cascade
        gastos: table
            + columns
                id: int(11) NN auto_increment = 3
                empresa_id: int(11) NN
                concepto: varchar(200) NN
                monto: decimal(10,2) NN
                categoria: varchar(100)
                usuario_id: int(11) NN
                caja_id: int(11)
                comprobante_numero: varchar(50)
                notas: text
                fecha_gasto: timestamp default CURRENT_TIMESTAMP
            + indices
                idx_empresa: index (empresa_id) type btree
                idx_usuario: index (usuario_id) type btree
                caja_id: index (caja_id) type btree
                idx_fecha: index (fecha_gasto) type btree
            + keys
                #1: PK (id) (underlying index PRIMARY)
            + foreign-keys
                gastos_ibfk_1: foreign key (empresa_id) -> empresas (id) d:cascade
                gastos_ibfk_2: foreign key (usuario_id) -> usuarios (id)
                gastos_ibfk_3: foreign key (caja_id) -> cajas (id) d:set_null
        historial_credito: table collate utf8mb4_0900_ai_ci
            --  Historial inmutable de eventos crediticios
            + columns
                id: bigint(20) NN auto_increment = 1
                credito_cliente_id: bigint(20) NN
                empresa_id: int(11) NN
                cliente_id: int(11) NN
                tipo_evento: enum('creacion_credito', 'ajuste_limite', 'pago_realizado', 'pago_tardio', 'credito_vencido', 'bloqueo_credito', 'desbloqueo_credito', 'cambio_clasificacion', 'reestructuracion', 'castigo_deuda', 'nota_manual') NN
                descripcion: text NN
                datos_anteriores: json
                    --  Estado antes del cambio
                datos_nuevos: json
                    --  Estado después del cambio
                clasificacion_momento: enum('A', 'B', 'C', 'D')
                score_momento: int(11)
                generado_por: enum('sistema', 'usuario') NN default 'sistema'
                usuario_id: int(11)
                fecha_evento: timestamp default CURRENT_TIMESTAMP
            + indices
                idx_credito: index (credito_cliente_id) type btree
                idx_empresa: index (empresa_id) type btree
                idx_cliente: index (cliente_id) type btree
                idx_tipo: index (tipo_evento) type btree
                idx_fecha: index (fecha_evento) type btree
            + keys
                #1: PK (id) (underlying index PRIMARY)
            + foreign-keys
                fk_historial_credito: foreign key (credito_cliente_id) -> credito_clientes (id) d:cascade
                fk_historial_empresa: foreign key (empresa_id) -> empresas (id) d:cascade
                fk_historial_cliente: foreign key (cliente_id) -> clientes (id) d:cascade
                fk_historial_usuario: foreign key (usuario_id) -> usuarios (id) d:set_null
        isiweek_categorias: table
            + columns
                id: int(11) NN auto_increment = 6
                nombre: varchar(255) NN
                descripcion: text
                activo: tinyint(1) default 1
                orden: int(11) default 0
                fecha_creacion: datetime default CURRENT_TIMESTAMP
            + indices
                idx_activo: index (activo) type btree
                idx_orden: index (orden) type btree
            + keys
                #1: PK (id) (underlying index PRIMARY)
        isiweek_productos: table
            + columns
                id: int(11) NN auto_increment = 3
                nombre: varchar(255) NN
                descripcion: text
                categoria_id: int(11)
                precio: decimal(10,2) NN
                precio_volumen: decimal(10,2)
                cantidad_volumen: int(11)
                stock: int(11) default 0
                imagen_url: varchar(500)
                sku: varchar(100)
                tiempo_entrega: varchar(100)
                activo: tinyint(1) default 1
                destacado: tinyint(1) default 0
                fecha_creacion: datetime default CURRENT_TIMESTAMP
                fecha_actualizacion: datetime default CURRENT_TIMESTAMP on update CURRENT_TIMESTAMP
            + indices
                idx_categoria: index (categoria_id) type btree
                idx_sku: index (sku) type btree
                idx_activo: index (activo) type btree
                idx_destacado: index (destacado) type btree
            + keys
                #1: PK (id) (underlying index PRIMARY)
            + foreign-keys
                isiweek_productos_ibfk_1: foreign key (categoria_id) -> isiweek_categorias (id) d:set_null
        marcas: table
            + columns
                id: int(11) NN auto_increment = 7
                empresa_id: int(11) NN
                nombre: varchar(100) NN
                pais_origen: varchar(50)
                descripcion: text
                logo_url: varchar(255)
                activo: tinyint(1) default 1
                fecha_creacion: timestamp default CURRENT_TIMESTAMP
            + indices
                idx_empresa: index (empresa_id) type btree
                idx_nombre: index (nombre) type btree
            + keys
                #1: PK (id) (underlying index PRIMARY)
            + foreign-keys
                marcas_ibfk_1: foreign key (empresa_id) -> empresas (id) d:cascade
        monedas: table
            + columns
                id: int(11) NN auto_increment = 3
                codigo: varchar(3) NN
                nombre: varchar(50) NN
                simbolo: varchar(5) NN
                activo: tinyint(1) default 1
                fecha_creacion: timestamp default CURRENT_TIMESTAMP
            + indices
                idx_codigo: index (codigo) type btree
                idx_activo: index (activo) type btree
            + keys
                #1: PK (id) (underlying index PRIMARY)
        movimientos_inventario: table
            + columns
                id: int(11) NN auto_increment = 222
                empresa_id: int(11) NN
                producto_id: int(11) NN
                tipo: enum('entrada', 'salida', 'ajuste', 'devolucion', 'merma') NN
                cantidad: int(11) NN
                stock_anterior: int(11) NN
                stock_nuevo: int(11) NN
                referencia: varchar(100)
                usuario_id: int(11) NN
                notas: text
                fecha_movimiento: timestamp default CURRENT_TIMESTAMP
            + indices
                idx_empresa: index (empresa_id) type btree
                idx_producto: index (producto_id) type btree
                idx_tipo: index (tipo) type btree
                usuario_id: index (usuario_id) type btree
                idx_fecha: index (fecha_movimiento) type btree
            + keys
                #1: PK (id) (underlying index PRIMARY)
            + foreign-keys
                movimientos_inventario_ibfk_1: foreign key (empresa_id) -> empresas (id) d:cascade
                movimientos_inventario_ibfk_2: foreign key (producto_id) -> productos (id) d:cascade
                movimientos_inventario_ibfk_3: foreign key (usuario_id) -> usuarios (id)
        pedidos_b2b: table
            + columns
                id: int(11) NN auto_increment = 7
                numero_pedido: varchar(50)
                empresa_id: int(11) NN
                usuario_id: int(11) NN
                metodo_pago: enum('contra_entrega', 'transferencia', 'credito') default 'contra_entrega'
                subtotal: decimal(10,2) NN
                descuento: decimal(10,2) default 0.00
                impuesto: decimal(10,2) default 0.00
                total: decimal(10,2) NN
                estado: enum('pendiente', 'confirmado', 'en_proceso', 'enviado', 'entregado', 'cancelado') default 'pendiente'
                notas: text
                fecha_pedido: datetime default CURRENT_TIMESTAMP
                fecha_confirmacion: datetime
                fecha_actualizacion: datetime default CURRENT_TIMESTAMP on update CURRENT_TIMESTAMP
            + indices
                idx_numero: index (numero_pedido) type btree
                idx_empresa: index (empresa_id) type btree
                usuario_id: index (usuario_id) type btree
                idx_estado: index (estado) type btree
                idx_fecha: index (fecha_pedido) type btree
            + keys
                #1: PK (id) (underlying index PRIMARY)
                numero_pedido: AK (numero_pedido)
            + foreign-keys
                pedidos_b2b_ibfk_1: foreign key (empresa_id) -> empresas (id) d:cascade
                pedidos_b2b_ibfk_2: foreign key (usuario_id) -> usuarios (id) d:cascade
        pedidos_b2b_items: table
            + columns
                id: int(11) NN auto_increment = 7
                pedido_id: int(11) NN
                producto_id: int(11) NN
                cantidad: int(11) NN
                precio_unitario: decimal(10,2) NN
                precio_aplicado: decimal(10,2) NN
                    --  Precio aplicado (puede ser precio_volumen si aplica)
                descuento: decimal(10,2) default 0.00
                subtotal: decimal(10,2) NN
                fecha_creacion: datetime default CURRENT_TIMESTAMP
            + indices
                idx_pedido: index (pedido_id) type btree
                idx_producto: index (producto_id) type btree
            + keys
                #1: PK (id) (underlying index PRIMARY)
            + foreign-keys
                pedidos_b2b_items_ibfk_1: foreign key (pedido_id) -> pedidos_b2b (id) d:cascade
                pedidos_b2b_items_ibfk_2: foreign key (producto_id) -> isiweek_productos (id) d:cascade
        pedidos_online: table
            + columns
                id: int(11) NN auto_increment = 5
                numero_pedido: varchar(50)
                empresa_id: int(11) NN
                cliente_nombre: varchar(255)
                cliente_telefono: varchar(50)
                cliente_email: varchar(255)
                cliente_direccion: text
                metodo_pago: enum('efectivo', 'transferencia', 'tarjeta', 'contra_entrega') default 'contra_entrega'
                metodo_entrega: enum('pickup', 'delivery') default 'pickup'
                subtotal: decimal(10,2) NN
                descuento: decimal(10,2) default 0.00
                impuesto: decimal(10,2) default 0.00
                envio: decimal(10,2) default 0.00
                total: decimal(10,2) NN
                estado: enum('pendiente', 'confirmado', 'en_proceso', 'listo', 'entregado', 'cancelado') default 'pendiente'
                notas: text
                venta_id: int(11)
                fecha_pedido: datetime default CURRENT_TIMESTAMP
                fecha_confirmacion: datetime
                fecha_actualizacion: datetime default CURRENT_TIMESTAMP on update CURRENT_TIMESTAMP
            + indices
                idx_numero: index (numero_pedido) type btree
                idx_empresa: index (empresa_id) type btree
                idx_estado: index (estado) type btree
                venta_id: index (venta_id) type btree
                idx_fecha: index (fecha_pedido) type btree
            + keys
                #1: PK (id) (underlying index PRIMARY)
                numero_pedido: AK (numero_pedido)
            + foreign-keys
                pedidos_online_ibfk_1: foreign key (empresa_id) -> empresas (id) d:cascade
                pedidos_online_ibfk_2: foreign key (venta_id) -> ventas (id) d:set_null
        pedidos_online_items: table
            + columns
                id: int(11) NN auto_increment = 6
                pedido_id: int(11) NN
                producto_id: int(11) NN
                cantidad: int(11) NN
                precio_unitario: decimal(10,2) NN
                descuento: decimal(10,2) default 0.00
                subtotal: decimal(10,2) NN
                fecha_creacion: datetime default CURRENT_TIMESTAMP
            + indices
                idx_pedido: index (pedido_id) type btree
                idx_producto: index (producto_id) type btree
            + keys
                #1: PK (id) (underlying index PRIMARY)
            + foreign-keys
                pedidos_online_items_ibfk_1: foreign key (pedido_id) -> pedidos_online (id) d:cascade
                pedidos_online_items_ibfk_2: foreign key (producto_id) -> productos (id) d:cascade
        pedidos_superadmin: table
            + columns
                id: int(11) NN auto_increment = 1
                numero_pedido: varchar(50)
                cliente_nombre: varchar(255) NN
                cliente_telefono: varchar(50) NN
                cliente_email: varchar(255)
                cliente_direccion: text
                metodo_pago: enum('efectivo', 'transferencia', 'tarjeta', 'contra_entrega') default 'contra_entrega'
                metodo_entrega: enum('pickup', 'delivery') default 'pickup'
                subtotal: decimal(10,2) NN
                descuento: decimal(10,2) default 0.00
                impuesto: decimal(10,2) default 0.00
                envio: decimal(10,2) default 0.00
                total: decimal(10,2) NN
                estado: enum('pendiente', 'confirmado', 'en_proceso', 'listo', 'entregado', 'cancelado') default 'pendiente'
                notas: text
                fecha_pedido: datetime default CURRENT_TIMESTAMP
                fecha_confirmacion: datetime
                fecha_actualizacion: datetime default CURRENT_TIMESTAMP on update CURRENT_TIMESTAMP
            + indices
                idx_numero: index (numero_pedido) type btree
                idx_estado: index (estado) type btree
                idx_fecha: index (fecha_pedido) type btree
            + keys
                #1: PK (id) (underlying index PRIMARY)
                numero_pedido: AK (numero_pedido)
        pedidos_superadmin_items: table
            + columns
                id: int(11) NN auto_increment = 1
                pedido_id: int(11) NN
                producto_id: int(11) NN
                cantidad: int(11) NN
                precio_unitario: decimal(10,2) NN
                descuento: decimal(10,2) default 0.00
                subtotal: decimal(10,2) NN
                fecha_creacion: datetime default CURRENT_TIMESTAMP
            + indices
                idx_pedido: index (pedido_id) type btree
                idx_producto: index (producto_id) type btree
            + keys
                #1: PK (id) (underlying index PRIMARY)
            + foreign-keys
                pedidos_superadmin_items_ibfk_1: foreign key (pedido_id) -> pedidos_superadmin (id) d:cascade
                pedidos_superadmin_items_ibfk_2: foreign key (producto_id) -> superadmin_productos_catalogo (id) d:cascade
        permisos: table
            + columns
                id: int(11) NN auto_increment = 27
                modulo: varchar(50) NN
                nombre: varchar(100) NN
                clave: varchar(100) NN
                descripcion: text
                activo: tinyint(1) default 1
                fecha_creacion: timestamp default CURRENT_TIMESTAMP
            + indices
                idx_modulo: index (modulo) type btree
                idx_clave: index (clave) type btree
            + keys
                #1: PK (id) (underlying index PRIMARY)
        plataforma_config: table
            + columns
                id: int(11) NN auto_increment = 3
                nombre_plataforma: varchar(200) NN default 'Punto de Venta RD'
                logo_url: varchar(255)
                email_contacto: varchar(100)
                telefono_contacto: varchar(20)
                telefono_whatsapp: varchar(20)
                direccion: text
                color_primario: varchar(7) default '#3B82F6'
                color_secundario: varchar(7) default '#1E40AF'
                copyright: varchar(255)
                fecha_creacion: timestamp default CURRENT_TIMESTAMP
                fecha_actualizacion: timestamp default CURRENT_TIMESTAMP on update CURRENT_TIMESTAMP
            + keys
                #1: PK (id) (underlying index PRIMARY)
        productos: table
            + columns
                id: int(11) NN auto_increment = 285
                empresa_id: int(11) NN
                codigo_barras: varchar(50)
                sku: varchar(50)
                nombre: varchar(200) NN
                descripcion: text
                categoria_id: int(11)
                marca_id: int(11)
                unidad_medida_id: int(11)
                precio_compra: decimal(10,2) NN
                precio_venta: decimal(10,2) NN
                precio_oferta: decimal(10,2)
                precio_mayorista: decimal(10,2)
                cantidad_mayorista: int(11) default 6
                stock: int(11) NN default 0
                stock_minimo: int(11) default 5
                stock_maximo: int(11) default 100
                imagen_url: varchar(1000)
                aplica_itbis: tinyint(1) default 1
                activo: tinyint(1) default 1
                fecha_vencimiento: date
                lote: varchar(50)
                ubicacion_bodega: varchar(100)
                fecha_creacion: timestamp default CURRENT_TIMESTAMP
                fecha_actualizacion: timestamp default CURRENT_TIMESTAMP on update CURRENT_TIMESTAMP
            + indices
                idx_empresa: index (empresa_id) type btree
                idx_codigo_barras: index (codigo_barras) type btree
                idx_sku: index (sku) type btree
                idx_nombre: index (nombre) type btree
                idx_categoria: index (categoria_id) type btree
                idx_marca: index (marca_id) type btree
                unidad_medida_id: index (unidad_medida_id) type btree
            + keys
                #1: PK (id) (underlying index PRIMARY)
            + foreign-keys
                productos_ibfk_1: foreign key (empresa_id) -> empresas (id) d:cascade
                productos_ibfk_2: foreign key (categoria_id) -> categorias (id) d:set_null
                productos_ibfk_3: foreign key (marca_id) -> marcas (id) d:set_null
                productos_ibfk_4: foreign key (unidad_medida_id) -> unidades_medida (id) d:set_null
        productos_catalogo: table
            + columns
                id: int(11) NN auto_increment = 7
                producto_id: int(11) NN
                empresa_id: int(11) NN
                visible_catalogo: tinyint(1) default 0
                precio_catalogo: decimal(10,2)
                precio_oferta: decimal(10,2)
                fecha_inicio_oferta: datetime
                fecha_fin_oferta: datetime
                destacado: tinyint(1) default 0
                orden_visual: int(11) default 0
                descripcion_corta: text
                stock_visible: tinyint(1) default 1
                activo: tinyint(1) default 1
                fecha_creacion: datetime default CURRENT_TIMESTAMP
                fecha_actualizacion: datetime default CURRENT_TIMESTAMP on update CURRENT_TIMESTAMP
            + indices
                idx_producto: index (producto_id) type btree
                idx_empresa: index (empresa_id) type btree
                idx_visible: index (visible_catalogo, activo) type btree
                idx_destacado: index (destacado, activo) type btree
            + keys
                #1: PK (id) (underlying index PRIMARY)
                uk_producto_empresa: AK (producto_id, empresa_id)
            + foreign-keys
                productos_catalogo_ibfk_1: foreign key (producto_id) -> productos (id) d:cascade
                productos_catalogo_ibfk_2: foreign key (empresa_id) -> empresas (id) d:cascade
        proveedores: table
            + columns
                id: int(11) NN auto_increment = 2
                empresa_id: int(11) NN
                rnc: varchar(11) NN
                razon_social: varchar(250) NN
                nombre_comercial: varchar(200)
                actividad_economica: varchar(200)
                contacto: varchar(100)
                telefono: varchar(20)
                email: varchar(100)
                direccion: text
                sector: varchar(100)
                municipio: varchar(100)
                provincia: varchar(100)
                sitio_web: varchar(255)
                condiciones_pago: text
                activo: tinyint(1) default 1
                fecha_creacion: timestamp default CURRENT_TIMESTAMP
            + indices
                idx_empresa: index (empresa_id) type btree
                idx_rnc: index (rnc) type btree
                idx_razon_social: index (razon_social) type btree
            + keys
                #1: PK (id) (underlying index PRIMARY)
            + foreign-keys
                proveedores_ibfk_1: foreign key (empresa_id) -> empresas (id) d:cascade
        reglas_credito: table collate utf8mb4_0900_ai_ci
            --  Reglas configurables de negocio para crédito
            + columns
                id: int(11) NN auto_increment = 7
                empresa_id: int(11)
                    --  NULL = regla global del sistema
                codigo: varchar(50) NN
                nombre: varchar(100) NN
                descripcion: text
                categoria: enum('limite_credito', 'clasificacion', 'bloqueo', 'alerta', 'scoring') NN
                configuracion: json NN
                    --  Parámetros específicos de la regla
                activo: tinyint(1) default 1
                orden_ejecucion: int(11) default 0
                    --  Orden en que se aplican las reglas
                creado_por: int(11)
                modificado_por: int(11)
                fecha_creacion: timestamp default CURRENT_TIMESTAMP
                fecha_actualizacion: timestamp default CURRENT_TIMESTAMP on update CURRENT_TIMESTAMP
            + indices
                idx_empresa: index (empresa_id) type btree
                idx_categoria: index (categoria) type btree
                idx_activo: index (activo) type btree
                idx_orden: index (orden_ejecucion) type btree
            + keys
                #1: PK (id) (underlying index PRIMARY)
                codigo: AK (codigo)
            + foreign-keys
                fk_regla_empresa: foreign key (empresa_id) -> empresas (id) d:cascade
                fk_regla_creador: foreign key (creado_por) -> usuarios (id) d:set_null
                fk_regla_modificador: foreign key (modificado_por) -> usuarios (id) d:set_null
        roles: table
            + columns
                id: int(11) NN auto_increment = 4
                nombre: varchar(50) NN
                descripcion: text
                activo: tinyint(1) default 1
                fecha_creacion: timestamp default CURRENT_TIMESTAMP
            + indices
                idx_nombre: index (nombre) type btree
            + keys
                #1: PK (id) (underlying index PRIMARY)
        roles_permisos: table
            + columns
                id: int(11) NN auto_increment = 41
                rol_id: int(11) NN
                permiso_id: int(11) NN
                fecha_creacion: timestamp default CURRENT_TIMESTAMP
            + indices
                idx_rol: index (rol_id) type btree
                idx_permiso: index (permiso_id) type btree
            + keys
                #1: PK (id) (underlying index PRIMARY)
            + foreign-keys
                roles_permisos_ibfk_1: foreign key (rol_id) -> roles (id) d:cascade
                roles_permisos_ibfk_2: foreign key (permiso_id) -> permisos (id) d:cascade
        saldo_despacho: table
            + columns
                id: int(11) NN auto_increment = 1
                empresa_id: int(11) NN
                tipo_origen: enum('venta', 'cotizacion') NN
                origen_id: int(11) NN
                producto_id: int(11) NN
                cantidad_total: decimal(10,2) NN
                cantidad_despachada: decimal(10,2) default 0.00
                cantidad_pendiente: decimal(10,2) NN
                created_at: timestamp default CURRENT_TIMESTAMP
                updated_at: timestamp default CURRENT_TIMESTAMP on update CURRENT_TIMESTAMP
            + indices
                idx_empresa: index (empresa_id) type btree
                idx_origen: index (tipo_origen, origen_id) type btree
                idx_producto: index (producto_id) type btree
            + keys
                #1: PK (id) (underlying index PRIMARY)
                uk_origen_producto: AK (tipo_origen, origen_id, producto_id)
            + foreign-keys
                saldo_despacho_ibfk_1: foreign key (empresa_id) -> empresas (id) d:cascade
                saldo_despacho_ibfk_2: foreign key (producto_id) -> productos (id)
        settings: table
            + columns
                id: int(11) NN auto_increment = 2
                empresa_id: int(11)
                name: varchar(50) NN
                value: text
                updated_at: timestamp default CURRENT_TIMESTAMP on update CURRENT_TIMESTAMP
                updated_by: int(11)
            + indices
                idx_empresa: index (empresa_id) type btree
                idx_name: index (name) type btree
                updated_by: index (updated_by) type btree
            + keys
                #1: PK (id) (underlying index PRIMARY)
                unique_setting_empresa: AK (empresa_id, name)
            + foreign-keys
                settings_ibfk_1: foreign key (empresa_id) -> empresas (id) d:cascade
                settings_ibfk_2: foreign key (updated_by) -> usuarios (id) d:set_null
        sistema_reglas: table collate utf8mb4_0900_ai_ci
            + columns
                id: int(11) NN auto_increment = 4
                codigo: varchar(50) NN
                descripcion: text NN
                valor: int(11) NN
                activo: tinyint(1) default 1
                creado_en: timestamp default CURRENT_TIMESTAMP
            + keys
                #1: PK (id) (underlying index PRIMARY)
                codigo: AK (codigo)
        solicitudes_registro: table
            + columns
                id: int(11) NN auto_increment = 25
                nombre: varchar(100) NN
                cedula: varchar(20) NN
                email: varchar(100) NN
                password: varchar(255) NN
                telefono: varchar(20)
                nombre_empresa: varchar(200)
                rnc: varchar(11)
                razon_social: varchar(250)
                acepto_terminos: tinyint(1) default 0
                terminos_version: varchar(20)
                ip_registro: varchar(45)
                estado: enum('pendiente', 'aprobada', 'rechazada') default 'pendiente'
                fecha_solicitud: timestamp default CURRENT_TIMESTAMP
                fecha_respuesta: timestamp
                notas: text
            + indices
                idx_email: index (email) type btree
                idx_estado: index (estado) type btree
                idx_fecha: index (fecha_solicitud) type btree
            + keys
                #1: PK (id) (underlying index PRIMARY)
        superadmin_productos_catalogo: table
            + columns
                id: int(11) NN auto_increment = 2
                nombre: varchar(255) NN
                descripcion: text
                categoria_id: int(11)
                precio_venta: decimal(10,2) NN
                precio_oferta: decimal(10,2)
                fecha_inicio_oferta: datetime
                fecha_fin_oferta: datetime
                stock: int(11) default 0
                stock_minimo: int(11) default 0
                imagen_url: varchar(500)
                sku: varchar(100)
                destacado: tinyint(1) default 0
                visible_catalogo: tinyint(1) default 1
                activo: tinyint(1) default 1
                fecha_creacion: datetime default CURRENT_TIMESTAMP
                fecha_actualizacion: datetime default CURRENT_TIMESTAMP on update CURRENT_TIMESTAMP
            + indices
                idx_categoria: index (categoria_id) type btree
                idx_sku: index (sku) type btree
                idx_destacado: index (destacado) type btree
                idx_activo: index (activo) type btree
            + keys
                #1: PK (id) (underlying index PRIMARY)
            + foreign-keys
                superadmin_productos_catalogo_ibfk_1: foreign key (categoria_id) -> categorias (id) d:set_null
        terminos_condiciones: table
            --  Almacena las diferentes versiones de términos y condiciones
            + columns
                id: int(11) NN auto_increment = 4
                version: varchar(20) NN
                titulo: varchar(255) NN
                contenido: longtext NN
                activo: tinyint(1) default 0
                creado_en: timestamp default CURRENT_TIMESTAMP
                actualizado_en: timestamp default CURRENT_TIMESTAMP on update CURRENT_TIMESTAMP
            + indices
                idx_version: index (version) type btree
                idx_activo: index (activo) type btree
            + keys
                #1: PK (id) (underlying index PRIMARY)
                version: AK (version)
        tipos_comprobante: table
            + columns
                id: int(11) NN auto_increment = 8
                codigo: varchar(10) NN
                nombre: varchar(100) NN
                prefijo_ncf: varchar(3)
                secuencia_desde: bigint(20)
                secuencia_hasta: bigint(20)
                secuencia_actual: bigint(20) default 1
                requiere_rnc: tinyint(1) default 0
                requiere_razon_social: tinyint(1) default 0
                genera_credito_fiscal: tinyint(1) default 0
                activo: tinyint(1) default 1
            + keys
                #1: PK (id) (underlying index PRIMARY)
        tipos_documento: table
            + columns
                id: int(11) NN auto_increment = 4
                codigo: varchar(10) NN
                nombre: varchar(50) NN
                longitud_min: int(11) NN
                longitud_max: int(11) NN
                activo: tinyint(1) default 1
            + keys
                #1: PK (id) (underlying index PRIMARY)
        unidades_medida: table
            + columns
                id: int(11) NN auto_increment = 9
                codigo: varchar(10) NN
                nombre: varchar(50) NN
                abreviatura: varchar(10) NN
                activo: tinyint(1) default 1
            + keys
                #1: PK (id) (underlying index PRIMARY)
        usuarios: table
            + columns
                id: int(11) NN auto_increment = 45
                empresa_id: int(11)
                rol_id: int(11)
                nombre: varchar(100) NN
                cedula: varchar(20) NN
                email: varchar(100) NN
                avatar_url: varchar(255)
                password: varchar(255) NN
                tipo: enum('superadmin', 'admin', 'vendedor') NN
                activo: tinyint(1) default 1
                fecha_creacion: timestamp default CURRENT_TIMESTAMP
                fecha_actualizacion: timestamp default CURRENT_TIMESTAMP on update CURRENT_TIMESTAMP
            + indices
                idx_empresa: index (empresa_id) type btree
                rol_id: index (rol_id) type btree
                idx_cedula: index (cedula) type btree
                idx_email: index (email) type btree
                idx_tipo: index (tipo) type btree
                idx_activo: index (activo) type btree
            + keys
                #1: PK (id) (underlying index PRIMARY)
            + foreign-keys
                usuarios_ibfk_1: foreign key (empresa_id) -> empresas (id) d:cascade
                usuarios_ibfk_2: foreign key (rol_id) -> roles (id) d:set_null
        usuarios_terminos: table
            --  Registro de aceptación de términos por usuario
            + columns
                id: int(11) NN auto_increment = 4
                usuario_id: int(11) NN
                terminos_id: int(11) NN
                aceptado_en: timestamp default CURRENT_TIMESTAMP
                ip_address: varchar(45)
                user_agent: text
            + indices
                idx_usuario_terminos: index (usuario_id, terminos_id) type btree
                idx_usuario: index (usuario_id) type btree
                idx_terminos: index (terminos_id) type btree
            + keys
                #1: PK (id) (underlying index PRIMARY)
                unique_user_terms: AK (usuario_id, terminos_id)
            + foreign-keys
                usuarios_terminos_ibfk_1: foreign key (usuario_id) -> usuarios (id) d:cascade
                usuarios_terminos_ibfk_2: foreign key (terminos_id) -> terminos_condiciones (id) d:cascade
        venta_extras: table
            + columns
                id: bigint(20) NN auto_increment = 20
                venta_id: int(11) NN
                empresa_id: int(11) NN
                usuario_id: int(11)
                tipo: varchar(50)
                nombre: varchar(255) NN
                cantidad: decimal(10,2) NN default 1.00
                precio_unitario: decimal(14,2) NN
                aplica_itbis: tinyint(1) default 1
                impuesto_porcentaje: decimal(5,2) NN
                monto_base: decimal(14,2) NN
                monto_impuesto: decimal(14,2) NN
                monto_total: decimal(14,2) NN
                notas: text
                fecha_creacion: timestamp default CURRENT_TIMESTAMP
            + indices
                idx_venta: index (venta_id) type btree
                idx_empresa: index (empresa_id) type btree
                usuario_id: index (usuario_id) type btree
                idx_tipo: index (tipo) type btree
                idx_fecha: index (fecha_creacion) type btree
            + keys
                #1: PK (id) (underlying index PRIMARY)
            + foreign-keys
                venta_extras_ibfk_1: foreign key (venta_id) -> ventas (id) d:cascade
                venta_extras_ibfk_2: foreign key (empresa_id) -> empresas (id) d:cascade
                venta_extras_ibfk_3: foreign key (usuario_id) -> usuarios (id) d:set_null
        ventas: table
            + columns
                id: int(11) NN auto_increment = 110
                empresa_id: int(11) NN
                tipo_comprobante_id: int(11) NN
                ncf: varchar(19) NN
                numero_interno: varchar(20) NN
                usuario_id: int(11) NN
                caja_id: int(11)
                cliente_id: int(11)
                subtotal: decimal(10,2) NN
                descuento: decimal(10,2) default 0.00
                monto_gravado: decimal(10,2) NN
                itbis: decimal(10,2) default 0.00
                total: decimal(10,2) NN
                metodo_pago: enum('efectivo', 'tarjeta_debito', 'tarjeta_credito', 'transferencia', 'cheque', 'mixto') NN
                tipo_entrega: enum('completa', 'parcial') default 'completa'
                despacho_completo: tinyint(1) default 1
                efectivo_recibido: decimal(10,2)
                cambio: decimal(10,2)
                estado: enum('emitida', 'anulada', 'pendiente') default 'emitida'
                razon_anulacion: text
                ncf_modificado: varchar(19)
                tipo_ingreso: enum('01', '02', '03', '04') default '01'
                tipo_operacion: varchar(2) default '1'
                fecha_envio_dgii: timestamp
                estado_dgii: enum('enviado', 'aceptado', 'rechazado', 'no_enviado') default 'no_enviado'
                notas: text
                fecha_venta: timestamp default CURRENT_TIMESTAMP
            + indices
                idx_empresa: index (empresa_id) type btree
                idx_comprobante: index (tipo_comprobante_id) type btree
                idx_ncf: index (ncf) type btree
                idx_numero_interno: index (numero_interno) type btree
                idx_usuario: index (usuario_id) type btree
                idx_caja: index (caja_id) type btree
                cliente_id: index (cliente_id) type btree
                idx_estado: index (estado) type btree
                idx_fecha: index (fecha_venta) type btree
            + keys
                #1: PK (id) (underlying index PRIMARY)
            + foreign-keys
                ventas_ibfk_1: foreign key (empresa_id) -> empresas (id) d:cascade
                ventas_ibfk_2: foreign key (tipo_comprobante_id) -> tipos_comprobante (id)
                ventas_ibfk_3: foreign key (usuario_id) -> usuarios (id)
                ventas_ibfk_5: foreign key (caja_id) -> cajas (id) d:set_null
                ventas_ibfk_4: foreign key (cliente_id) -> clientes (id) d:set_null
    + views
        v_aging_cartera: view definer root@localhost
            + columns
                empresa_id: int(11) NN
                cliente_id: int(11) NN
                corriente: decimal(34,2)
                dias_1_7: decimal(34,2)
                dias_8_15: decimal(34,2)
                dias_16_30: decimal(34,2)
                mas_30_dias: decimal(34,2)
                total_pendiente: decimal(34,2)
        v_resumen_cartera_cliente: view definer root@localhost
            + columns
                credito_id: bigint(20) NN
                empresa_id: int(11) NN
                cliente_id: int(11) NN
                cliente_nombre: varchar(150) NN
                numero_documento: varchar(20) NN
                limite_credito: decimal(12,2) NN
                    --  Monto máximo autorizado para crédito
                saldo_utilizado: decimal(12,2) NN
                    --  Monto actualmente en uso
                saldo_disponible: decimal(12,2)
                    --  Crédito disponible (calculado automáticamente)
                estado_credito: enum('normal', 'atrasado', 'bloqueado', 'suspendido') NN
                clasificacion: enum('A', 'B', 'C', 'D')
                    --  A=Excelente, B=Bueno, C=Regular, D=Moroso
                score_crediticio: int(11)
                    --  Puntaje de 0-100, calculado automáticamente
                total_deudas_activas: bigint(21) NN
                deudas_vencidas: decimal(23)
                monto_vencido: decimal(34,2)
                dias_atraso_maximo: int(11)
                    --  Días de atraso calculados por trigger o proceso automático
                fecha_proximo_vencimiento: date
                    --  Próxima fecha de pago esperada
                fecha_ultima_evaluacion: timestamp
                    --  Última vez que se recalculó la clasificación
    + routines
        obtener_terminos_activos(): procedure definer root@localhost
        registrar_aceptacion_terminos(int(11),int(11),varchar(45),text): procedure definer root@localhost
            + arguments
                p_usuario_id: in int(11)
                p_terminos_id: in int(11)
                p_ip: in varchar(45)
                p_user_agent: in text
        sp_evaluar_clasificacion_cliente(bigint(20)): procedure definer root@localhost
            + arguments
                p_credito_cliente_id: in bigint(20)
        usuario_acepto_terminos_actuales(int(11)): function definer root@localhost
            . properties
                deterministic +
            + arguments
                #1: return tinyint(1)
                p_usuario_id: in int(11)
