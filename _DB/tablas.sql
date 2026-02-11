abonos_credito: table collate utf8mb4_0900_ai_ci
    --  Registro de pagos/abonos a cuentas por cobrar
    + columns
        id: bigint(20) NN auto_increment = 5
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
activos_productos: table
    --  Unidades físicas rastreables de productos
    + columns
        id: bigint(20) NN auto_increment = 17
        empresa_id: int(11) NN
        producto_id: int(11) NN
            --  Referencia al producto en catálogo
        codigo_activo: varchar(50)
            --  Código interno del activo (generado por el sistema)
        numero_serie: varchar(100) NN
            --  Número de serie, chasis o IMEI de la unidad física
        vin: varchar(50)
            --  VIN (Vehicle Identification Number) para vehículos
        numero_motor: varchar(100)
            --  Número de motor (para vehículos)
        numero_placa: varchar(20)
            --  Número de placa (si aplica)
        color: varchar(50)
        anio_fabricacion: int(11)
        especificaciones_tecnicas: json
        estado: enum('en_stock', 'vendido', 'financiado', 'asignado', 'devuelto', 'mantenimiento', 'dado_baja') NN default 'en_stock'
        fecha_compra: date
            --  Fecha en que se adquirió esta unidad
        precio_compra: decimal(12,2)
            --  Precio de compra de esta unidad específica
        fecha_venta: date
            --  Fecha en que se vendió esta unidad
        precio_venta: decimal(12,2)
            --  Precio de venta de esta unidad específica
        cliente_id: int(11)
            --  Cliente al que se asignó/vendió el activo
        contrato_financiamiento_id: int(11)
            --  Contrato de financiamiento asociado (si aplica)
        venta_id: int(11)
            --  Venta asociada (si fue vendido)
        fecha_fin_garantia: date
            --  Fecha de fin de garantía para esta unidad
        ubicacion: varchar(100)
            --  Ubicación actual del activo (bodega, tienda, cliente, etc.)
        codigo_qr: text
            --  Código QR generado para esta unidad
        documentos_json: json
            --  URLs de documentos (fotos, papeles, facturas de compra)
        fecha_ultimo_mantenimiento: date
        fecha_proximo_mantenimiento: date
        notas_mantenimiento: text
        observaciones: text
        creado_por: int(11) NN
        modificado_por: int(11)
        fecha_creacion: timestamp default CURRENT_TIMESTAMP
        fecha_actualizacion: timestamp default CURRENT_TIMESTAMP on update CURRENT_TIMESTAMP
    + indices
        idx_empresa_estado: index (empresa_id, estado) type btree
        idx_empresa: index (empresa_id) type btree
        idx_producto_estado: index (producto_id, estado) type btree
        idx_producto: index (producto_id) type btree
        idx_vin: index (vin) type btree
        idx_placa: index (numero_placa) type btree
        idx_estado: index (estado) type btree
        idx_fecha_compra: index (fecha_compra) type btree
        idx_fecha_venta: index (fecha_venta) type btree
        idx_cliente: index (cliente_id) type btree
        idx_contrato: index (contrato_financiamiento_id) type btree
        idx_venta: index (venta_id) type btree
        creado_por: index (creado_por) type btree
        modificado_por: index (modificado_por) type btree
    + keys
        #1: PK (id) (underlying index PRIMARY)
        codigo_activo: AK (codigo_activo)
        uk_codigo_activo: AK (codigo_activo)
        uk_numero_serie: AK (numero_serie, empresa_id)
    + foreign-keys
        activos_productos_ibfk_1: foreign key (empresa_id) -> empresas (id) d:cascade
        activos_productos_ibfk_2: foreign key (producto_id) -> productos (id)
        activos_productos_ibfk_3: foreign key (cliente_id) -> clientes (id) d:set_null
        activos_productos_ibfk_4: foreign key (contrato_financiamiento_id) -> contratos_financiamiento (id) d:set_null
        activos_productos_ibfk_5: foreign key (venta_id) -> ventas (id) d:set_null
        activos_productos_ibfk_6: foreign key (creado_por) -> usuarios (id)
        activos_productos_ibfk_7: foreign key (modificado_por) -> usuarios (id) d:set_null
alertas_cantidad_producto: table
    + columns
        id: int(11) NN auto_increment = 1
        empresa_id: int(11) NN
        producto_id: int(11) NN
        cantidad_minima_sugerida: decimal(10,3) default 0.001
            --  Cantidad mínima normal
        cantidad_maxima_sugerida: decimal(10,3) default 100.000
            --  Cantidad máxima normal
        cantidad_promedio: decimal(10,3) default 1.000
            --  Cantidad promedio histórica
        desviacion_alerta: decimal(5,2) default 2.00
            --  Factor de desviación para alertar (ej: 2.0 = 200%)
        activo: tinyint(1) default 1
        fecha_creacion: timestamp default CURRENT_TIMESTAMP
        fecha_actualizacion: timestamp default CURRENT_TIMESTAMP on update CURRENT_TIMESTAMP
    + indices
        idx_empresa: index (empresa_id) type btree
        idx_producto: index (producto_id) type btree
    + keys
        #1: PK (id) (underlying index PRIMARY)
        uk_alerta_producto: AK (empresa_id, producto_id)
    + foreign-keys
        alertas_cantidad_producto_ibfk_1: foreign key (empresa_id) -> empresas (id) d:cascade
        alertas_cantidad_producto_ibfk_2: foreign key (producto_id) -> productos (id) d:cascade
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
alertas_financiamiento: table
    --  Sistema de alertas y notificaciones para financiamientos
    + columns
        id: bigint(20) NN auto_increment = 1
        empresa_id: int(11) NN
        cliente_id: int(11) NN
        contrato_id: int(11)
        cuota_id: bigint(20)
        tipo_alerta: enum('vence_10_dias', 'vence_5_dias', 'vence_3_dias', 'vence_hoy', 'vencida', 'cliente_alto_riesgo', 'limite_excedido', 'clasificacion_bajo') NN
        origen_alerta: enum('sistema', 'usuario', 'regla') default 'sistema'
            --  Origen de la alerta (sistema automático, usuario manual, regla de negocio)
        severidad: enum('baja', 'media', 'alta', 'critica') default 'media'
        titulo: varchar(255) NN
        mensaje: text NN
        datos_contexto: json
            --  Datos adicionales
        estado: enum('activa', 'vista', 'resuelta', 'descartada') default 'activa'
        asignado_a: int(11)
            --  Usuario asignado (cobrador)
        fecha_asignacion: timestamp
        accion_realizada: text
        resuelta_por: int(11)
        fecha_resolucion: timestamp
        notificacion_enviada: tinyint(1) default 0
        canales_notificacion: json
            --  ["email", "whatsapp", "sms"]
        fecha_notificacion: timestamp
        fecha_creacion: timestamp default CURRENT_TIMESTAMP
        fecha_actualizacion: timestamp default CURRENT_TIMESTAMP on update CURRENT_TIMESTAMP
    + indices
        idx_empresa_severidad: index (empresa_id, severidad) type btree
        idx_empresa_estado: index (empresa_id, estado) type btree
        idx_empresa: index (empresa_id) type btree
        idx_cliente: index (cliente_id) type btree
        idx_contrato: index (contrato_id) type btree
        idx_cuota: index (cuota_id) type btree
        idx_tipo: index (tipo_alerta) type btree
        idx_origen: index (origen_alerta) type btree
        idx_severidad: index (severidad) type btree
        idx_estado: index (estado) type btree
        idx_asignado: index (asignado_a) type btree
        resuelta_por: index (resuelta_por) type btree
        idx_fecha_creacion: index (fecha_creacion) type btree
    + keys
        #1: PK (id) (underlying index PRIMARY)
    + foreign-keys
        alertas_financiamiento_ibfk_1: foreign key (empresa_id) -> empresas (id) d:cascade
        alertas_financiamiento_ibfk_2: foreign key (cliente_id) -> clientes (id) d:cascade
        alertas_financiamiento_ibfk_3: foreign key (contrato_id) -> contratos_financiamiento (id) d:cascade
        alertas_financiamiento_ibfk_4: foreign key (cuota_id) -> cuotas_financiamiento (id) d:cascade
        alertas_financiamiento_ibfk_5: foreign key (asignado_a) -> usuarios (id) d:set_null
        alertas_financiamiento_ibfk_6: foreign key (resuelta_por) -> usuarios (id) d:set_null
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
asignaciones_trabajadores: table
    + columns
        id: int(11) NN auto_increment = 2
        empresa_id: int(11) NN
        trabajador_id: int(11) NN
        tipo_destino: enum('obra', 'servicio') NN
        destino_id: int(11) NN
            --  ID de la obra o servicio
        fecha_asignacion: date NN
        hora_inicio: time
        hora_fin: time
        horas_trabajadas: decimal(5,2)
            --  Horas calculadas automáticamente
        actividad: varchar(255)
            --  Descripción de la actividad realizada
        zona_trabajo: varchar(100)
            --  Zona específica donde trabajó
        estado: enum('activo', 'finalizado', 'cancelado') default 'activo'
        costo_calculado: decimal(10,2)
            --  Costo = horas * tarifa
        creado_por: int(11) NN
        fecha_creacion: timestamp default CURRENT_TIMESTAMP
        fecha_actualizacion: timestamp default CURRENT_TIMESTAMP on update CURRENT_TIMESTAMP
    + indices
        idx_empresa: index (empresa_id) type btree
        idx_trabajador: index (trabajador_id) type btree
        idx_destino: index (tipo_destino, destino_id) type btree
        idx_fecha: index (fecha_asignacion) type btree
        idx_estado: index (estado) type btree
        creado_por: index (creado_por) type btree
    + keys
        #1: PK (id) (underlying index PRIMARY)
    + foreign-keys
        asignaciones_trabajadores_ibfk_1: foreign key (empresa_id) -> empresas (id) d:cascade
        asignaciones_trabajadores_ibfk_2: foreign key (trabajador_id) -> trabajadores_obra (id) d:cascade
        asignaciones_trabajadores_ibfk_3: foreign key (creado_por) -> usuarios (id)
auditoria_sistema: table
    --  Registro completo de auditoría del sistema para trazabilidad
    + columns
        id: bigint(20) NN auto_increment = 3
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
autorizaciones_credito: table collate utf8mb4_0900_ai_ci
    --  Autorizaciones excepcionales de crédito
    + columns
        id: bigint(20) NN auto_increment = 1
        cliente_id: int(11) NN
        empresa_id: int(11) NN
        credito_cliente_id: bigint(20)
        tipo_autorizacion: enum('exceso_limite', 'reactivacion_bloqueado', 'reduccion_plazo', 'extension_plazo', 'condonacion_deuda', 'otro') NN
        monto_autorizado: decimal(12,2)
            --  Si aplica
        limite_anterior: decimal(12,2)
        limite_nuevo: decimal(12,2)
        motivo: text NN
            --  Razón de la autorización
        condiciones: text
            --  Condiciones especiales de la autorización
        vigencia_hasta: date
            --  Si la autorización es temporal
        estado: enum('pendiente', 'aprobada', 'rechazada', 'vencida') NN default 'pendiente'
        fecha_aprobacion: timestamp
        fecha_rechazo: timestamp
        notas_decision: text
        solicitada_por: int(11) NN
        aprobada_por: int(11)
        fecha_solicitud: timestamp NN default CURRENT_TIMESTAMP
    + indices
        idx_cliente: index (cliente_id) type btree
        idx_empresa: index (empresa_id) type btree
        idx_credito: index (credito_cliente_id) type btree
        idx_tipo: index (tipo_autorizacion) type btree
        idx_estado: index (estado) type btree
        idx_fecha_solicitud: index (fecha_solicitud) type btree
    + keys
        #1: PK (id) (underlying index PRIMARY)
    + foreign-keys
        fk_autor_cliente: foreign key (cliente_id) -> clientes (id) d:cascade
        fk_autor_empresa: foreign key (empresa_id) -> empresas (id) d:cascade
        fk_autor_credito: foreign key (credito_cliente_id) -> credito_clientes (id) d:set_null
        fk_autor_solicitante: foreign key (solicitada_por) -> usuarios (id) d:cascade
        fk_autor_aprobador: foreign key (aprobada_por) -> usuarios (id) d:set_null
