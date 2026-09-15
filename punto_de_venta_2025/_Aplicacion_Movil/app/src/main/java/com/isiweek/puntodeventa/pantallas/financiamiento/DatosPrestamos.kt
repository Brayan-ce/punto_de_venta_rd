package com.isiweek.puntodeventa.pantallas.financiamiento

import com.isiweek.puntodeventa.offline.RepositorioOffline

/**
 * Datos en memoria que replican la web de /admin/contratos.
 * Fuente única para listar / nuevo / editar / imprimir.
 * El Ver (id 1-14 y 343) sigue resolviéndose por obtenerContratoVer del
 * VerContratoFinanciamientoPantalla; los nuevos contratos se registran aquí.
 */

internal data class ContratoLista(
    val id: Int,
    val numero: String,
    val clienteNombre: String,
    val clienteApellidos: String,
    val documento: String,
    val fechaInicio: String,
    val plan: String,
    val financiado: String,
    val cuota: String,
    val saldo: String,
    val estado: String,
    val cuotasVencidas: Int,
    val cuotasPendientes: Int,
    val categoriaId: Int?
)

internal data class CategoriaFin(
    val id: Int,
    val nombre: String,
    val color: String,
    val descripcion: String,
    val totalContratos: Int
)

internal data class ClienteFin(
    val id: Int,
    val nombre: String,
    val apellidos: String,
    val documento: String,
    val telefono: String,
    val email: String,
    val direccion: String,
    val tipoDocumentoId: Int = 1,
    val sector: String = "",
    val municipio: String = "",
    val provincia: String = "",
    val fechaNacimiento: String = ""
)

internal data class OpcionPlan(val meses: Int)

internal data class PlanFin(
    val id: Int,
    val nombre: String,
    val codigo: String,
    val tasaInteres: Double,
    val frecuencia: String,
    val moraPct: Double,
    val requiereFiador: Boolean,
    val descripcion: String,
    val opciones: List<OpcionPlan>
)

/** Categorías: del JSON importado si existe, vacío si no. */
internal fun obtenerCategoriasFinPantalla(): List<CategoriaFin> {
    if (!RepositorioOffline.hayDatosOffline()) {
        return emptyList()
    }
    return RepositorioOffline.obtenerCategoriasFin().map { c ->
        CategoriaFin(
            id = c.id,
            nombre = c.nombre,
            color = c.color,
            descripcion = c.descripcion,
            totalContratos = RepositorioOffline.obtenerTabla("fin_contrato_categorias").let { arr ->
                var n = 0
                for (i in 0 until arr.length()) {
                    val o = arr.optJSONObject(i) ?: continue
                    if (o.optInt("categoria_id") == c.id) n++
                }
                n
            }
        )
    }
}

/** Planes (modelo PlanFin) desde el JSON importado si existe, vacío si no. */
internal fun obtenerPlanesFinPantalla(): List<PlanFin> {
    if (!RepositorioOffline.hayDatosOffline()) {
        return emptyList()
    }
    return RepositorioOffline.obtenerPlanes().map { p ->
        PlanFin(
            id = p.id,
            nombre = p.nombre,
            codigo = p.codigo,
            tasaInteres = p.tasaInteres,
            frecuencia = p.frecuencia,
            moraPct = p.moraPct,
            requiereFiador = p.requiereFiador,
            descripcion = p.descripcion,
            opciones = emptyList()
        )
    }
}

private val contratosExtra = mutableListOf<ContratoVer>()

internal fun obtenerContratosFin(): List<ContratoLista> = obtenerContratosPantalla()

internal fun obtenerContratosFinExtra(): List<ContratoVer> = contratosExtra.toList()

internal fun registrarContratoVerExtra(c: ContratoVer) {
    contratosExtra.add(c)
}

internal fun obtenerContratoVerCompartido(id: Int): ContratoVer? =
    contratosExtra.firstOrNull { it.id == id }

internal fun fmtMontoFin(v: Double): String {
    val entero = Math.round(v).toInt()
    val grupos = entero.toString().reversed().chunked(3).joinToString(",").reversed()
    return RepositorioOffline.simboloMoneda() + grupos
}