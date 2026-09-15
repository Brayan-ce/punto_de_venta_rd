package com.isiweek.puntodeventa.pantallas.financiamiento

import com.isiweek.puntodeventa.offline.RepositorioOffline

/**
 * Adaptadores entre los datos del RepositorioOffline (JSON importado) y los
 * modelos que usan las pantallas de financiamiento. Si no hay datos offline,
 * se devuelven listas vacías (sin datos de ejemplo).
 */

// ----------------------------------------------------------------------
// PLANES (fin_planes -> PlanItem)
// ----------------------------------------------------------------------

internal fun RepositorioOffline.PlanOffline.aPlanItem(): PlanItem = PlanItem(
    id = id,
    nombre = nombre,
    codigo = codigo,
    tasa = tasaInteres.toString(),
    frecuencia = frecuencia,
    mora = moraPct.toString(),
    diasGracia = diasGracia.toString(),
    activo = activo,
    opciones = emptyList(),
    requiereFiador = requiereFiador,
    permiteAnticipado = permiteAnticipado,
    descripcion = descripcion
)

internal fun PlanItem.aPlanOffline(): RepositorioOffline.PlanOffline = RepositorioOffline.PlanOffline(
    id = id,
    nombre = nombre,
    frecuencia = frecuencia,
    codigo = codigo,
    descripcion = descripcion,
    moraPct = mora.toDoubleOrNull() ?: 0.0,
    tasaInteres = tasa.toDoubleOrNull() ?: 0.0,
    diasGracia = diasGracia.toIntOrNull() ?: 0,
    descuentoAnticipadoPct = 0.0,
    montoMinimo = 0.0,
    montoMaximo = 0.0,
    requiereFiador = requiereFiador,
    permiteAnticipado = permiteAnticipado,
    activo = activo
)

/** Planes para las pantallas: del JSON si existe, vacío si no. */
internal fun obtenerPlanesPantalla(): List<PlanItem> {
    return if (RepositorioOffline.hayDatosOffline()) {
        RepositorioOffline.obtenerPlanes().map { it.aPlanItem() }
    } else {
        emptyList()
    }
}

// ----------------------------------------------------------------------
// CLIENTES financiamiento (clientes -> ClienteFin)
// ----------------------------------------------------------------------

internal fun RepositorioOffline.ClienteOffline.aClienteFin(): ClienteFin = ClienteFin(
    id = id,
    nombre = nombre,
    apellidos = apellidos,
    documento = documento,
    telefono = telefono,
    email = email,
    direccion = direccion,
    tipoDocumentoId = tipoDocumentoId,
    sector = sector,
    municipio = municipio,
    provincia = provincia,
    fechaNacimiento = fechaNacimiento
)

internal fun ClienteFin.aClienteOffline(): RepositorioOffline.ClienteOffline = RepositorioOffline.ClienteOffline(
    id = id,
    nombre = nombre,
    apellidos = apellidos,
    documento = documento,
    telefono = telefono,
    email = email,
    direccion = direccion,
    cedula = documento,
    tipoDocumentoId = tipoDocumentoId,
    sector = sector,
    municipio = municipio,
    provincia = provincia,
    fechaNacimiento = fechaNacimiento
)

internal fun obtenerClientesFinPantalla(): List<ClienteFin> {
    return if (RepositorioOffline.hayDatosOffline()) {
        RepositorioOffline.obtenerClientesFin().map { it.aClienteFin() }
    } else {
        emptyList()
    }
}

// ----------------------------------------------------------------------
// CONTRATOS / PRÉSTAMOS (fin_contratos -> ContratoLista)
// ----------------------------------------------------------------------

internal fun RepositorioOffline.ContratoOffline.aContratoLista(
    clienteNombre: String,
    clienteApellidos: String,
    documento: String,
    nombrePlan: String,
    categoriaId: Int?
): ContratoLista = ContratoLista(
    id = id,
    numero = numero,
    clienteNombre = clienteNombre,
    clienteApellidos = clienteApellidos,
    documento = documento,
    fechaInicio = fechaInicio.take(10),
    plan = nombrePlan,
    financiado = RepositorioOffline.formatoMonto(montoFinanciado),
    cuota = RepositorioOffline.formatoMonto(cuotaMensual),
    saldo = RepositorioOffline.formatoMonto(saldoPendiente),
    estado = estado,
    cuotasVencidas = 0,
    cuotasPendientes = meses,
    categoriaId = categoriaId
)

/** Contratos para las pantallas: del JSON si existe, vacío si no. */
internal fun obtenerContratosPantalla(): List<ContratoLista> {
    if (!RepositorioOffline.hayDatosOffline()) {
        return emptyList()
    }
    val contratos = RepositorioOffline.obtenerContratos()
    val clientes = RepositorioOffline.obtenerClientesFin()
    val planes = RepositorioOffline.obtenerPlanes()
    val contratosCat = RepositorioOffline.obtenerTabla("fin_contrato_categorias")
    val catPorContrato = mutableMapOf<Int, Int?>()
    for (i in 0 until contratosCat.length()) {
        val o = contratosCat.optJSONObject(i) ?: continue
        catPorContrato[o.optInt("contrato_id")] = o.optInt("categoria_id").takeIf { it > 0 }
    }
    return contratos.map { c ->
        val cli = clientes.firstOrNull { it.id == c.clienteId }
        val plan = planes.firstOrNull { it.id == c.planId }
        c.aContratoLista(
            clienteNombre = cli?.nombre ?: "Cliente",
            clienteApellidos = cli?.apellidos ?: "",
            documento = cli?.documento ?: "",
            nombrePlan = plan?.nombre ?: "Plan",
            categoriaId = catPorContrato[c.id]
        )
    }
}