bitacora_diaria: table
    + columns
        id: int(11) NN auto_increment = 1
        empresa_id: int(11) NN
        tipo_destino: enum('obra', 'servicio') NN
        destino_id: int(11) NN
        fecha_bitacora: date NN
        zona_sitio: varchar(100)
            --  Zona específica de trabajo
        trabajo_realizado: text NN
            --  Descripción del trabajo realizado
        observaciones: text
            --  Observaciones adicionales
        condiciones_clima: varchar(100)
            --  Condiciones climáticas del día
        usuario_id: int(11) NN
            --  Usuario que registra la bitácora
        fecha_creacion: timestamp default CURRENT_TIMESTAMP
        fecha_actualizacion: timestamp default CURRENT_TIMESTAMP on update CURRENT_TIMESTAMP
    + indices
        idx_empresa_tipo: index (empresa_id, tipo_destino) type btree
        idx_empresa: index (empresa_id) type btree
        idx_destino: index (tipo_destino, destino_id) type btree
        idx_fecha: index (fecha_bitacora) type btree
        idx_fecha_bitacora: index (fecha_bitacora) type btree
        idx_usuario: index (usuario_id) type btree
    + keys
        #1: PK (id) (underlying index PRIMARY)
        uk_destino_fecha: AK (tipo_destino, destino_id, fecha_bitacora)
    + foreign-keys
        bitacora_diaria_ibfk_1: foreign key (empresa_id) -> empresas (id) d:cascade
        bitacora_diaria_ibfk_2: foreign key (usuario_id) -> usuarios (id)
bitacora_diaria_backup: table
    + columns
        id: int(11) NN default 0
        empresa_id: int(11) NN
        tipo_destino: enum('obra', 'servicio') NN
        destino_id: int(11) NN
        fecha_bitacora: date NN
        zona_sitio: varchar(100)
            --  Zona específica de trabajo
        trabajo_realizado: text NN
            --  Descripción del trabajo realizado
        observaciones: text
            --  Observaciones adicionales
        condiciones_clima: varchar(100)
            --  Condiciones climáticas del día
        usuario_id: int(11) NN
            --  Usuario que registra la bitácora
        fecha_creacion: timestamp default CURRENT_TIMESTAMP
        fecha_actualizacion: timestamp default CURRENT_TIMESTAMP on update CURRENT_TIMESTAMP
bitacora_fotos: table
    + columns
        id: int(11) NN auto_increment = 1
        bitacora_id: int(11) NN
        nombre_archivo: varchar(255) NN
        url_foto: varchar(500) NN
        tipo_mime: varchar(50)
        tamano_bytes: int(11)
        descripcion: varchar(255)
        orden: int(11) default 0
        fecha_creacion: timestamp default CURRENT_TIMESTAMP
    + indices
        idx_bitacora: index (bitacora_id) type btree
    + keys
        #1: PK (id) (underlying index PRIMARY)
    + foreign-keys
        bitacora_fotos_ibfk_1: foreign key (bitacora_id) -> bitacora_diaria (id) d:cascade
bitacora_trabajadores: table
    + columns
        id: int(11) NN auto_increment = 1
        bitacora_id: int(11) NN
        trabajador_id: int(11) NN
        presente: tinyint(1) default 1
        observaciones: varchar(255)
    + indices
        idx_bitacora: index (bitacora_id) type btree
        idx_trabajador: index (trabajador_id) type btree
    + keys
        #1: PK (id) (underlying index PRIMARY)
        uk_bitacora_trabajador: AK (bitacora_id, trabajador_id)
    + foreign-keys
        bitacora_trabajadores_ibfk_1: foreign key (bitacora_id) -> bitacora_diaria (id) d:cascade
        bitacora_trabajadores_ibfk_2: foreign key (trabajador_id) -> trabajadores_obra (id) d:cascade
cajas: table
    + columns
        id: int(11) NN auto_increment = 94
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
        id: int(11) NN auto_increment = 1
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
        id: int(11) NN auto_increment = 71
        empresa_id: int(11) NN
        tipo_documento_id: int(11) NN
        numero_documento: varchar(20) NN
        nombre: varchar(150) NN
        apellidos: varchar(150)
        telefono: varchar(20)
        numero_whatsapp: varchar(20)
            --  Número de WhatsApp (puede diferir del teléfono)
        metodo_contacto_preferido: enum('telefono', 'whatsapp', 'email', 'sms') default 'whatsapp'
            --  Método de contacto preferido del cliente
        score_crediticio: int(11) default 100
            --  Score crediticio interno (0-100)
        clasificacion_credito: enum('A', 'B', 'C', 'D') default 'A'
            --  Clasificación crediticia
        email: varchar(100)
        foto_url: varchar(1000)
        direccion: text
        sector: varchar(100)
        municipio: varchar(100)
        provincia: varchar(100)
        ocupacion: varchar(100)
            --  Ocupación del cliente
        ingreso_mensual: decimal(12,2)
            --  Ingreso mensual declarado
        nombre_empleador: varchar(200)
            --  Nombre del empleador
        telefono_empleador: varchar(20)
            --  Teléfono del empleador
        anos_empleo: int(11)
            --  Años en el empleo
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
        idx_score_crediticio: index (score_crediticio) type btree
        idx_clasificacion: index (clasificacion_credito) type btree
        idx_clasificacion_credito: index (clasificacion_credito) type btree
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
compras_obra: table
    + columns
        id: int(11) NN auto_increment = 1
        empresa_id: int(11) NN
        tipo_destino: enum('obra', 'servicio', 'stock_general') NN
        destino_id: int(11)
            --  ID de obra o servicio (NULL si es stock_general)
        orden_trabajo_id: int(11)
        proveedor_id: int(11) NN
        numero_factura: varchar(100) NN
        tipo_comprobante: varchar(50)
        subtotal: decimal(14,2) NN
        impuesto: decimal(14,2) default 0.00
        total: decimal(14,2) NN
        forma_pago: enum('efectivo', 'tarjeta_debito', 'tarjeta_credito', 'transferencia', 'cheque', 'credito') NN
        tipo_compra: enum('planificada', 'imprevista') default 'planificada'
        estado: enum('registrada', 'validada', 'anulada') default 'registrada'
        fecha_compra: date NN
        notas: text
        usuario_id: int(11) NN
            --  Usuario que registró la compra
        fecha_creacion: timestamp default CURRENT_TIMESTAMP
        fecha_actualizacion: timestamp default CURRENT_TIMESTAMP on update CURRENT_TIMESTAMP
    + indices
        idx_empresa: index (empresa_id) type btree
        idx_destino: index (tipo_destino, destino_id) type btree
        idx_orden: index (orden_trabajo_id) type btree
        idx_proveedor: index (proveedor_id) type btree
        idx_tipo: index (tipo_compra) type btree
        idx_estado: index (estado) type btree
        idx_fecha: index (fecha_compra) type btree
        usuario_id: index (usuario_id) type btree
    + keys
        #1: PK (id) (underlying index PRIMARY)
    + foreign-keys
        compras_obra_ibfk_1: foreign key (empresa_id) -> empresas (id) d:cascade
        compras_obra_ibfk_2: foreign key (orden_trabajo_id) -> ordenes_trabajo (id) d:set_null
        compras_obra_ibfk_3: foreign key (proveedor_id) -> proveedores (id)
        compras_obra_ibfk_4: foreign key (usuario_id) -> usuarios (id)
compras_obra_archivos: table
    + columns
        id: int(11) NN auto_increment = 1
        compra_obra_id: int(11) NN
        nombre_archivo: varchar(255) NN
        url_archivo: varchar(500) NN
        tipo_mime: varchar(50)
        tamano_bytes: int(11)
        tipo_documento: enum('factura', 'recibo', 'conduce', 'otro') default 'factura'
        fecha_creacion: timestamp default CURRENT_TIMESTAMP
    + indices
        idx_compra: index (compra_obra_id) type btree
    + keys
        #1: PK (id) (underlying index PRIMARY)
    + foreign-keys
        compras_obra_archivos_ibfk_1: foreign key (compra_obra_id) -> compras_obra (id) d:cascade
compras_obra_detalle: table
    + columns
        id: int(11) NN auto_increment = 1
        compra_obra_id: int(11) NN
        material_nombre: varchar(255) NN
            --  Nombre del material
        material_descripcion: text
        unidad_medida: varchar(50)
            --  Ej: Unidad, Metro, Kilo
        cantidad: decimal(10,2) NN
        precio_unitario: decimal(10,2) NN
        subtotal: decimal(10,2) NN
        producto_id: int(11)
            --  Si el material existe en el catálogo
        categoria_material_id: int(11)
            --  Categoría del material para reportes
    + indices
        idx_compra: index (compra_obra_id) type btree
        idx_producto: index (producto_id) type btree
        idx_categoria: index (categoria_material_id) type btree
    + keys
        #1: PK (id) (underlying index PRIMARY)
    + foreign-keys
        compras_obra_detalle_ibfk_1: foreign key (compra_obra_id) -> compras_obra (id) d:cascade
        compras_obra_detalle_ibfk_2: foreign key (producto_id) -> productos (id) d:set_null
        compras_obra_detalle_fk_categoria: foreign key (categoria_material_id) -> materiales_categorias (id) d:set_null
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
conduces_obra: table
    + columns
        id: int(11) NN auto_increment = 1
        empresa_id: int(11) NN
        compra_obra_id: int(11) NN
            --  Compra asociada
        numero_conduce: varchar(50) NN
        tipo_destino: enum('obra', 'servicio') NN
        destino_id: int(11) NN
        fecha_conduce: date NN
        receptor_nombre: varchar(255)
            --  Nombre de quien recibe
        chofer: varchar(100)
        vehiculo: varchar(100)
        placa: varchar(20)
        estado: enum('emitido', 'en_transito', 'entregado', 'anulado') default 'emitido'
        observaciones: text
        firma_receptor: text
            --  Firma digital
        fecha_entrega: timestamp
        usuario_id: int(11) NN
        fecha_creacion: timestamp default CURRENT_TIMESTAMP
        fecha_actualizacion: timestamp default CURRENT_TIMESTAMP on update CURRENT_TIMESTAMP
    + indices
        idx_empresa: index (empresa_id) type btree
        idx_compra: index (compra_obra_id) type btree
        idx_destino: index (tipo_destino, destino_id) type btree
        idx_fecha: index (fecha_conduce) type btree
        idx_estado: index (estado) type btree
        usuario_id: index (usuario_id) type btree
    + keys
        #1: PK (id) (underlying index PRIMARY)
        uk_numero_empresa: AK (numero_conduce, empresa_id)
    + foreign-keys
        conduces_obra_ibfk_1: foreign key (empresa_id) -> empresas (id) d:cascade
        conduces_obra_ibfk_2: foreign key (compra_obra_id) -> compras_obra (id)
        conduces_obra_ibfk_3: foreign key (usuario_id) -> usuarios (id)
conduces_obra_detalle: table
    + columns
        id: int(11) NN auto_increment = 1
        conduce_id: int(11) NN
        compra_detalle_id: int(11) NN
            --  Referencia al detalle de compra
        material_nombre: varchar(255) NN
        cantidad_despachada: decimal(10,2) NN
        unidad_medida: varchar(50)
    + indices
        idx_conduce: index (conduce_id) type btree
        idx_compra_detalle: index (compra_detalle_id) type btree
    + keys
        #1: PK (id) (underlying index PRIMARY)
    + foreign-keys
        conduces_obra_detalle_ibfk_1: foreign key (conduce_id) -> conduces_obra (id) d:cascade
        conduces_obra_detalle_ibfk_2: foreign key (compra_detalle_id) -> compras_obra_detalle (id)
configuracion_redondeo: table
    + columns
        id: int(11) NN auto_increment = 5
        empresa_id: int(11)
            --  NULL = configuración global
        tipo_dato: enum('cantidad', 'precio', 'factor', 'porcentaje') NN
        modo_redondeo: enum('HALF_UP', 'HALF_DOWN', 'CEIL', 'FLOOR', 'TRUNCATE') default 'HALF_UP'
        precision_decimales: int(11) default 2
            --  Número de decimales
        activo: tinyint(1) default 1
        fecha_creacion: timestamp default CURRENT_TIMESTAMP
        fecha_actualizacion: timestamp default CURRENT_TIMESTAMP on update CURRENT_TIMESTAMP
    + indices
        idx_empresa: index (empresa_id) type btree
    + keys
        #1: PK (id) (underlying index PRIMARY)
        uk_empresa_tipo: AK (empresa_id, tipo_dato)
    + foreign-keys
        configuracion_redondeo_ibfk_1: foreign key (empresa_id) -> empresas (id) d:cascade
contratos_financiamiento: table
    --  Contratos de financiamiento individuales por cliente
    + columns
        id: int(11) NN auto_increment = 5
        empresa_id: int(11) NN
        cliente_id: int(11) NN
        plan_id: int(11) NN
        plazo_id: int(11)
        usuario_id: int(11) NN
            --  Vendedor que creó el contrato
        numero_contrato: varchar(20) NN
            --  FIN-2025-00001
        numero_referencia: varchar(50)
            --  Número interno de la empresa
        venta_id: int(11)
            --  Venta asociada (NULL para contratos directos)
        ncf: varchar(19)
            --  NCF (opcional para contratos directos)
        precio_producto: decimal(14,2) NN
            --  Precio total del equipo
        pago_inicial: decimal(14,2) NN
            --  Inicial pagada
        monto_financiado: decimal(14,2) NN
            --  Monto financiado
        total_intereses: decimal(14,2) NN
            --  Total de intereses
        total_a_pagar: decimal(14,2) NN
            --  Total a pagar (financiado + intereses)
        numero_cuotas: int(11) NN
            --  Número de cuotas
        monto_cuota: decimal(14,2) NN
            --  Monto de cada cuota
        tasa_interes_mensual: decimal(5,4) NN
            --  Tasa mensual aplicada
        fecha_contrato: date NN
            --  Fecha de firma
        fecha_primer_pago: date NN
            --  Fecha de primera cuota
        fecha_ultimo_pago: date NN
            --  Fecha de última cuota
        monto_pagado: decimal(14,2) default 0.00
            --  Total pagado
        saldo_pendiente: decimal(14,2) NN
            --  Saldo pendiente
        cuotas_pagadas: int(11) default 0
            --  Cuotas pagadas
        cuotas_vencidas: int(11) default 0
            --  Cuotas vencidas
        estado: enum('activo', 'pagado', 'incumplido', 'reestructurado', 'cancelado') default 'activo'
        razon_estado: text
            --  Razón del estado
        clasificacion_riesgo: enum('bajo', 'medio', 'alto') default 'medio'
            --  Clasificación de riesgo del contrato
        nombre_fiador: varchar(200)
        documento_fiador: varchar(20)
        telefono_fiador: varchar(20)
        notas: text
        notas_internas: text
            --  Notas internas (no visibles al cliente)
        fecha_creacion: timestamp default CURRENT_TIMESTAMP
        fecha_actualizacion: timestamp default CURRENT_TIMESTAMP on update CURRENT_TIMESTAMP
        fecha_cancelacion: timestamp
        cancelado_por: int(11)
    + indices
        idx_empresa_estado: index (empresa_id, estado) type btree
        idx_empresa: index (empresa_id) type btree
        idx_cliente_estado: index (cliente_id, estado) type btree
        idx_cliente: index (cliente_id) type btree
        idx_plan: index (plan_id) type btree
        idx_plazo: index (plazo_id) type btree
        usuario_id: index (usuario_id) type btree
        idx_numero_contrato: index (numero_contrato) type btree
        idx_venta: index (venta_id) type btree
        idx_fecha_contrato: index (fecha_contrato) type btree
        idx_primer_pago: index (fecha_primer_pago) type btree
        idx_estado: index (estado) type btree
        idx_riesgo: index (clasificacion_riesgo) type btree
        cancelado_por: index (cancelado_por) type btree
    + keys
        #1: PK (id) (underlying index PRIMARY)
        numero_contrato: AK (numero_contrato)
    + foreign-keys
        contratos_financiamiento_ibfk_1: foreign key (empresa_id) -> empresas (id) d:cascade
        contratos_financiamiento_ibfk_2: foreign key (cliente_id) -> clientes (id)
        contratos_financiamiento_ibfk_3: foreign key (plan_id) -> planes_financiamiento (id)
        fk_contrato_plazo: foreign key (plazo_id) -> planes_plazos (id) d:set_null
        contratos_financiamiento_ibfk_4: foreign key (usuario_id) -> usuarios (id)
        contratos_financiamiento_ibfk_5: foreign key (venta_id) -> ventas (id)
        contratos_financiamiento_ibfk_6: foreign key (cancelado_por) -> usuarios (id) d:set_null
    + checks
        #1: check (`monto_financiado` > 0)
        #2: check (`monto_pagado` >= 0)
        #3: check (`numero_cuotas` > 0)
        #4: check (`pago_inicial` >= 0)
        #5: check (`saldo_pendiente` >= 0)
conversiones_unidad: table
    + columns
        id: int(11) NN auto_increment = 1
        empresa_id: int(11)
            --  NULL = conversión global
        unidad_origen_id: int(11) NN
        unidad_destino_id: int(11) NN
        factor: decimal(12,6) NN
            --  Factor de conversión: destino = origen * factor
        activo: tinyint(1) default 1
        fecha_creacion: timestamp default CURRENT_TIMESTAMP
        fecha_actualizacion: timestamp default CURRENT_TIMESTAMP on update CURRENT_TIMESTAMP
    + indices
        idx_empresa: index (empresa_id) type btree
        idx_origen: index (unidad_origen_id) type btree
        idx_destino: index (unidad_destino_id) type btree
        idx_activo: index (activo) type btree
    + keys
        #1: PK (id) (underlying index PRIMARY)
        uk_conversion: AK (unidad_origen_id, unidad_destino_id, empresa_id)
    + foreign-keys
        conversiones_unidad_ibfk_3: foreign key (empresa_id) -> empresas (id) d:cascade
        conversiones_unidad_ibfk_1: foreign key (unidad_origen_id) -> unidades_medida (id) d:cascade
        conversiones_unidad_ibfk_2: foreign key (unidad_destino_id) -> unidades_medida (id) d:cascade
cotizacion_adjuntos: table
    + columns
        id: int(11) NN auto_increment = 1
        cotizacion_id: int(11) NN
        usuario_id: int(11) NN
        nombre_archivo: varchar(255) NN
        ruta_archivo: varchar(500) NN
        tipo_archivo: varchar(50)
        tamano_bytes: bigint(20)
        descripcion: text
        fecha_subida: timestamp default CURRENT_TIMESTAMP
    + indices
        idx_cotizacion: index (cotizacion_id) type btree
        idx_usuario: index (usuario_id) type btree
        idx_tipo: index (tipo_archivo) type btree
    + keys
        #1: PK (id) (underlying index PRIMARY)
    + foreign-keys
        cotizacion_adjuntos_ibfk_1: foreign key (cotizacion_id) -> cotizaciones (id) d:cascade
        cotizacion_adjuntos_ibfk_2: foreign key (usuario_id) -> usuarios (id)
cotizacion_detalle: table
    + columns
        id: int(11) NN auto_increment = 6
        cotizacion_id: int(11) NN
        producto_id: int(11) NN
        nombre_producto: varchar(255) NN
        descripcion_producto: text
        codigo_barras: varchar(50)
        sku: varchar(50)
        cantidad: decimal(10,2) NN
        precio_unitario: decimal(10,2) NN
        descuento_linea: decimal(10,2) default 0.00
        subtotal: decimal(10,2) NN
        aplica_itbis: tinyint(1) default 1
        monto_gravado: decimal(10,2) NN
        itbis: decimal(10,2) default 0.00
        total: decimal(10,2) NN
        notas_linea: text
        created_at: timestamp default CURRENT_TIMESTAMP
    + indices
        idx_cotizacion: index (cotizacion_id) type btree
        idx_producto: index (producto_id) type btree
    + keys
        #1: PK (id) (underlying index PRIMARY)
    + foreign-keys
        cotizacion_detalle_ibfk_1: foreign key (cotizacion_id) -> cotizaciones (id) d:cascade
        cotizacion_detalle_ibfk_2: foreign key (producto_id) -> productos (id)
cotizacion_historial: table
    + columns
        id: int(11) NN auto_increment = 11
        cotizacion_id: int(11) NN
        usuario_id: int(11) NN
        accion: enum('creada', 'editada', 'estado_cambiado', 'producto_agregado', 'producto_eliminado', 'producto_modificado', 'enviada_cliente', 'convertida_venta', 'cancelada', 'version_creada', 'nota_agregada', 'adjunto_agregado') NN
        campo_modificado: varchar(100)
        valor_anterior: text
        valor_nuevo: text
        comentario: text
        fecha_accion: timestamp default CURRENT_TIMESTAMP
    + indices
        idx_cotizacion: index (cotizacion_id) type btree
        idx_usuario: index (usuario_id) type btree
        idx_accion: index (accion) type btree
        idx_fecha: index (fecha_accion) type btree
    + keys
        #1: PK (id) (underlying index PRIMARY)
    + foreign-keys
        cotizacion_historial_ibfk_1: foreign key (cotizacion_id) -> cotizaciones (id) d:cascade
        cotizacion_historial_ibfk_2: foreign key (usuario_id) -> usuarios (id)
cotizacion_notas: table
    + columns
        id: int(11) NN auto_increment = 1
        cotizacion_id: int(11) NN
        usuario_id: int(11) NN
        tipo: enum('nota', 'comentario', 'seguimiento') default 'nota'
        contenido: text NN
        es_privada: tinyint(1) default 0
        fecha_nota: timestamp default CURRENT_TIMESTAMP
    + indices
        idx_cotizacion: index (cotizacion_id) type btree
        idx_usuario: index (usuario_id) type btree
        idx_tipo: index (tipo) type btree
        idx_fecha: index (fecha_nota) type btree
    + keys
        #1: PK (id) (underlying index PRIMARY)
    + foreign-keys
        cotizacion_notas_ibfk_1: foreign key (cotizacion_id) -> cotizaciones (id) d:cascade
        cotizacion_notas_ibfk_2: foreign key (usuario_id) -> usuarios (id)
    + triggers
        trg_cotizacion_nota_agregada: trigger after row insert definer root@localhost
cotizacion_plantillas: table
    + columns
        id: int(11) NN auto_increment = 1
        empresa_id: int(11) NN
        usuario_id: int(11) NN
        nombre: varchar(200) NN
        descripcion: text
        cliente_id: int(11)
        dias_validez: int(11) default 15
        descuento_default: decimal(10,2) default 0.00
        observaciones_default: text
        productos_json: json NN
        activa: tinyint(1) default 1
        created_at: timestamp default CURRENT_TIMESTAMP
        updated_at: timestamp default CURRENT_TIMESTAMP on update CURRENT_TIMESTAMP
    + indices
        idx_empresa: index (empresa_id) type btree
        idx_usuario: index (usuario_id) type btree
        cliente_id: index (cliente_id) type btree
        idx_activa: index (activa) type btree
    + keys
        #1: PK (id) (underlying index PRIMARY)
    + foreign-keys
        cotizacion_plantillas_ibfk_1: foreign key (empresa_id) -> empresas (id) d:cascade
        cotizacion_plantillas_ibfk_2: foreign key (usuario_id) -> usuarios (id)
        cotizacion_plantillas_ibfk_3: foreign key (cliente_id) -> clientes (id) d:set_null
cotizacion_versiones: table
    + columns
        id: int(11) NN auto_increment = 1
        cotizacion_id: int(11) NN
        version_numero: int(11) NN
        usuario_id: int(11) NN
        estado_snapshot: varchar(50)
        total_snapshot: decimal(10,2)
        observaciones_snapshot: text
        detalle_json: json NN
        motivo_version: text
        fecha_version: timestamp default CURRENT_TIMESTAMP
    + indices
        idx_version: index (cotizacion_id, version_numero) type btree
        idx_cotizacion: index (cotizacion_id) type btree
        usuario_id: index (usuario_id) type btree
        idx_fecha: index (fecha_version) type btree
    + keys
        #1: PK (id) (underlying index PRIMARY)
        uk_cotizacion_version: AK (cotizacion_id, version_numero)
    + foreign-keys
        cotizacion_versiones_ibfk_1: foreign key (cotizacion_id) -> cotizaciones (id) d:cascade
        cotizacion_versiones_ibfk_2: foreign key (usuario_id) -> usuarios (id)
cotizaciones: table
    + columns
        id: int(11) NN auto_increment = 5
        empresa_id: int(11) NN
        cliente_id: int(11)
        usuario_id: int(11) NN
        numero_cotizacion: varchar(20) NN
        version_actual: int(11) default 1
        estado: enum('borrador', 'enviada', 'aprobada', 'convertida', 'vencida', 'anulada', 'rechazada') default 'borrador'
        subtotal: decimal(10,2) NN
        descuento: decimal(10,2) default 0.00
        monto_gravado: decimal(10,2) NN
        itbis: decimal(10,2) NN default 0.00
        total: decimal(10,2) NN
        fecha_emision: date NN
        fecha_vencimiento: date NN
        plantilla_id: int(11)
        oportunidad_id: int(11)
        probabilidad_cierre: decimal(5,2) default 50.00
        valor_estimado: decimal(10,2)
        observaciones: text
        notas_internas: text
        adjuntos_json: json
        venta_id: int(11)
        fecha_conversion: timestamp
        fecha_ultimo_seguimiento: timestamp
        created_at: timestamp default CURRENT_TIMESTAMP
        updated_at: timestamp default CURRENT_TIMESTAMP on update CURRENT_TIMESTAMP
    + indices
        idx_empresa: index (empresa_id) type btree
        idx_cliente: index (cliente_id) type btree
        idx_usuario: index (usuario_id) type btree
        idx_numero: index (numero_cotizacion) type btree
        idx_version: index (version_actual) type btree
        idx_estado: index (estado) type btree
        idx_fecha_emision: index (fecha_emision) type btree
        idx_fecha_vencimiento: index (fecha_vencimiento) type btree
        idx_plantilla: index (plantilla_id) type btree
        idx_oportunidad: index (oportunidad_id) type btree
        idx_probabilidad: index (probabilidad_cierre) type btree
        venta_id: index (venta_id) type btree
    + keys
        #1: PK (id) (underlying index PRIMARY)
        uk_numero_empresa: AK (numero_cotizacion, empresa_id)
    + foreign-keys
        cotizaciones_ibfk_1: foreign key (empresa_id) -> empresas (id) d:cascade
        cotizaciones_ibfk_2: foreign key (cliente_id) -> clientes (id) d:set_null
        cotizaciones_ibfk_3: foreign key (usuario_id) -> usuarios (id)
        cotizaciones_ibfk_4: foreign key (venta_id) -> ventas (id) d:set_null
    + triggers
        trg_cotizacion_creada: trigger after row insert definer root@localhost
        trg_cotizacion_estado_cambiado: trigger after row update definer root@localhost
credito_clientes: table collate utf8mb4_0900_ai_ci
    --  Configuración de crédito autorizado por cliente
    + columns
        id: bigint(20) NN auto_increment = 10
        cliente_id: int(11) NN
        empresa_id: int(11) NN
        limite_credito: decimal(12,2) NN default 0.00
            --  Monto máximo autorizado para crédito
        saldo_utilizado: decimal(12,2) NN default 0.00
            --  Monto actualmente en uso
        saldo_disponible: computed by default decimal(12,2) default (`limite_credito` - `saldo_utilizado`)
            --  Crédito disponible (calculado automáticamente)
        monto_financiado_total: decimal(12,2) default 0.00
            --  Total de monto actualmente financiado
        contratos_activos: int(11) default 0
            --  Contratos activos
        max_contratos_activos: int(11) default 3
            --  Máximo de contratos simultáneos permitidos
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
        idx_contratos_activos: index (contratos_activos) type btree
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
        trg_crear_evaluacion_auto: trigger after row update definer root@localhost
        trg_historial_cambio_clasificacion: trigger after row update definer root@localhost
cuentas_por_cobrar: table collate utf8mb4_0900_ai_ci
    --  Registro de deudas y cuentas por cobrar
    + columns
        id: bigint(20) NN auto_increment = 5
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
cuotas_financiamiento: table
    --  Cuotas individuales de cada contrato de financiamiento
    + columns
        id: bigint(20) NN auto_increment = 7
        contrato_id: int(11) NN
        empresa_id: int(11) NN
        cliente_id: int(11) NN
        numero_cuota: int(11) NN
            --  1, 2, 3...
        fecha_vencimiento: date NN
            --  Fecha de vencimiento
        fecha_fin_gracia: date NN
            --  Último día del período de gracia
        monto_capital: decimal(14,2) NN
            --  Capital de esta cuota
        monto_interes: decimal(14,2) NN
            --  Interés de esta cuota
        monto_cuota: decimal(14,2) NN
            --  Total de la cuota (capital + interés)
        saldo_restante: decimal(14,2) NN
            --  Saldo que queda después de pagar
        monto_pagado: decimal(14,2) default 0.00
            --  Monto pagado
        monto_mora: decimal(14,2) default 0.00
            --  Mora acumulada
        total_a_pagar: decimal(14,2) NN
            --  Total a pagar (cuota + mora)
        estado: enum('pendiente', 'pagada', 'parcial', 'vencida', 'condonada') default 'pendiente'
        dias_atraso: int(11) default 0
            --  Días de atraso
        fecha_pago: timestamp
            --  Fecha de pago completo
        fecha_ultimo_pago: timestamp
            --  Último pago parcial
        fecha_creacion: timestamp default CURRENT_TIMESTAMP
        fecha_actualizacion: timestamp default CURRENT_TIMESTAMP on update CURRENT_TIMESTAMP
    + indices
        idx_numero_cuota: index (contrato_id, numero_cuota) type btree
        idx_contrato_estado: index (contrato_id, estado) type btree
        idx_contrato: index (contrato_id) type btree
        idx_empresa_vencimiento: index (empresa_id, fecha_vencimiento) type btree
        idx_empresa_estado: index (empresa_id, estado) type btree
        idx_empresa: index (empresa_id) type btree
        idx_cliente: index (cliente_id) type btree
        idx_fecha_vencimiento: index (fecha_vencimiento) type btree
        idx_estado: index (estado) type btree
    + keys
        #1: PK (id) (underlying index PRIMARY)
        uk_contrato_cuota: AK (contrato_id, numero_cuota)
    + foreign-keys
        cuotas_financiamiento_ibfk_1: foreign key (contrato_id) -> contratos_financiamiento (id) d:cascade
        cuotas_financiamiento_ibfk_2: foreign key (empresa_id) -> empresas (id) d:cascade
        cuotas_financiamiento_ibfk_3: foreign key (cliente_id) -> clientes (id)
    + checks
        #1: check (`monto_capital` >= 0)
        #2: check (`monto_interes` >= 0)
        #3: check (`monto_mora` >= 0)
        #4: check (`monto_pagado` >= 0)
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
        cantidad_despachada: decimal(10,3) default 0.000
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
        id: int(11) NN auto_increment = 131
        venta_id: int(11) NN
        producto_id: int(11) NN
        cantidad: decimal(10,3) NN
        cantidad_despachada: decimal(10,3) default 0.000
        cantidad_pendiente: decimal(10,3) default 0.000
        precio_unitario: decimal(10,2) NN
        subtotal: decimal(10,2) NN
        descuento: decimal(10,2) default 0.00
        monto_gravado: decimal(10,2) NN
        itbis: decimal(10,2) default 0.00
        total: decimal(10,2) NN
        unidad_medida_id: int(11)
            --  Unidad usada en la venta
        cantidad_base: decimal(10,3)
            --  Cantidad convertida a unidad base
    + indices
        idx_venta: index (venta_id) type btree
        idx_producto: index (producto_id) type btree
        idx_unidad_medida: index (unidad_medida_id) type btree
    + keys
        #1: PK (id) (underlying index PRIMARY)
    + foreign-keys
        detalle_ventas_ibfk_1: foreign key (venta_id) -> ventas (id) d:cascade
        detalle_ventas_ibfk_2: foreign key (producto_id) -> productos (id) d:cascade
        detalle_ventas_ibfk_unidad_medida: foreign key (unidad_medida_id) -> unidades_medida (id) d:set_null
empresa_modulo_config: table
    --  Configuraciones específicas por módulo y empresa
    + columns
        id: int(11) NN auto_increment = 1
        empresa_modulo_id: int(11) NN
        clave: varchar(100) NN
            --  Clave de configuración
        valor: text
            --  Valor de la configuración (puede ser JSON)
        tipo: enum('string', 'number', 'boolean', 'json') default 'string'
            --  Tipo de dato del valor
        fecha_creacion: timestamp default CURRENT_TIMESTAMP
        fecha_actualizacion: timestamp default CURRENT_TIMESTAMP on update CURRENT_TIMESTAMP
    + indices
        idx_empresa_modulo: index (empresa_modulo_id) type btree
        idx_clave: index (clave) type btree
    + keys
        #1: PK (id) (underlying index PRIMARY)
        uk_empresa_modulo_clave: AK (empresa_modulo_id, clave)
    + foreign-keys
        empresa_modulo_config_ibfk_1: foreign key (empresa_modulo_id) -> empresa_modulos (id) d:cascade
empresa_modulos: table
    --  Relación de módulos habilitados por empresa
    + columns
        id: int(11) NN auto_increment = 71
        empresa_id: int(11) NN
        modulo_id: int(11) NN
        habilitado: tinyint(1) default 1
            --  Si el módulo está habilitado para esta empresa
        fecha_habilitacion: timestamp default CURRENT_TIMESTAMP
            --  Fecha en que se habilitó el módulo
        fecha_actualizacion: timestamp default CURRENT_TIMESTAMP on update CURRENT_TIMESTAMP
    + indices
        idx_empresa: index (empresa_id) type btree
        idx_modulo: index (modulo_id) type btree
        idx_habilitado: index (habilitado) type btree
    + keys
        #1: PK (id) (underlying index PRIMARY)
        uk_empresa_modulo: AK (empresa_id, modulo_id)
    + foreign-keys
        empresa_modulos_ibfk_1: foreign key (empresa_id) -> empresas (id) d:cascade
        empresa_modulos_ibfk_2: foreign key (modulo_id) -> modulos (id) d:cascade
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
        pais_id: int(11)
        region_id: int(11)
        telefono: varchar(20)
        email: varchar(100)
        moneda: varchar(3) default 'DOP'
        simbolo_moneda: varchar(5) default 'RD$'
        locale: varchar(10)
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
        idx_empresas_pais: index (pais_id) type btree
        idx_empresas_region: index (region_id) type btree
        idx_activo: index (activo) type btree
        idx_empresas_bloqueada: index (bloqueada) type btree
    + keys
        #1: PK (id) (underlying index PRIMARY)
    + foreign-keys
        fk_empresas_pais: foreign key (pais_id) -> paises (id) d:set_null
        fk_empresas_region: foreign key (region_id) -> regiones (id) d:set_null
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
evaluaciones_credito: table collate utf8mb4_0900_ai_ci
    --  Registro de evaluaciones crediticias realizadas a clientes
    + columns
        id: bigint(20) NN auto_increment = 1
        cliente_id: int(11) NN
        empresa_id: int(11) NN
        credito_cliente_id: bigint(20)
        tipo_evaluacion: enum('inicial', 'periodica', 'por_evento', 'manual') NN default 'periodica'
        score_anterior: int(11)
            --  Score antes de la evaluación
        score_nuevo: int(11) NN
            --  Score calculado en esta evaluación
        clasificacion_anterior: enum('A', 'B', 'C', 'D')
        clasificacion_nueva: enum('A', 'B', 'C', 'D') NN
        total_creditos_historicos: int(11) default 0
        creditos_pagados_tiempo: int(11) default 0
        creditos_pagados_tarde: int(11) default 0
        creditos_vencidos_actuales: int(11) default 0
        dias_atraso_promedio: decimal(5,2) default 0.00
        monto_deuda_actual: decimal(12,2) default 0.00
        porcentaje_uso_credito: decimal(5,2) default 0.00
            --  Porcentaje del límite utilizado
        resultado: enum('aprobado', 'observacion', 'rechazado', 'bloqueado') NN
        recomendaciones: text
            --  Recomendaciones automáticas del sistema
        notas: text
            --  Notas adicionales del evaluador
        evaluado_por: enum('sistema', 'usuario') NN default 'sistema'
        usuario_id: int(11)
            --  Si fue evaluación manual
        fecha_evaluacion: timestamp NN default CURRENT_TIMESTAMP
    + indices
        idx_cliente: index (cliente_id) type btree
        idx_empresa: index (empresa_id) type btree
        idx_credito: index (credito_cliente_id) type btree
        idx_tipo: index (tipo_evaluacion) type btree
        idx_resultado: index (resultado) type btree
        idx_fecha: index (fecha_evaluacion) type btree
    + keys
        #1: PK (id) (underlying index PRIMARY)
    + foreign-keys
        fk_eval_cliente: foreign key (cliente_id) -> clientes (id) d:cascade
        fk_eval_empresa: foreign key (empresa_id) -> empresas (id) d:cascade
        fk_eval_credito: foreign key (credito_cliente_id) -> credito_clientes (id) d:set_null
        fk_eval_usuario: foreign key (usuario_id) -> usuarios (id) d:set_null
    + checks
        chk_score_rango_eval: check (`score_nuevo` between 0 and 100)
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
        id: bigint(20) NN auto_increment = 24
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
historial_financiamiento: table
    --  Historial de cambios en contratos y cuotas de financiamiento
    + columns
        id: bigint(20) NN auto_increment = 1
        empresa_id: int(11) NN
        contrato_id: int(11) NN
        cuota_id: bigint(20)
        tipo_cambio: enum('contrato_creado', 'cuota_creada', 'pago_registrado', 'mora_calculada', 'estado_cambiado', 'cuota_modificada', 'contrato_modificado') NN
        campo_modificado: varchar(100)
        valor_anterior: text
        valor_nuevo: text
        usuario_id: int(11) NN
        fecha_cambio: timestamp default CURRENT_TIMESTAMP
        comentario: text
        ip_address: varchar(45)
    + indices
        idx_empresa: index (empresa_id) type btree
        idx_contrato: index (contrato_id) type btree
        idx_cuota: index (cuota_id) type btree
        idx_tipo_cambio: index (tipo_cambio) type btree
        idx_usuario: index (usuario_id) type btree
        idx_fecha_cambio: index (fecha_cambio) type btree
    + keys
        #1: PK (id) (underlying index PRIMARY)
    + foreign-keys
        historial_financiamiento_ibfk_1: foreign key (empresa_id) -> empresas (id) d:cascade
        historial_financiamiento_ibfk_2: foreign key (contrato_id) -> contratos_financiamiento (id) d:cascade
        historial_financiamiento_ibfk_3: foreign key (cuota_id) -> cuotas_financiamiento (id) d:set_null
        historial_financiamiento_ibfk_4: foreign key (usuario_id) -> usuarios (id)
historial_notificaciones: table
    --  Historial de notificaciones enviadas a clientes
    + columns
        id: bigint(20) NN auto_increment = 1
        empresa_id: int(11) NN
        cliente_id: int(11) NN
        contrato_id: int(11)
        cuota_id: bigint(20)
        plantilla_id: int(11)
        tipo_notificacion: varchar(50) NN
        canal: enum('email', 'whatsapp', 'sms', 'push') NN
        email_destinatario: varchar(255)
        telefono_destinatario: varchar(20)
        nombre_destinatario: varchar(255)
        asunto: varchar(255)
        cuerpo: text
        estado: enum('pendiente', 'enviado', 'entregado', 'fallido', 'rebotado') default 'pendiente'
        respuesta_proveedor: json
        mensaje_error: text
        fecha_envio: timestamp
        fecha_entrega: timestamp
        fecha_creacion: timestamp default CURRENT_TIMESTAMP
    + indices
        idx_empresa: index (empresa_id) type btree
        idx_cliente: index (cliente_id) type btree
        idx_contrato: index (contrato_id) type btree
        cuota_id: index (cuota_id) type btree
        plantilla_id: index (plantilla_id) type btree
        idx_canal: index (canal) type btree
        idx_estado: index (estado) type btree
        idx_fecha_envio: index (fecha_envio) type btree
        idx_fecha_creacion: index (fecha_creacion) type btree
    + keys
        #1: PK (id) (underlying index PRIMARY)
    + foreign-keys
        historial_notificaciones_ibfk_1: foreign key (empresa_id) -> empresas (id) d:cascade
        historial_notificaciones_ibfk_2: foreign key (cliente_id) -> clientes (id) d:cascade
        historial_notificaciones_ibfk_3: foreign key (contrato_id) -> contratos_financiamiento (id) d:set_null
        historial_notificaciones_ibfk_4: foreign key (cuota_id) -> cuotas_financiamiento (id) d:set_null
        historial_notificaciones_ibfk_5: foreign key (plantilla_id) -> plantillas_notificaciones (id) d:set_null
historial_unidades_venta: table
    + columns
        id: int(11) NN auto_increment = 1
        empresa_id: int(11) NN
        usuario_id: int(11) NN
        producto_id: int(11) NN
        unidad_medida_id: int(11) NN
        cantidad_promedio: decimal(10,3) default 0.000
            --  Promedio de cantidades vendidas
        veces_usada: int(11) default 1
            --  Cantidad de veces que se usó esta unidad
        ultima_fecha: timestamp default CURRENT_TIMESTAMP on update CURRENT_TIMESTAMP
    + indices
        idx_empresa: index (empresa_id) type btree
        idx_usuario: index (usuario_id) type btree
        idx_producto: index (producto_id) type btree
        unidad_medida_id: index (unidad_medida_id) type btree
    + keys
        #1: PK (id) (underlying index PRIMARY)
        uk_historial: AK (empresa_id, usuario_id, producto_id, unidad_medida_id)
    + foreign-keys
        historial_unidades_venta_ibfk_1: foreign key (empresa_id) -> empresas (id) d:cascade
        historial_unidades_venta_ibfk_2: foreign key (usuario_id) -> usuarios (id) d:cascade
        historial_unidades_venta_ibfk_3: foreign key (producto_id) -> productos (id) d:cascade
        historial_unidades_venta_ibfk_4: foreign key (unidad_medida_id) -> unidades_medida (id) d:cascade
isiweek_categorias: table
    + columns
        id: int(11) NN auto_increment = 5
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
        id: int(11) NN auto_increment = 2
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
materiales_catalogo: table
    --  Catálogo de materiales para autocompletado y sugerencias (no obligatorio)
    + columns
        id: int(11) NN auto_increment = 128
        empresa_id: int(11) NN
        codigo: varchar(50)
        nombre: varchar(255) NN
        descripcion: text
        categoria_id: int(11)
        unidad_medida_base: varchar(50) NN
            --  Unidad por defecto (saco, m³, kg, etc.)
        es_activo: tinyint(1) default 1
        fecha_creacion: timestamp default CURRENT_TIMESTAMP
        fecha_actualizacion: timestamp default CURRENT_TIMESTAMP on update CURRENT_TIMESTAMP
    + indices
        idx_empresa: index (empresa_id) type btree
        idx_codigo: index (codigo) type btree
        idx_nombre: index (nombre) type btree
        idx_categoria: index (categoria_id) type btree
        idx_activo: index (es_activo) type btree
    + keys
        #1: PK (id) (underlying index PRIMARY)
    + foreign-keys
        materiales_catalogo_ibfk_1: foreign key (empresa_id) -> empresas (id) d:cascade
        materiales_catalogo_ibfk_2: foreign key (categoria_id) -> materiales_categorias (id) d:set_null
materiales_categorias: table
    --  Categorías de materiales para organización
    + columns
        id: int(11) NN auto_increment = 28
        nombre: varchar(100) NN
        descripcion: text
        activo: tinyint(1) default 1
        fecha_creacion: timestamp default CURRENT_TIMESTAMP
    + indices
        idx_nombre: index (nombre) type btree
        idx_activo: index (activo) type btree
    + keys
        #1: PK (id) (underlying index PRIMARY)
materiales_precios: table
    --  Historial de precios de materiales por proveedor para sugerencias
    + columns
        id: int(11) NN auto_increment = 128
        material_id: int(11) NN
        proveedor_id: int(11) NN
        precio: decimal(10,2) NN
        moneda: varchar(10) default 'RD$'
        fecha_inicio: date
        fecha_fin: date
            --  NULL si es precio vigente
        fecha_creacion: timestamp default CURRENT_TIMESTAMP
    + indices
        idx_material_proveedor: index (material_id, proveedor_id) type btree
        idx_material: index (material_id) type btree
        idx_proveedor: index (proveedor_id) type btree
        idx_vigente: index (fecha_fin) type btree
    + keys
        #1: PK (id) (underlying index PRIMARY)
    + foreign-keys
        materiales_precios_ibfk_1: foreign key (material_id) -> materiales_catalogo (id) d:cascade
        materiales_precios_ibfk_2: foreign key (proveedor_id) -> proveedores (id) d:cascade
modulos: table
    --  Catálogo de módulos disponibles en el sistema
    + columns
        id: int(11) NN auto_increment = 13
        codigo: varchar(50) NN
            --  Código único del módulo: pos, credito, financiamiento, constructora, etc.
        nombre: varchar(100) NN
            --  Nombre descriptivo del módulo
        descripcion: text
            --  Descripción detallada del módulo
        categoria: enum('core', 'pos', 'financiamiento', 'constructora', 'credito', 'catalogo') NN default 'pos'
            --  Categoría del módulo
        icono: varchar(50)
            --  Nombre del icono de Ionicons para el menú
        ruta_base: varchar(100)
            --  Ruta base del módulo en el admin
        orden: int(11) default 0
            --  Orden de visualización en el menú
        siempre_habilitado: tinyint(1) default 0
            --  Si es TRUE, siempre está habilitado (ej: core)
        activo: tinyint(1) default 1
            --  Si el módulo está activo en el sistema
        fecha_creacion: timestamp default CURRENT_TIMESTAMP
        fecha_actualizacion: timestamp default CURRENT_TIMESTAMP on update CURRENT_TIMESTAMP
    + indices
        idx_codigo: index (codigo) type btree
        idx_categoria: index (categoria) type btree
        idx_orden: index (orden) type btree
        idx_activo: index (activo) type btree
    + keys
        #1: PK (id) (underlying index PRIMARY)
        codigo: AK (codigo)
monedas: table
    + columns
        id: int(11) NN auto_increment = 23
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
        uk_monedas_codigo: AK (codigo)
        uq_monedas_codigo: AK (codigo)
movimientos_inventario: table
    + columns
        id: int(11) NN auto_increment = 236
        empresa_id: int(11) NN
        producto_id: int(11) NN
        tipo: enum('entrada', 'salida', 'ajuste', 'devolucion', 'merma') NN
        cantidad: decimal(13,3) NN
        stock_anterior: decimal(13,3) NN
        stock_nuevo: decimal(13,3) NN
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
obra_documentos: table
    + columns
        id: int(11) NN auto_increment = 1
        obra_id: int(11) NN
        tipo: enum('contrato', 'presupuesto', 'plano', 'permiso', 'orden_trabajo', 'acta', 'factura', 'otro') default 'otro'
        nombre: varchar(255) NN
        descripcion: text
        ruta_archivo: varchar(500) NN
        extension: varchar(10)
        tamaño_kb: int(11)
        visible_cliente: tinyint(1) default 0
        subido_por: int(11) NN
        fecha_subida: timestamp default CURRENT_TIMESTAMP
    + indices
        idx_obra: index (obra_id) type btree
        idx_tipo: index (tipo) type btree
        subido_por: index (subido_por) type btree
    + keys
        #1: PK (id) (underlying index PRIMARY)
    + foreign-keys
        obra_documentos_ibfk_1: foreign key (obra_id) -> obras (id) d:cascade
        obra_documentos_ibfk_2: foreign key (subido_por) -> usuarios (id)
obra_imagenes: table
    + columns
        id: int(11) NN auto_increment = 1
        obra_id: int(11) NN
        categoria: enum('inicio', 'avance', 'problema', 'final', 'otro') default 'avance'
        descripcion: text
        ruta_imagen: varchar(500) NN
        fecha_toma: date
        subido_por: int(11) NN
        fecha_subida: timestamp default CURRENT_TIMESTAMP
    + indices
        idx_obra: index (obra_id) type btree
        idx_categoria: index (categoria) type btree
        subido_por: index (subido_por) type btree
    + keys
        #1: PK (id) (underlying index PRIMARY)
    + foreign-keys
        obra_imagenes_ibfk_1: foreign key (obra_id) -> obras (id) d:cascade
        obra_imagenes_ibfk_2: foreign key (subido_por) -> usuarios (id)
obras: table
    + columns
        id: int(11) NN auto_increment = 6
        empresa_id: int(11) NN
        proyecto_id: int(11)
            --  Proyecto al que pertenece (opcional)
        codigo_obra: varchar(50) NN
            --  Código único de la obra
        nombre: varchar(255) NN
        descripcion: text
        tipo_obra: enum('construccion', 'remodelacion', 'reparacion', 'mantenimiento', 'servicio', 'otro') default 'construccion'
            --  Tipo de obra: incluye servicio para auto-creación de obras contenedoras
        ubicacion: varchar(255) NN
            --  Dirección o ubicación de la obra
        zona: varchar(100)
            --  Zona o sector
        municipio: varchar(100)
        provincia: varchar(100)
        coordenadas_gps: varchar(100)
            --  Lat,Lng para geolocalización
        presupuesto_aprobado: decimal(14,2) NN default 0.00
        costo_mano_obra: decimal(14,2) default 0.00
        costo_materiales: decimal(14,2) default 0.00
        costo_servicios: decimal(14,2) default 0.00
        costo_imprevistos: decimal(14,2) default 0.00
        costo_total: decimal(14,2) default 0.00
        costo_ejecutado: decimal(14,2) default 0.00
        fecha_inicio: date NN
        fecha_fin_estimada: date NN
        fecha_fin_real: date
        estado: enum('planificacion', 'activa', 'suspendida', 'finalizada', 'cancelada') default 'activa'
        porcentaje_avance: decimal(5,2) default 0.00
            --  Porcentaje de avance de la obra
        cliente_id: int(11)
        usuario_responsable_id: int(11)
        max_trabajadores: int(11) default 50
            --  Máximo de trabajadores permitidos
        requiere_bitacora_diaria: tinyint(1) default 1
        creado_por: int(11) NN
        fecha_creacion: timestamp default CURRENT_TIMESTAMP
        fecha_actualizacion: timestamp default CURRENT_TIMESTAMP on update CURRENT_TIMESTAMP
    + indices
        idx_empresa: index (empresa_id) type btree
        idx_proyecto: index (proyecto_id) type btree
        idx_ubicacion: index (zona, municipio) type btree
        idx_fechas: index (fecha_inicio, fecha_fin_estimada) type btree
        idx_estado: index (estado) type btree
        idx_cliente: index (cliente_id) type btree
        idx_responsable: index (usuario_responsable_id) type btree
        creado_por: index (creado_por) type btree
    + keys
        #1: PK (id) (underlying index PRIMARY)
        uk_codigo_empresa: AK (codigo_obra, empresa_id)
    + foreign-keys
        obras_ibfk_1: foreign key (empresa_id) -> empresas (id) d:cascade
        obras_ibfk_2: foreign key (proyecto_id) -> proyectos (id) d:set_null
        obras_ibfk_3: foreign key (cliente_id) -> clientes (id) d:set_null
        obras_ibfk_4: foreign key (usuario_responsable_id) -> usuarios (id) d:set_null
        obras_ibfk_5: foreign key (creado_por) -> usuarios (id)
ordenes_trabajo: table
    + columns
        id: int(11) NN auto_increment = 1
        empresa_id: int(11) NN
        numero_orden: varchar(50) NN
        tipo_destino: enum('obra', 'servicio') NN
        destino_id: int(11) NN
        descripcion: text NN
        tipo_orden: enum('trabajo', 'compra', 'mixta') default 'mixta'
        autoriza_compra: tinyint(1) default 0
        monto_autorizado: decimal(14,2) default 0.00
        estado: enum('pendiente', 'aprobada', 'en_ejecucion', 'completada', 'cancelada') default 'pendiente'
        prioridad: enum('baja', 'media', 'alta', 'urgente') default 'media'
        fecha_emision: date NN
        fecha_vencimiento: date
        fecha_finalizacion: date
        emitida_por: int(11) NN
        asignada_a: int(11)
            --  Trabajador o usuario responsable
        aprobada_por: int(11)
        fecha_creacion: timestamp default CURRENT_TIMESTAMP
        fecha_actualizacion: timestamp default CURRENT_TIMESTAMP on update CURRENT_TIMESTAMP
    + indices
        idx_empresa: index (empresa_id) type btree
        idx_destino: index (tipo_destino, destino_id) type btree
        idx_tipo: index (tipo_orden) type btree
        idx_estado: index (estado) type btree
        idx_emitida_por: index (emitida_por) type btree
        asignada_a: index (asignada_a) type btree
        aprobada_por: index (aprobada_por) type btree
    + keys
        #1: PK (id) (underlying index PRIMARY)
        uk_numero_empresa: AK (numero_orden, empresa_id)
    + foreign-keys
        ordenes_trabajo_ibfk_1: foreign key (empresa_id) -> empresas (id) d:cascade
        ordenes_trabajo_ibfk_2: foreign key (emitida_por) -> usuarios (id)
        ordenes_trabajo_ibfk_3: foreign key (asignada_a) -> usuarios (id) d:set_null
        ordenes_trabajo_ibfk_4: foreign key (aprobada_por) -> usuarios (id) d:set_null
pagos_financiamiento: table
    --  Registro de pagos realizados a contratos de financiamiento
    + columns
        id: bigint(20) NN auto_increment = 1
        cuota_id: bigint(20) NN
        contrato_id: int(11) NN
        empresa_id: int(11) NN
        cliente_id: int(11) NN
        numero_recibo: varchar(20) NN
            --  REC-2025-00001
        monto_pago: decimal(14,2) NN
            --  Monto total del pago
        aplicado_mora: decimal(14,2) default 0.00
            --  Aplicado a mora
        aplicado_interes: decimal(14,2) default 0.00
            --  Aplicado a interés
        aplicado_capital: decimal(14,2) default 0.00
            --  Aplicado a capital
        aplicado_futuro: decimal(14,2) default 0.00
            --  Excedente para siguientes cuotas
        metodo_pago: enum('efectivo', 'tarjeta_debito', 'tarjeta_credito', 'transferencia', 'cheque', 'mixto') NN
        ultimos_digitos_tarjeta: varchar(4)
            --  Últimos 4 dígitos de tarjeta
        numero_referencia: varchar(100)
            --  Referencia de transferencia/cheque
        nombre_banco: varchar(100)
        origen_pago: enum('cliente', 'cobrador', 'sistema') default 'cliente'
            --  Origen del pago (cliente directo, cobrador, sistema automático)
        fecha_pago: date NN
            --  Fecha del pago
        registrado_por: int(11) NN
            --  Usuarios que registró
        caja_id: int(11)
            --  Caja donde se registró (si aplica)
        estado: enum('registrado', 'confirmado', 'revertido', 'rechazado') default 'registrado'
        fecha_reversion: timestamp
        revertido_por: int(11)
        razon_reversion: text
        notas: text
        fecha_creacion: timestamp default CURRENT_TIMESTAMP
        fecha_actualizacion: timestamp default CURRENT_TIMESTAMP on update CURRENT_TIMESTAMP
    + indices
        idx_cuota: index (cuota_id) type btree
        idx_contrato: index (contrato_id) type btree
        idx_empresa_fecha: index (empresa_id, fecha_pago) type btree
        idx_empresa_estado: index (empresa_id, estado) type btree
        idx_empresa: index (empresa_id) type btree
        idx_cliente: index (cliente_id) type btree
        idx_metodo_pago: index (metodo_pago) type btree
        idx_origen: index (origen_pago) type btree
        idx_fecha_pago: index (fecha_pago) type btree
        registrado_por: index (registrado_por) type btree
        idx_caja: index (caja_id) type btree
        idx_estado: index (estado) type btree
        revertido_por: index (revertido_por) type btree
    + keys
        #1: PK (id) (underlying index PRIMARY)
        numero_recibo: AK (numero_recibo)
    + foreign-keys
        pagos_financiamiento_ibfk_1: foreign key (cuota_id) -> cuotas_financiamiento (id)
        pagos_financiamiento_ibfk_2: foreign key (contrato_id) -> contratos_financiamiento (id)
        pagos_financiamiento_ibfk_3: foreign key (empresa_id) -> empresas (id) d:cascade
        pagos_financiamiento_ibfk_4: foreign key (cliente_id) -> clientes (id)
        pagos_financiamiento_ibfk_5: foreign key (registrado_por) -> usuarios (id)
        fk_pago_caja: foreign key (caja_id) -> cajas (id) d:set_null
        pagos_financiamiento_ibfk_7: foreign key (caja_id) -> cajas (id) d:set_null
        pagos_financiamiento_ibfk_6: foreign key (revertido_por) -> usuarios (id) d:set_null
    + checks
        #1: check (`aplicado_capital` >= 0)
        #2: check (`aplicado_futuro` >= 0)
        #3: check (`aplicado_interes` >= 0)
        #4: check (`aplicado_mora` >= 0)
        #5: check (`monto_pago` > 0)
paises: table
    + columns
        id: int(11) NN auto_increment = 21
        codigo_iso2: char(2) NN
        nombre: varchar(100) NN
        moneda_principal_codigo: varchar(3) NN
        locale_default: varchar(10) default 'es-DO'
        activo: tinyint(1) default 1
        fecha_creacion: timestamp default CURRENT_TIMESTAMP
    + indices
        idx_paises_activo: index (activo) type btree
    + keys
        #1: PK (id) (underlying index PRIMARY)
        uq_paises_codigo: AK (codigo_iso2)
    + foreign-keys
        fk_paises_moneda_principal: foreign key (moneda_principal_codigo) -> monedas[.uk_monedas_codigo] (codigo)
paises_monedas: table
    + columns
        pais_id: int(11) NN
        moneda_codigo: varchar(3) NN
        es_principal: tinyint(1) default 0
    + keys
        #1: PK (pais_id, moneda_codigo) (underlying index PRIMARY)
    + foreign-keys
        fk_paises_monedas_pais: foreign key (pais_id) -> paises (id) d:cascade
        fk_paises_monedas_moneda: foreign key (moneda_codigo) -> monedas[.uk_monedas_codigo] (codigo)
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
        id: int(11) NN auto_increment = 26
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
planes_financiamiento: table
    --  Planes de financiamiento disponibles para la empresa
    + columns
        id: int(11) NN auto_increment = 7
        empresa_id: int(11)
            --  NULL = plan global del superadmin
        codigo: varchar(20) NN
        nombre: varchar(100) NN
        descripcion: text
        plazo_meses: int(11)
            --  Deprecated: usar planes_plazos
        tasa_interes_anual: decimal(5,2)
            --  Deprecated: usar planes_plazos.tasa_anual_calculada
        tasa_interes_mensual: decimal(5,4)
            --  Deprecated: usar planes_plazos.tasa_mensual_calculada
        pago_inicial_minimo_pct: decimal(5,2)
            --  Deprecated: usar planes_plazos.pago_inicial_valor
        monto_minimo: decimal(12,2) default 0.00
            --  Monto mínimo financiable
        monto_maximo: decimal(12,2)
            --  Monto máximo financiable
        penalidad_mora_pct: decimal(5,2) NN default 5.00
            --  % mora mensual
        dias_gracia: int(11) NN default 5
            --  Días de gracia
        descuento_pago_anticipado_pct: decimal(5,2) default 0.00
            --  Descuento por pago anticipado
        cuotas_minimas_anticipadas: decimal(5,2) default 3.00
            --  Mínimo de cuotas para descuento
        activo: tinyint(1) default 1
        permite_pago_anticipado: tinyint(1) default 1
        requiere_fiador: tinyint(1) default 0
            --  Requiere fiador
        creado_por: int(11) NN
        modificado_por: int(11)
        fecha_creacion: timestamp default CURRENT_TIMESTAMP
        fecha_actualizacion: timestamp default CURRENT_TIMESTAMP on update CURRENT_TIMESTAMP
    + indices
        idx_empresa: index (empresa_id) type btree
        idx_codigo: index (codigo) type btree
        idx_plazo: index (plazo_meses) type btree
        idx_activo: index (activo) type btree
        creado_por: index (creado_por) type btree
        modificado_por: index (modificado_por) type btree
    + keys
        #1: PK (id) (underlying index PRIMARY)
        codigo: AK (codigo)
    + foreign-keys
        planes_financiamiento_ibfk_1: foreign key (empresa_id) -> empresas (id) d:cascade
        planes_financiamiento_ibfk_2: foreign key (creado_por) -> usuarios (id)
        planes_financiamiento_ibfk_3: foreign key (modificado_por) -> usuarios (id) d:set_null
    + checks
        #1: check ((`pago_inicial_minimo_pct` >= 0) and (`pago_inicial_minimo_pct` <= 100))
        #2: check ((`plazo_meses` > 0) and (`plazo_meses` <= 60))
        #3: check ((`tasa_interes_anual` > 0) and (`tasa_interes_anual` <= 100))
        #4: check (`penalidad_mora_pct` >= 0)
planes_plazos: table
    --  Opciones de plazo para cada plan de financiamiento
    + columns
        id: int(11) NN auto_increment = 1
        plan_id: int(11) NN
        plazo_meses: int(11) NN
        tipo_pago_inicial: enum('MONTO', 'PORCENTAJE') NN default 'PORCENTAJE'
        pago_inicial_valor: decimal(12,2) NN
        cuota_mensual: decimal(12,2)
        tasa_anual_calculada: decimal(5,2) NN
        tasa_mensual_calculada: decimal(5,4) NN
        es_sugerido: tinyint(1) default 0
            --  Plazo recomendado para mostrar primero
        activo: tinyint(1) default 1
        orden: int(11) default 0
            --  Orden de visualización
        creado_por: int(11) NN
        modificado_por: int(11)
        fecha_creacion: timestamp default CURRENT_TIMESTAMP
        fecha_actualizacion: timestamp default CURRENT_TIMESTAMP on update CURRENT_TIMESTAMP
    + indices
        idx_plan_activo: index (plan_id, activo) type btree
        idx_plan_orden: index (plan_id, orden) type btree
        idx_plazo: index (plazo_meses) type btree
        idx_sugerido: index (es_sugerido) type btree
        creado_por: index (creado_por) type btree
        modificado_por: index (modificado_por) type btree
    + keys
        #1: PK (id) (underlying index PRIMARY)
        uk_plan_plazo: AK (plan_id, plazo_meses)
    + foreign-keys
        planes_plazos_ibfk_1: foreign key (plan_id) -> planes_financiamiento (id) d:cascade
        planes_plazos_ibfk_2: foreign key (creado_por) -> usuarios (id)
        planes_plazos_ibfk_3: foreign key (modificado_por) -> usuarios (id) d:set_null
plantillas_compra_obra: table
    --  Plantillas de compra para acelerar el registro de compras repetitivas
    + columns
        id: int(11) NN auto_increment = 15
        empresa_id: int(11) NN
        nombre: varchar(150) NN
        descripcion: text
        tipo_destino: enum('obra', 'servicio') NN
            --  Tipo de destino para el cual aplica la plantilla
        es_activa: tinyint(1) default 1
        fecha_creacion: timestamp default CURRENT_TIMESTAMP
        fecha_actualizacion: timestamp default CURRENT_TIMESTAMP on update CURRENT_TIMESTAMP
    + indices
        idx_empresa: index (empresa_id) type btree
        idx_tipo_destino: index (tipo_destino) type btree
        idx_activa: index (es_activa) type btree
    + keys
        #1: PK (id) (underlying index PRIMARY)
    + foreign-keys
        plantillas_compra_obra_ibfk_1: foreign key (empresa_id) -> empresas (id) d:cascade
plantillas_compra_obra_detalle: table
    --  Detalle de materiales en plantillas de compra
    + columns
        id: int(11) NN auto_increment = 1
        plantilla_id: int(11) NN
        material_id: int(11) NN
            --  Referencia al catálogo de materiales
        unidad_medida: varchar(50)
        cantidad_referencial: decimal(10,2)
            --  Cantidad sugerida, editable por el usuario
        orden: int(11) default 0
    + indices
        idx_plantilla: index (plantilla_id) type btree
        idx_material: index (material_id) type btree
        idx_orden: index (orden) type btree
    + keys
        #1: PK (id) (underlying index PRIMARY)
    + foreign-keys
        plantillas_compra_obra_detalle_ibfk_1: foreign key (plantilla_id) -> plantillas_compra_obra (id) d:cascade
        plantillas_compra_obra_detalle_ibfk_2: foreign key (material_id) -> materiales_catalogo (id) d:cascade
plantillas_notificaciones: table
    --  Plantillas de notificaciones para comunicación con clientes
    + columns
        id: int(11) NN auto_increment = 1
        empresa_id: int(11)
            --  NULL = plantilla global
        codigo: varchar(50) NN
        nombre: varchar(100) NN
        descripcion: text
        tipo_notificacion: enum('recordatorio_pago', 'pago_recibido', 'pago_vencido', 'contrato_creado', 'contrato_completado', 'credito_aprobado', 'credito_denegado') NN
        canal: enum('email', 'whatsapp', 'sms', 'push') NN
        asunto: varchar(255)
            --  Para email
        cuerpo: text NN
            --  Contenido (puede incluir variables)
        variables_disponibles: json
        activa: tinyint(1) default 1
        creado_por: int(11) NN
        modificado_por: int(11)
        fecha_creacion: timestamp default CURRENT_TIMESTAMP
        fecha_actualizacion: timestamp default CURRENT_TIMESTAMP on update CURRENT_TIMESTAMP
    + indices
        idx_empresa: index (empresa_id) type btree
        idx_tipo: index (tipo_notificacion) type btree
        idx_canal: index (canal) type btree
        idx_activa: index (activa) type btree
        creado_por: index (creado_por) type btree
        modificado_por: index (modificado_por) type btree
    + keys
        #1: PK (id) (underlying index PRIMARY)
        uk_codigo_empresa: AK (codigo, empresa_id)
    + foreign-keys
        plantillas_notificaciones_ibfk_1: foreign key (empresa_id) -> empresas (id) d:cascade
        plantillas_notificaciones_ibfk_2: foreign key (creado_por) -> usuarios (id)
        plantillas_notificaciones_ibfk_3: foreign key (modificado_por) -> usuarios (id) d:set_null
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
presupuesto_alertas: table
    + columns
        id: int(11) NN auto_increment = 1
        empresa_id: int(11) NN
        tipo_destino: enum('proyecto', 'obra', 'servicio') NN
        destino_id: int(11) NN
        tipo_alerta: enum('umbral_70', 'umbral_90', 'excedido', 'proyeccion_sobrecosto') NN
        severidad: enum('informativa', 'preventiva', 'critica') default 'preventiva'
        presupuesto_total: decimal(14,2)
        costo_ejecutado: decimal(14,2)
        porcentaje_ejecutado: decimal(5,2)
        estado: enum('activa', 'revisada', 'resuelta') default 'activa'
        fecha_generacion: timestamp default CURRENT_TIMESTAMP
        revisada_por: int(11)
        fecha_revision: timestamp
    + indices
        idx_empresa: index (empresa_id) type btree
        idx_destino: index (tipo_destino, destino_id) type btree
        idx_tipo: index (tipo_alerta) type btree
        idx_estado: index (estado) type btree
        revisada_por: index (revisada_por) type btree
    + keys
        #1: PK (id) (underlying index PRIMARY)
    + foreign-keys
        presupuesto_alertas_ibfk_1: foreign key (empresa_id) -> empresas (id) d:cascade
        presupuesto_alertas_ibfk_2: foreign key (revisada_por) -> usuarios (id) d:set_null
productos: table
    + columns
        id: int(11) NN auto_increment = 287
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
        stock: decimal(13,3) NN default 0.000
        stock_minimo: decimal(13,3) default 5.000
        stock_maximo: decimal(13,3) default 100.000
        imagen_url: varchar(1000)
        aplica_itbis: tinyint(1) default 1
        activo: tinyint(1) default 1
        es_rastreable: tinyint(1) NN default 0
            --  Indica si el producto se controla por unidad física individual
        tipo_activo: enum('no_rastreable', 'vehiculo', 'electronico', 'electrodomestico', 'mueble', 'otro') NN default 'no_rastreable'
            --  Clasificación general del tipo de activo para reglas de negocio
        requiere_serie: tinyint(1) NN default 0
            --  Si cada unidad física debe tener número de serie, chasis o IMEI
        permite_financiamiento: tinyint(1) NN default 0
            --  Define si el producto puede venderse mediante financiamiento
        meses_max_financiamiento: int(11)
            --  Plazo máximo permitido para financiamiento de este producto
        meses_garantia: int(11) default 0
            --  Duración estándar de garantía del producto en meses
        tasa_depreciacion: decimal(5,2)
            --  Tasa anual de depreciación estimada del producto
        fecha_vencimiento: date
        lote: varchar(50)
        ubicacion_bodega: varchar(100)
        fecha_creacion: timestamp default CURRENT_TIMESTAMP
        fecha_actualizacion: timestamp default CURRENT_TIMESTAMP on update CURRENT_TIMESTAMP
        precio_por_unidad: decimal(12,2)
            --  Precio en unidad base
        permite_decimales: tinyint(1) default 0
        unidad_venta_default_id: int(11)
            --  Unidad por defecto en ventas
    + indices
        idx_empresa: index (empresa_id) type btree
        idx_codigo_barras: index (codigo_barras) type btree
        idx_sku: index (sku) type btree
        idx_nombre: index (nombre) type btree
        idx_categoria: index (categoria_id) type btree
        idx_marca: index (marca_id) type btree
        unidad_medida_id: index (unidad_medida_id) type btree
        idx_es_rastreable: index (es_rastreable) type btree
        idx_tipo_activo: index (tipo_activo) type btree
        idx_permite_financiamiento: index (permite_financiamiento) type btree
        idx_unidad_venta_default: index (unidad_venta_default_id) type btree
    + keys
        #1: PK (id) (underlying index PRIMARY)
    + foreign-keys
        productos_ibfk_1: foreign key (empresa_id) -> empresas (id) d:cascade
        productos_ibfk_2: foreign key (categoria_id) -> categorias (id) d:set_null
        productos_ibfk_3: foreign key (marca_id) -> marcas (id) d:set_null
        productos_ibfk_4: foreign key (unidad_medida_id) -> unidades_medida (id) d:set_null
        productos_ibfk_unidad_venta: foreign key (unidad_venta_default_id) -> unidades_medida (id) d:set_null
    + triggers
        trg_sincronizar_precio_venta_insert: trigger before row insert definer root@localhost
        trg_sincronizar_precio_venta: trigger before row update definer root@localhost
productos_catalogo: table
    + columns
        id: int(11) NN auto_increment = 6
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
proyectos: table
    + columns
        id: int(11) NN auto_increment = 1
        empresa_id: int(11) NN
        codigo_proyecto: varchar(50) NN
            --  Código único del proyecto
        nombre: varchar(255) NN
        descripcion: text
        cliente_id: int(11)
            --  Cliente asociado al proyecto
        ubicacion: text
            --  Ubicación general del proyecto
        presupuesto_total: decimal(14,2) NN default 0.00
        costo_ejecutado: decimal(14,2) default 0.00
        fecha_inicio: date NN
        fecha_fin_estimada: date NN
        fecha_fin_real: date
        estado: enum('planificacion', 'activo', 'suspendido', 'finalizado', 'cancelado') default 'planificacion'
        prioridad: enum('baja', 'media', 'alta', 'urgente') default 'media'
        usuario_responsable_id: int(11)
            --  Usuario responsable del proyecto
        creado_por: int(11) NN
        fecha_creacion: timestamp default CURRENT_TIMESTAMP
        fecha_actualizacion: timestamp default CURRENT_TIMESTAMP on update CURRENT_TIMESTAMP
    + indices
        idx_empresa: index (empresa_id) type btree
        idx_cliente: index (cliente_id) type btree
        idx_fechas: index (fecha_inicio, fecha_fin_estimada) type btree
        idx_estado: index (estado) type btree
        idx_responsable: index (usuario_responsable_id) type btree
        creado_por: index (creado_por) type btree
    + keys
        #1: PK (id) (underlying index PRIMARY)
        uk_codigo_empresa: AK (codigo_proyecto, empresa_id)
    + foreign-keys
        proyectos_ibfk_1: foreign key (empresa_id) -> empresas (id) d:cascade
        proyectos_ibfk_2: foreign key (cliente_id) -> clientes (id) d:set_null
        proyectos_ibfk_3: foreign key (usuario_responsable_id) -> usuarios (id) d:set_null
        proyectos_ibfk_4: foreign key (creado_por) -> usuarios (id)
referencias_crediticias: table collate utf8mb4_0900_ai_ci
    --  Referencias comerciales y crediticias de clientes
    + columns
        id: bigint(20) NN auto_increment = 1
        cliente_id: int(11) NN
        empresa_id: int(11) NN
        tipo_referencia: enum('comercial', 'bancaria', 'personal', 'otra') NN default 'comercial'
        nombre_referencia: varchar(255) NN
            --  Nombre del negocio/persona
        telefono: varchar(20)
        email: varchar(100)
        calificacion: enum('excelente', 'buena', 'regular', 'mala', 'no_verificada') default 'no_verificada'
        comentarios: text
        verificada: tinyint(1) NN default 0
        fecha_verificacion: timestamp
        verificada_por: int(11)
        creada_por: int(11) NN
        fecha_creacion: timestamp NN default CURRENT_TIMESTAMP
    + indices
        idx_cliente: index (cliente_id) type btree
        idx_empresa: index (empresa_id) type btree
        idx_tipo: index (tipo_referencia) type btree
        idx_calificacion: index (calificacion) type btree
    + keys
        #1: PK (id) (underlying index PRIMARY)
    + foreign-keys
        fk_ref_cliente: foreign key (cliente_id) -> clientes (id) d:cascade
        fk_ref_empresa: foreign key (empresa_id) -> empresas (id) d:cascade
        fk_ref_verificador: foreign key (verificada_por) -> usuarios (id) d:set_null
        fk_ref_creador: foreign key (creada_por) -> usuarios (id) d:cascade
regiones: table
    + columns
        id: int(11) NN auto_increment = 634
        pais_id: int(11) NN
        nombre: varchar(120) NN
        codigo: varchar(10)
        tipo: varchar(30) default 'region'
        activo: tinyint(1) default 1
        fecha_creacion: timestamp default CURRENT_TIMESTAMP
    + indices
        idx_regiones_pais: index (pais_id) type btree
        idx_regiones_activo: index (activo) type btree
    + keys
        #1: PK (id) (underlying index PRIMARY)
    + foreign-keys
        fk_regiones_pais: foreign key (pais_id) -> paises (id) d:cascade
reglas_credito: table collate utf8mb4_0900_ai_ci
    --  Reglas configurables de negocio para crédito
    + columns
        id: int(11) NN auto_increment = 38
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
        id: int(11) NN auto_increment = 3
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
        id: int(11) NN auto_increment = 40
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
servicios: table
    + columns
        id: int(11) NN auto_increment = 3
        empresa_id: int(11) NN
        proyecto_id: int(11)
            --  Proyecto asociado (opcional)
        obra_id: int(11)
            --  Obra dentro de la cual se ejecuta (opcional)
        servicio_plantilla_id: int(11)
            --  Plantilla desde la cual se creó el servicio
        codigo_servicio: varchar(50) NN
        nombre: varchar(255) NN
        descripcion: text
        notas_tecnicas: text
            --  Notas técnicas y especificaciones del servicio
        tipo_servicio: enum('electrico', 'plomeria', 'pintura', 'reparacion', 'instalacion', 'mantenimiento', 'otro') default 'otro'
        ubicacion: varchar(255) NN
        zona: varchar(100)
        costo_estimado: decimal(14,2) default 0.00
        costo_real: decimal(14,2) default 0.00
        presupuesto_asignado: decimal(14,2) default 0.00
            --  Presupuesto asignado al servicio
        fecha_solicitud: date NN
        fecha_programada: date
        fecha_inicio: date
            --  Fecha de inicio del servicio
        fecha_fin_estimada: date
            --  Fecha estimada de finalización
        fecha_ejecucion: date
        duracion_estimada_horas: decimal(5,2)
            --  Duración estimada en horas
        estado: enum('pendiente', 'programado', 'en_ejecucion', 'finalizado', 'cancelado') default 'pendiente'
        prioridad: enum('baja', 'media', 'alta', 'urgente') default 'media'
        cliente_id: int(11)
        usuario_responsable_id: int(11)
        creado_por: int(11) NN
        fecha_creacion: timestamp default CURRENT_TIMESTAMP
        fecha_actualizacion: timestamp default CURRENT_TIMESTAMP on update CURRENT_TIMESTAMP
    + indices
        idx_servicios_empresa_estado: index (empresa_id, estado) type btree
        idx_empresa: index (empresa_id) type btree
        idx_proyecto: index (proyecto_id) type btree
        idx_servicios_obra_fecha: index (obra_id, fecha_inicio) type btree
        idx_obra: index (obra_id) type btree
        idx_servicios_plantilla: index (servicio_plantilla_id) type btree
        idx_tipo: index (tipo_servicio) type btree
        idx_fechas: index (fecha_solicitud, fecha_programada) type btree
        idx_estado: index (estado) type btree
        idx_cliente: index (cliente_id) type btree
        usuario_responsable_id: index (usuario_responsable_id) type btree
        creado_por: index (creado_por) type btree
    + keys
        #1: PK (id) (underlying index PRIMARY)
        uk_codigo_empresa: AK (codigo_servicio, empresa_id)
    + foreign-keys
        servicios_ibfk_1: foreign key (empresa_id) -> empresas (id) d:cascade
        servicios_ibfk_2: foreign key (proyecto_id) -> proyectos (id) d:set_null
        servicios_ibfk_3: foreign key (obra_id) -> obras (id) d:set_null
        fk_servicio_plantilla: foreign key (servicio_plantilla_id) -> servicios_plantillas (id) d:set_null
        servicios_ibfk_4: foreign key (cliente_id) -> clientes (id) d:set_null
        servicios_ibfk_5: foreign key (usuario_responsable_id) -> usuarios (id) d:set_null
        servicios_ibfk_6: foreign key (creado_por) -> usuarios (id)
servicios_eventos: table
    + columns
        id: int(11) NN auto_increment = 1
        servicio_id: int(11) NN
        empresa_id: int(11) NN
        tipo_evento: enum('CREADO', 'PROGRAMADO', 'INICIADO', 'AVANCE', 'INCIDENCIA', 'PAUSADO', 'FINALIZADO', 'CANCELADO') NN
        descripcion: text
            --  Descripción del evento
        porcentaje_avance: decimal(5,2)
            --  Porcentaje de avance si aplica
        fecha_evento: timestamp default CURRENT_TIMESTAMP
            --  Fecha y hora del evento
        usuario_id: int(11) NN
            --  Usuario que registró el evento
        datos_adicionales: json
            --  Datos adicionales del evento en formato JSON
    + indices
        idx_servicio_fecha: index (servicio_id, fecha_evento) type btree
        idx_servicio: index (servicio_id) type btree
        idx_empresa: index (empresa_id) type btree
        idx_tipo: index (tipo_evento) type btree
        idx_fecha: index (fecha_evento) type btree
        idx_usuario: index (usuario_id) type btree
    + keys
        #1: PK (id) (underlying index PRIMARY)
    + foreign-keys
        servicios_eventos_ibfk_1: foreign key (servicio_id) -> servicios (id) d:cascade
        servicios_eventos_ibfk_2: foreign key (empresa_id) -> empresas (id) d:cascade
        servicios_eventos_ibfk_3: foreign key (usuario_id) -> usuarios (id)
servicios_plantillas: table
    + columns
        id: int(11) NN auto_increment = 2
        empresa_id: int(11) NN
        codigo_plantilla: varchar(50) NN
            --  Código único de la plantilla
        nombre: varchar(255) NN
            --  Nombre de la plantilla (ej: Instalación eléctrica)
        descripcion: text
            --  Descripción detallada de la plantilla
        tipo_servicio: enum('electrico', 'plomeria', 'pintura', 'reparacion', 'instalacion', 'mantenimiento', 'otro') NN
        duracion_estimada_dias: int(11) NN default 1
            --  Duración estimada en días
        costo_base_estimado: decimal(14,2) default 0.00
            --  Costo base estimado de la plantilla
        activa: tinyint(1) default 1
            --  1 = plantilla activa, 0 = desactivada
        creado_por: int(11) NN
        fecha_creacion: timestamp default CURRENT_TIMESTAMP
        fecha_actualizacion: timestamp default CURRENT_TIMESTAMP on update CURRENT_TIMESTAMP
    + indices
        idx_empresa: index (empresa_id) type btree
        idx_tipo: index (tipo_servicio) type btree
        idx_activa: index (activa) type btree
        creado_por: index (creado_por) type btree
    + keys
        #1: PK (id) (underlying index PRIMARY)
        uk_codigo_empresa: AK (codigo_plantilla, empresa_id)
    + foreign-keys
        servicios_plantillas_ibfk_1: foreign key (empresa_id) -> empresas (id) d:cascade
        servicios_plantillas_ibfk_2: foreign key (creado_por) -> usuarios (id)
servicios_plantillas_recursos: table
    + columns
        id: int(11) NN auto_increment = 2
        servicio_plantilla_id: int(11) NN
        tipo_recurso: enum('material', 'herramienta', 'equipo', 'personal') NN
        nombre: varchar(255) NN
            --  Nombre del recurso (ej: Cable eléctrico, Técnico electricista)
        descripcion: text
        cantidad_estimada: decimal(10,2) default 1.00
            --  Cantidad estimada del recurso
        unidad: varchar(50)
            --  Unidad de medida (ej: metros, unidades, horas)
        costo_unitario_estimado: decimal(10,2) default 0.00
        orden: int(11) default 0
            --  Orden de visualización
        fecha_creacion: timestamp default CURRENT_TIMESTAMP
    + indices
        idx_plantilla: index (servicio_plantilla_id) type btree
        idx_tipo: index (tipo_recurso) type btree
    + keys
        #1: PK (id) (underlying index PRIMARY)
    + foreign-keys
        servicios_plantillas_recursos_ibfk_1: foreign key (servicio_plantilla_id) -> servicios_plantillas (id) d:cascade
servicios_recursos: table
    + columns
        id: int(11) NN auto_increment = 1
        servicio_id: int(11) NN
        empresa_id: int(11) NN
        tipo_recurso: enum('material', 'herramienta', 'equipo', 'personal') NN
        nombre: varchar(255) NN
            --  Nombre del recurso utilizado
        descripcion: text
        cantidad_utilizada: decimal(10,2) NN default 0.00
        unidad: varchar(50)
            --  Unidad de medida
        costo_unitario: decimal(10,2) default 0.00
        costo_total: decimal(14,2) default 0.00
            --  costo_unitario * cantidad_utilizada
        producto_id: int(11)
            --  Si es un material del catálogo
        trabajador_id: int(11)
            --  Si es personal asignado
        registrado_por: int(11) NN
        fecha_registro: timestamp default CURRENT_TIMESTAMP
    + indices
        idx_servicio: index (servicio_id) type btree
        idx_empresa: index (empresa_id) type btree
        idx_tipo: index (tipo_recurso) type btree
        idx_producto: index (producto_id) type btree
        idx_trabajador: index (trabajador_id) type btree
        registrado_por: index (registrado_por) type btree
    + keys
        #1: PK (id) (underlying index PRIMARY)
    + foreign-keys
        servicios_recursos_ibfk_1: foreign key (servicio_id) -> servicios (id) d:cascade
        servicios_recursos_ibfk_2: foreign key (empresa_id) -> empresas (id) d:cascade
        servicios_recursos_ibfk_3: foreign key (producto_id) -> productos (id) d:set_null
        servicios_recursos_ibfk_4: foreign key (trabajador_id) -> trabajadores_obra (id) d:set_null
        servicios_recursos_ibfk_5: foreign key (registrado_por) -> usuarios (id)
settings: table
    + columns
        id: int(11) NN auto_increment = 257
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
        id: int(11) NN auto_increment = 3
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
        id: int(11) NN auto_increment = 24
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
trabajadores_obra: table
    + columns
        id: int(11) NN auto_increment = 2
        empresa_id: int(11) NN
        nombre: varchar(150) NN
        apellidos: varchar(150)
        tipo_documento_id: int(11) NN
        numero_documento: varchar(20) NN
        telefono: varchar(20)
        email: varchar(100)
        rol_especialidad: varchar(100) NN
            --  Ej: Electricista, Albañil, Ayudante
        tarifa_por_hora: decimal(10,2)
            --  Tarifa por hora de trabajo
        tarifa_por_dia: decimal(10,2)
            --  Tarifa por día de trabajo
        estado: enum('activo', 'inactivo', 'bloqueado') default 'activo'
        fecha_creacion: timestamp default CURRENT_TIMESTAMP
        fecha_actualizacion: timestamp default CURRENT_TIMESTAMP on update CURRENT_TIMESTAMP
    + indices
        idx_empresa: index (empresa_id) type btree
        idx_nombre: index (nombre) type btree
        idx_tipo_documento: index (tipo_documento_id) type btree
        idx_rol: index (rol_especialidad) type btree
        idx_estado: index (estado) type btree
    + keys
        #1: PK (id) (underlying index PRIMARY)
        uk_documento_empresa: AK (numero_documento, empresa_id)
    + foreign-keys
        trabajadores_obra_ibfk_1: foreign key (empresa_id) -> empresas (id) d:cascade
        trabajadores_obra_ibfk_2: foreign key (tipo_documento_id) -> tipos_documento (id)
unidades_medida: table
    + columns
        id: int(11) NN auto_increment = 9
        codigo: varchar(10) NN
        nombre: varchar(50) NN
        abreviatura: varchar(10) NN
        activo: tinyint(1) default 1
        permite_decimales: tinyint(1) default 1
        tipo_medida: enum('unidad', 'peso', 'volumen', 'longitud', 'area', 'otro') default 'unidad'
        es_base: tinyint(1) default 0
        empresa_id: int(11)
        factor_base: decimal(18,6) default 1.000000
    + indices
        idx_tipo_medida: index (tipo_medida) type btree
        idx_es_base: index (es_base) type btree
        idx_empresa: index (empresa_id) type btree
    + keys
        #1: PK (id) (underlying index PRIMARY)
unidades_preferidas_pais: table
    + columns
        id: int(11) NN auto_increment = 39
        pais_codigo: varchar(2) NN
            --  Código ISO del país (DO, US, PE, etc.)
        tipo_medida: enum('unidad', 'peso', 'volumen', 'longitud', 'area', 'otro') NN
        unidad_medida_id: int(11) NN
        prioridad: int(11) default 1
            --  Orden de preferencia (1 = más preferida)
        activo: tinyint(1) default 1
    + indices
        idx_pais: index (pais_codigo) type btree
        idx_tipo: index (tipo_medida) type btree
        unidad_medida_id: index (unidad_medida_id) type btree
    + keys
        #1: PK (id) (underlying index PRIMARY)
        uk_pais_tipo_prioridad: AK (pais_codigo, tipo_medida, prioridad)
    + foreign-keys
        unidades_preferidas_pais_ibfk_1: foreign key (unidad_medida_id) -> unidades_medida (id) d:cascade
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
        system_mode: enum('POS', 'OBRAS') default 'POS'
            --  Modo de operación del usuario: POS o OBRAS
    + indices
        idx_empresa: index (empresa_id) type btree
        rol_id: index (rol_id) type btree
        idx_cedula: index (cedula) type btree
        idx_email: index (email) type btree
        idx_tipo: index (tipo) type btree
        idx_activo: index (activo) type btree
        idx_usuarios_system_mode: index (system_mode) type btree
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
        id: bigint(20) NN auto_increment = 19
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
        id: int(11) NN auto_increment = 123
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
        tiene_financiamiento: tinyint(1) default 0
            --  Indica si la venta tiene un contrato de financiamiento asociado
        contrato_financiamiento_id: int(11)
            --  ID del contrato de financiamiento asociado
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
        idx_financiamiento: index (tiene_financiamiento, contrato_financiamiento_id) type btree
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
        fk_venta_contrato_financiamiento: foreign key (contrato_financiamiento_id) -> contratos_financiamiento (id) d:set_null
        ventas_ibfk_6: foreign key (contrato_financiamiento_id) -> contratos_financiamiento (id) d:set_null
