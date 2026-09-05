package com.isiweek.puntodeventa.offline

import android.content.Context
import android.util.Log
import com.isiweek.puntodeventa.pantallas.ticket.LineaTicket
import com.isiweek.puntodeventa.pantallas.ticket.TicketVenta
import org.json.JSONArray
import org.json.JSONObject
import java.io.File
import java.util.Calendar
/**
 * Repositorio offline del móvil.
 *
 * Lee el archivo JSON de base de datos importado (base_datos_offline.json) que se
 * guardó desde Configuración → Importar base de datos. Expone las tablas de
 * financiamiento y permite guardar cambios de vuelta al mismo archivo para que al
 * exportarlo ("Descargar JSON modificado") la web reciba los datos actualizados.
 *
 * Cualquier modificación se persiste en memoria y en el archivo JSON.
 */
object RepositorioOffline {

    private const val TAG = "RepositorioOffline"
    const val NOMBRE_ARCHIVO = "base_datos_offline.json"

    private var jsonRaiz: JSONObject? = null

    /** Versión de los datos cargados. Aumenta cada vez que se carga/sincroniza,
     *  para que las pantallas que la usan como clave de `remember` se refresquen. */
    var version: Int = 0
        private set

    private const val PREFS_SESION = "sesion_movil"
    private const val PREF_USUARIO = "usuario_json"
    private const val PREF_EMPRESA = "empresa_json"
    private const val PREF_CORREO = "correo"
    private const val PREF_PASSWORD = "password"
    private const val PREF_SESION_ACTIVA = "sesion_activa"

    /** Sesión online persistida (perfil de usuario + empresa + credenciales) para
     *  que no se pierda al navegar o cerrar la app. Solo se borra con
     *  "Limpiar datos del sistema". El correo/contraseña se guardan para poder
     *  validar la identidad al subir los cambios a la base de datos. */
    data class SesionGuardada(
        val usuario: JSONObject?,
        val empresa: JSONObject?,
        val correo: String,
        val password: String
    )

    fun guardarSesion(context: Context, usuario: JSONObject?, empresa: JSONObject?, correo: String = "", password: String = "") {
        try {
            val prefs = context.getSharedPreferences(PREFS_SESION, Context.MODE_PRIVATE)
            prefs.edit()
                .putString(PREF_USUARIO, usuario?.toString())
                .putString(PREF_EMPRESA, empresa?.toString())
                .putString(PREF_CORREO, correo)
                .putString(PREF_PASSWORD, password)
                .putBoolean(PREF_SESION_ACTIVA, true)
                .apply()
        } catch (e: Exception) {
            Log.e(TAG, "guardarSesion: error ${e.message}", e)
        }
    }

    fun cargarSesion(context: Context): SesionGuardada? {
        return try {
            val prefs = context.getSharedPreferences(PREFS_SESION, Context.MODE_PRIVATE)
            if (!prefs.getBoolean(PREF_SESION_ACTIVA, false)) return null
            val correo = prefs.getString(PREF_CORREO, "") ?: ""
            val password = prefs.getString(PREF_PASSWORD, "") ?: ""
            if (correo.isEmpty() && password.isEmpty()) return null
            SesionGuardada(
                prefs.getString(PREF_USUARIO, null)?.let { JSONObject(it) },
                prefs.getString(PREF_EMPRESA, null)?.let { JSONObject(it) },
                correo,
                password
            )
        } catch (e: Exception) {
            Log.e(TAG, "cargarSesion: error ${e.message}", e)
            null
        }
    }

    /** Guarda solo correo/contraseña para "Recuérdame" (conserva usuario/empresa ya guardados). */
    fun guardarCredenciales(context: Context, correo: String, password: String) {
        try {
            val prefs = context.getSharedPreferences(PREFS_SESION, Context.MODE_PRIVATE)
            prefs.edit()
                .putString(PREF_CORREO, correo)
                .putString(PREF_PASSWORD, password)
                .putBoolean(PREF_SESION_ACTIVA, true)
                .apply()
        } catch (e: Exception) {
            Log.e(TAG, "guardarCredenciales: error ${e.message}", e)
        }
    }

    /** Borra solo correo/contraseña recordados (conserva la sesión si existe). */
    fun limpiarCredenciales(context: Context) {
        try {
            val prefs = context.getSharedPreferences(PREFS_SESION, Context.MODE_PRIVATE)
            val ed = prefs.edit()
            ed.remove(PREF_CORREO)
            ed.remove(PREF_PASSWORD)
            if (prefs.getString(PREF_USUARIO, null) == null && prefs.getString(PREF_EMPRESA, null) == null) {
                ed.putBoolean(PREF_SESION_ACTIVA, false)
            }
            ed.apply()
        } catch (e: Exception) {
            Log.e(TAG, "limpiarCredenciales: error ${e.message}", e)
        }
    }

    fun limpiarSesion(context: Context) {
        try {
            context.getSharedPreferences(PREFS_SESION, Context.MODE_PRIVATE)
                .edit()
                .clear()
                .apply()
        } catch (e: Exception) {
            Log.e(TAG, "limpiarSesion: error ${e.message}", e)
        }
    }

    // ----------------------------------------------------------------------
    // Carga / guardado
    // ----------------------------------------------------------------------

    fun cargar(context: Context): Boolean {
        return try {
            val archivo = File(context.filesDir, NOMBRE_ARCHIVO)
            if (!archivo.exists()) {
                Log.w("PV_OFFLINE", "cargar: archivo NO existe en ${archivo.absolutePath}")
                jsonRaiz = null
                return false
            }
            val texto = archivo.readText().trim().removePrefix("\uFEFF")
            if (texto.isEmpty()) {
                Log.w("PV_OFFLINE", "cargar: archivo vacio (0 bytes)")
                jsonRaiz = null
                return false
            }
            Log.d("PV_OFFLINE", "cargar: archivo leido, tamano=${texto.length} caracteres")
            val raiz = JSONObject(texto)
            if (!raiz.has("tablas") || raiz.optJSONObject("tablas") == null) {
                Log.w("PV_OFFLINE", "JSON importado sin objeto 'tablas'")
                jsonRaiz = null
                return false
            }
            jsonRaiz = raiz
            val tablas = raiz.optJSONObject("tablas")
            val nTablas = tablas?.length() ?: 0
            Log.d("PV_OFFLINE", "cargar: OK. ${nTablas} tablas cargadas. clientes=${contarFilas("clientes")}, fin_planes=${contarFilas("fin_planes")}, fin_contratos=${contarFilas("fin_contratos")}")
            version++
            true
        } catch (e: Exception) {
            Log.e("PV_OFFLINE", "cargar: ERROR ${e.message}", e)
            jsonRaiz = null
            false
        }
    }

    fun hayDatosOffline(): Boolean = jsonRaiz != null

    fun nombreArchivoGuardado(): String = NOMBRE_ARCHIVO

    /** Devuelve el JSON completo (raíz) para poder exportarlo después. */
    fun jsonCompleto(): String? = jsonRaiz?.toString()

    /** Persiste el JSON actual en el archivo del dispositivo. */
    fun guardar(context: Context) {
        try {
            val raiz = jsonRaiz ?: return
            File(context.filesDir, NOMBRE_ARCHIVO).writeText(raiz.toString())
        } catch (e: Exception) {
            Log.e(TAG, "Error guardando JSON offline", e)
        }
    }

    /** Borra todos los datos locales de la aplicación: memoria y archivo JSON. */
    fun limpiarTodo(context: Context) {
        jsonRaiz = null
        version++
        try {
            val archivo = File(context.filesDir, NOMBRE_ARCHIVO)
            if (archivo.exists()) archivo.delete()
            Log.i(TAG, "limpiarTodo: datos locales borrados (archivo eliminado: ${!archivo.exists()})")
        } catch (e: Exception) {
            Log.e(TAG, "limpiarTodo: error borrando archivo ${e.message}", e)
        }
    }

    // ----------------------------------------------------------------------
    // Acceso a tablas (tablas -> JSONArray)
    // ----------------------------------------------------------------------

    private fun tablas(): JSONObject? = jsonRaiz?.optJSONObject("tablas")

    fun obtenerTabla(nombre: String): JSONArray {
        return try {
            tablas()?.optJSONArray(nombre) ?: JSONArray()
        } catch (e: Exception) {
            JSONArray()
        }
    }

    fun guardarTabla(nombre: String, arreglo: JSONArray) {
        try {
            val t = tablas() ?: return
            t.put(nombre, arreglo)
        } catch (e: Exception) {
            Log.e(TAG, "Error guardando tabla $nombre", e)
        }
    }

    fun contarFilas(nombre: String): Int = obtenerTabla(nombre).length()

    // ----------------------------------------------------------------------
    // Helpers de mapeo de filas fin_*
    // ----------------------------------------------------------------------

    private fun String.aDouble(): Double = try { toDouble() } catch (e: Exception) { 0.0 }

    private fun String.aInt(): Int = try { toInt() } catch (e: Exception) { 0 }

    fun JSONObject.optStringNum(clave: String): String = optString(clave, "0")

    /** Lee un string del JSON sin devolver el literal "null" si el valor es null. */
    fun JSONObject.optStringO(clave: String, fallback: String = ""): String =
        if (isNull(clave)) fallback else optString(clave, fallback)

    // ----------------------------------------------------------------------
    // Utilidades para que las filas exportadas tengan SIEMPRE la misma
    // estructura de columnas que la base de datos web. La web arma los INSERT
    // con las columnas de la primera fila de cada tabla; si una fila creada en
    // el móvil no tiene alguna columna, el valor es "undefined" y la subida
    // falla con "Bind parameters must not contain undefined".
    // ----------------------------------------------------------------------

    /** Columnas reales de las tablas que el móvil puede crear/editar (schema web). */
    private val COLUMNAS_POR_TABLA: Map<String, Set<String>> = mapOf(
        "fin_pagos" to setOf(
            "id", "contrato_id", "empresa_id", "usuario_id", "monto", "monto_capital",
            "monto_interes", "monto_mora", "metodo_pago_id", "referencia", "notas", "fecha", "created_at"
        ),
        "fin_contratos" to setOf(
            "id", "empresa_id", "numero", "cliente_id", "plan_id", "opcion_id", "monto_total",
            "monto_inicial", "monto_financiado", "total_intereses", "total_pagar", "saldo_pendiente",
            "meses", "frecuencia", "tasa_interes", "cuota_mensual", "fecha_inicio", "fecha_fin",
            "notas", "estado", "usuario_id", "created_at", "updated_at"
        ),
        "fin_planes" to setOf(
            "id", "empresa_id", "nombre", "frecuencia", "codigo", "descripcion", "mora_pct",
            "tasa_interes", "dias_gracia", "descuento_anticipado_pct", "monto_minimo", "monto_maximo",
            "requiere_fiador", "permite_anticipado", "activo", "created_at", "cuotas_minimas_anticipadas"
        ),
        "fin_cuotas" to setOf(
            "id", "contrato_id", "empresa_id", "numero", "monto", "capital", "interes", "mora",
            "fecha_vencimiento", "fecha_pago", "estado", "created_at"
        ),
        "fin_pago_cuotas" to setOf("id", "pago_id", "cuota_id", "monto"),
        "clientes" to setOf(
            "id", "empresa_id", "nombre", "apellidos", "tipo_documento_id", "numero_documento",
            "telefono", "email", "direccion", "sector", "municipio", "provincia", "fecha_nacimiento",
            "genero", "estado", "activo", "fecha_creacion", "fecha_actualizacion", "clasificacion_credito",
            "score_crediticio", "puntos_fidelidad", "total_compras", "cliente_padre_id",
            "metodo_contacto_preferido", "ocupacion", "ingreso_mensual", "anos_empleo",
            "nombre_empleador", "telefono_empleador", "foto_url", "numero_whatsapp", "motivo_estado",
            "fecha_cambio_estado"
        )
    )

    /** usuario.id del JSON importado (para las columnas usuario_id). */
    fun usuarioId(): Int = jsonRaiz?.optJSONObject("usuario")?.optInt("id", 0) ?: 0

    /** Fecha/hora actual en formato de la web (yyyy-MM-dd HH:mm:ss). */
    fun fechaHoraIsoActual(): String {
        val c = Calendar.getInstance()
        val d = c.get(Calendar.DAY_OF_MONTH).toString().padStart(2, '0')
        val m = (c.get(Calendar.MONTH) + 1).toString().padStart(2, '0')
        val hh = c.get(Calendar.HOUR_OF_DAY).toString().padStart(2, '0')
        val mm = c.get(Calendar.MINUTE).toString().padStart(2, '0')
        val ss = c.get(Calendar.SECOND).toString().padStart(2, '0')
        return "${c.get(Calendar.YEAR)}-$m-$d $hh:$mm:$ss"
    }

    /** Normaliza una fecha al formato SQL YYYY-MM-DD (columnas DATE de MySQL).
     *  Acepta YYYY-MM-DD o DD/MM/YYYY. Devuelve null si está vacía (así MySQL usa NULL). */
    fun fechaSql(fecha: String): String? {
        val f = fecha.trim()
        if (f.isEmpty()) return null
        val partes = f.split("/")
        return if (partes.size == 3) {
            val dd = partes[0].padStart(2, '0')
            val mm = partes[1].padStart(2, '0')
            val yyyy = partes[2].take(4)
            "$yyyy-$mm-$dd"
        } else {
            f
        }
    }

    /**
     * Completa una fila nueva con TODAS las columnas reales de su tabla (null si no
     * se indicaron) y elimina claves que no pertenecen a la tabla (ej. "cedula").
     * Así el JSON exportado siempre tiene la estructura esperada por la web.
     */
    private fun normalizarFila(tabla: String, fila: JSONObject) {
        val columnas = COLUMNAS_POR_TABLA[tabla] ?: return
        // Eliminar claves que no existen en la tabla
        val claves = fila.keys().asSequence().toList()
        for (c in claves) {
            if (c !in columnas) fila.remove(c)
        }
        // Completar las columnas que faltan con null
        for (c in columnas) {
            if (!fila.has(c)) fila.put(c, JSONObject.NULL)
        }
    }

    // ----------------------------------------------------------------------
    // PLANES (fin_planes)
    // ----------------------------------------------------------------------

    data class PlanOffline(
        val id: Int,
        val nombre: String,
        val frecuencia: String,
        val codigo: String,
        val descripcion: String,
        val moraPct: Double,
        val tasaInteres: Double,
        val diasGracia: Int,
        val descuentoAnticipadoPct: Double,
        val montoMinimo: Double,
        val montoMaximo: Double,
        val requiereFiador: Boolean,
        val permiteAnticipado: Boolean,
        val activo: Boolean
    )

    fun obtenerPlanes(): List<PlanOffline> {
        val arr = obtenerTabla("fin_planes")
        val lista = mutableListOf<PlanOffline>()
        for (i in 0 until arr.length()) {
            val o = arr.optJSONObject(i) ?: continue
            lista.add(
                PlanOffline(
                    id = o.optInt("id"),
                    nombre = o.optString("nombre", "Plan"),
                    frecuencia = o.optString("frecuencia", "semanal"),
                    codigo = o.optString("codigo", ""),
                    descripcion = o.optString("descripcion", ""),
                    moraPct = o.optString("mora_pct").aDouble(),
                    tasaInteres = o.optString("tasa_interes").aDouble(),
                    diasGracia = o.optInt("dias_gracia", 0),
                    descuentoAnticipadoPct = o.optString("descuento_anticipado_pct").aDouble(),
                    montoMinimo = o.optString("monto_minimo").aDouble(),
                    montoMaximo = o.optString("monto_maximo").aDouble(),
                    requiereFiador = o.optInt("requiere_fiador", 0) == 1,
                    permiteAnticipado = o.optInt("permite_anticipado", 0) == 1,
                    activo = o.optInt("activo", 0) == 1
                )
            )
        }
        return lista
    }

    fun guardarPlan(plan: PlanOffline) {
        val arr = obtenerTabla("fin_planes")
        for (i in 0 until arr.length()) {
            val o = arr.optJSONObject(i) ?: continue
            if (o.optInt("id") == plan.id) {
                o.put("nombre", plan.nombre)
                o.put("frecuencia", plan.frecuencia)
                o.put("codigo", plan.codigo)
                o.put("descripcion", plan.descripcion)
                o.put("mora_pct", plan.moraPct.toString())
                o.put("tasa_interes", plan.tasaInteres.toString())
                o.put("dias_gracia", plan.diasGracia)
                o.put("descuento_anticipado_pct", plan.descuentoAnticipadoPct.toString())
                o.put("monto_minimo", plan.montoMinimo.toString())
                o.put("monto_maximo", plan.montoMaximo.toString())
                o.put("requiere_fiador", if (plan.requiereFiador) 1 else 0)
                o.put("permite_anticipado", if (plan.permiteAnticipado) 1 else 0)
                o.put("activo", if (plan.activo) 1 else 0)
                guardarTabla("fin_planes", arr)
                return
            }
        }
        // No existía: agregar
        val nuevo = JSONObject()
        nuevo.put("id", plan.id)
        nuevo.put("empresa_id", jsonRaiz?.optInt("empresa_id", 2) ?: 2)
        nuevo.put("nombre", plan.nombre)
        nuevo.put("frecuencia", plan.frecuencia)
        nuevo.put("codigo", plan.codigo)
        nuevo.put("descripcion", plan.descripcion)
        nuevo.put("mora_pct", plan.moraPct.toString())
        nuevo.put("tasa_interes", plan.tasaInteres.toString())
        nuevo.put("dias_gracia", plan.diasGracia)
        nuevo.put("descuento_anticipado_pct", plan.descuentoAnticipadoPct.toString())
        nuevo.put("monto_minimo", plan.montoMinimo.toString())
        nuevo.put("monto_maximo", plan.montoMaximo.toString())
        nuevo.put("requiere_fiador", if (plan.requiereFiador) 1 else 0)
        nuevo.put("permite_anticipado", if (plan.permiteAnticipado) 1 else 0)
        nuevo.put("activo", if (plan.activo) 1 else 0)
        nuevo.put("cuotas_minimas_anticipadas", 0)
        nuevo.put("created_at", fechaHoraIsoActual())
        normalizarFila("fin_planes", nuevo)
        arr.put(nuevo)
        guardarTabla("fin_planes", arr)
    }

    fun eliminarPlan(id: Int) {
        val arr = obtenerTabla("fin_planes")
        val nuevo = JSONArray()
        for (i in 0 until arr.length()) {
            val o = arr.optJSONObject(i) ?: continue
            if (o.optInt("id") != id) nuevo.put(o)
        }
        guardarTabla("fin_planes", nuevo)
    }

    fun siguientePlanId(): Int = (obtenerPlanes().maxOfOrNull { it.id } ?: 0) + 1

    // ----------------------------------------------------------------------
    // CLIENTES financiamiento (clientes)
    // ----------------------------------------------------------------------

    data class ClienteOffline(
        val id: Int,
        val nombre: String,
        val apellidos: String,
        val documento: String,
        val telefono: String,
        val email: String,
        val direccion: String,
        val cedula: String,
        val tipoDocumentoId: Int = 1,
        val sector: String = "",
        val municipio: String = "",
        val provincia: String = "",
        val fechaNacimiento: String = ""
    )

    fun obtenerClientesFin(): List<ClienteOffline> {
        val arr = obtenerTabla("clientes")
        Log.d("PV_OFFLINE", "obtenerClientesFin: tabla 'clientes' tiene ${arr.length()} filas")
        val lista = mutableListOf<ClienteOffline>()
        for (i in 0 until arr.length()) {
            val o = arr.optJSONObject(i) ?: continue
            val numDoc = o.optStringO("numero_documento", o.optStringO("cedula", ""))
            val nombre = o.optStringO("nombre", "Cliente")
            lista.add(
                ClienteOffline(
                    id = o.optInt("id"),
                    nombre = nombre,
                    apellidos = o.optStringO("apellidos", ""),
                    documento = numDoc,
                    telefono = o.optStringO("telefono", ""),
                    email = o.optStringO("email", ""),
                    direccion = o.optStringO("direccion", ""),
                    cedula = numDoc,
                    tipoDocumentoId = o.optInt("tipo_documento_id", 1).takeIf { it > 0 } ?: 1,
                    sector = o.optStringO("sector", ""),
                    municipio = o.optStringO("municipio", ""),
                    provincia = o.optStringO("provincia", ""),
                    fechaNacimiento = o.optStringO("fecha_nacimiento", "")
                )
            )
            if (i < 3) Log.d("PV_OFFLINE", "obtenerClientesFin[${i}]: id=${o.optInt("id")} nombre='$nombre' numero_documento='$numDoc'")
        }
        if (lista.isEmpty()) Log.w("PV_OFFLINE", "obtenerClientesFin: lista vacia. hayDatosOffline=${hayDatosOffline()}")
        return lista
    }

    fun guardarCliente(cliente: ClienteOffline) {
        val arr = obtenerTabla("clientes")
        val tipoDoc = if (cliente.tipoDocumentoId > 0) cliente.tipoDocumentoId else 1
        val fechaNac = fechaSql(cliente.fechaNacimiento)
        for (i in 0 until arr.length()) {
            val o = arr.optJSONObject(i) ?: continue
            if (o.optInt("id") == cliente.id) {
                o.put("nombre", cliente.nombre)
                o.put("apellidos", cliente.apellidos)
                o.put("numero_documento", cliente.documento)
                o.put("tipo_documento_id", tipoDoc)
                o.put("telefono", cliente.telefono)
                o.put("email", cliente.email)
                o.put("direccion", cliente.direccion)
                o.put("sector", cliente.sector)
                o.put("municipio", cliente.municipio)
                o.put("provincia", cliente.provincia)
                o.put("fecha_nacimiento", fechaNac ?: JSONObject.NULL)
                guardarTabla("clientes", arr)
                return
            }
        }
        val nuevo = JSONObject()
        nuevo.put("id", cliente.id)
        nuevo.put("empresa_id", jsonRaiz?.optInt("empresa_id", 2) ?: 2)
        nuevo.put("nombre", cliente.nombre)
        nuevo.put("apellidos", cliente.apellidos)
        nuevo.put("numero_documento", cliente.documento)
        nuevo.put("tipo_documento_id", tipoDoc)
        nuevo.put("telefono", cliente.telefono)
        nuevo.put("email", cliente.email)
        nuevo.put("direccion", cliente.direccion)
        nuevo.put("sector", cliente.sector)
        nuevo.put("municipio", cliente.municipio)
        nuevo.put("provincia", cliente.provincia)
        nuevo.put("fecha_nacimiento", fechaNac ?: JSONObject.NULL)
        nuevo.put("activo", 1)
        nuevo.put("estado", "activo")
        nuevo.put("fecha_creacion", fechaHoraIsoActual())
        nuevo.put("fecha_actualizacion", fechaHoraIsoActual())
        normalizarFila("clientes", nuevo)
        arr.put(nuevo)
        guardarTabla("clientes", arr)
    }

    fun eliminarCliente(id: Int) {
        val arr = obtenerTabla("clientes")
        val nuevo = JSONArray()
        for (i in 0 until arr.length()) {
            val o = arr.optJSONObject(i) ?: continue
            if (o.optInt("id") != id) nuevo.put(o)
        }
        guardarTabla("clientes", nuevo)
    }

    /** Corrige el JSON antes de subir: normaliza fechas a YYYY-MM-DD y convierte
     *  vacías a NULL para que MySQL no rechace la fila (columnas DATE). */
    fun sanearFechasParaSubir(baseDatos: JSONObject) {
        try {
            val tablas = baseDatos.optJSONObject("tablas") ?: return
            // clientes.fecha_nacimiento
            tablas.optJSONArray("clientes")?.let { arr ->
                for (i in 0 until arr.length()) {
                    val o = arr.optJSONObject(i) ?: continue
                    if (o.has("fecha_nacimiento")) {
                        val raw = o.opt("fecha_nacimiento")
                        val fecha = raw?.toString()?.trim() ?: ""
                        o.put("fecha_nacimiento", if (fecha.isEmpty() || fecha == "null") JSONObject.NULL else fechaSql(fecha) ?: JSONObject.NULL)
                    }
                }
            }
            // fin_contratos.fecha_inicio / fecha_fin
            tablas.optJSONArray("fin_contratos")?.let { arr ->
                for (i in 0 until arr.length()) {
                    val o = arr.optJSONObject(i) ?: continue
                    for (clave in listOf("fecha_inicio", "fecha_fin")) {
                        if (o.has(clave)) {
                            val raw = o.opt(clave)
                            val fecha = raw?.toString()?.trim() ?: ""
                            o.put(clave, if (fecha.isEmpty() || fecha == "null") JSONObject.NULL else fechaSql(fecha) ?: JSONObject.NULL)
                        }
                    }
                }
            }
            // fin_cuotas.fecha_vencimiento / fecha_pago
            tablas.optJSONArray("fin_cuotas")?.let { arr ->
                for (i in 0 until arr.length()) {
                    val o = arr.optJSONObject(i) ?: continue
                    for (clave in listOf("fecha_vencimiento", "fecha_pago")) {
                        if (o.has(clave)) {
                            val raw = o.opt(clave)
                            val fecha = raw?.toString()?.trim() ?: ""
                            o.put(clave, if (fecha.isEmpty() || fecha == "null") JSONObject.NULL else fechaSql(fecha) ?: JSONObject.NULL)
                        }
                    }
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "sanearFechasParaSubir: ${e.message}", e)
        }
    }

    fun siguienteClienteId(): Int = (obtenerClientesFin().maxOfOrNull { it.id } ?: 0) + 1

    // ----------------------------------------------------------------------
    // CONTRATOS / PRÉSTAMOS (fin_contratos)
    // ----------------------------------------------------------------------

    data class ContratoOffline(
        val id: Int,
        val numero: String,
        val clienteId: Int,
        val planId: Int,
        val montoTotal: Double,
        val montoInicial: Double,
        val montoFinanciado: Double,
        val totalIntereses: Double,
        val totalPagar: Double,
        val saldoPendiente: Double,
        val meses: Int,
        val frecuencia: String,
        val tasaInteres: Double,
        val cuotaMensual: Double,
        val fechaInicio: String,
        val fechaFin: String,
        val notas: String,
        val estado: String
    )

    fun obtenerContratos(): List<ContratoOffline> {
        val arr = obtenerTabla("fin_contratos")
        val lista = mutableListOf<ContratoOffline>()
        for (i in 0 until arr.length()) {
            val o = arr.optJSONObject(i) ?: continue
            lista.add(
                ContratoOffline(
                    id = o.optInt("id"),
                    numero = o.optString("numero", "FIN-0"),
                    clienteId = o.optInt("cliente_id"),
                    planId = o.optInt("plan_id"),
                    montoTotal = o.optString("monto_total").aDouble(),
                    montoInicial = o.optString("monto_inicial").aDouble(),
                    montoFinanciado = o.optString("monto_financiado").aDouble(),
                    totalIntereses = o.optString("total_intereses").aDouble(),
                    totalPagar = o.optString("total_pagar").aDouble(),
                    saldoPendiente = o.optString("saldo_pendiente").aDouble(),
                    meses = o.optInt("meses", 0),
                    frecuencia = o.optString("frecuencia", "semanal"),
                    tasaInteres = o.optString("tasa_interes").aDouble(),
                    cuotaMensual = o.optString("cuota_mensual").aDouble(),
                    fechaInicio = o.optString("fecha_inicio", ""),
                    fechaFin = o.optString("fecha_fin", ""),
                    notas = o.optString("notas", ""),
                    estado = o.optString("estado", "activo")
                )
            )
        }
        return lista
    }

    fun guardarContrato(contrato: ContratoOffline) {
        val arr = obtenerTabla("fin_contratos")
        val fInicio = fechaSql(contrato.fechaInicio)
        val fFin = fechaSql(contrato.fechaFin)
        for (i in 0 until arr.length()) {
            val o = arr.optJSONObject(i) ?: continue
            if (o.optInt("id") == contrato.id) {
                o.put("numero", contrato.numero)
                o.put("cliente_id", contrato.clienteId)
                o.put("plan_id", contrato.planId)
                o.put("monto_total", contrato.montoTotal.toString())
                o.put("monto_inicial", contrato.montoInicial.toString())
                o.put("monto_financiado", contrato.montoFinanciado.toString())
                o.put("total_intereses", contrato.totalIntereses.toString())
                o.put("total_pagar", contrato.totalPagar.toString())
                o.put("saldo_pendiente", contrato.saldoPendiente.toString())
                o.put("meses", contrato.meses)
                o.put("frecuencia", contrato.frecuencia)
                o.put("tasa_interes", contrato.tasaInteres.toString())
                o.put("cuota_mensual", contrato.cuotaMensual.toString())
                o.put("fecha_inicio", fInicio ?: JSONObject.NULL)
                o.put("fecha_fin", fFin ?: JSONObject.NULL)
                o.put("notas", contrato.notas)
                o.put("estado", contrato.estado)
                o.put("usuario_id", usuarioId().takeIf { it > 0 } ?: JSONObject.NULL)
                o.put("updated_at", fechaHoraIsoActual())
                guardarTabla("fin_contratos", arr)
                return
            }
        }
        val nuevo = JSONObject()
        nuevo.put("id", contrato.id)
        nuevo.put("empresa_id", jsonRaiz?.optInt("empresa_id", 2) ?: 2)
        nuevo.put("numero", contrato.numero)
        nuevo.put("cliente_id", contrato.clienteId)
        nuevo.put("plan_id", contrato.planId)
        nuevo.put("opcion_id", JSONObject.NULL)
        nuevo.put("monto_total", contrato.montoTotal.toString())
        nuevo.put("monto_inicial", contrato.montoInicial.toString())
        nuevo.put("monto_financiado", contrato.montoFinanciado.toString())
        nuevo.put("total_intereses", contrato.totalIntereses.toString())
        nuevo.put("total_pagar", contrato.totalPagar.toString())
        nuevo.put("saldo_pendiente", contrato.saldoPendiente.toString())
        nuevo.put("meses", contrato.meses)
        nuevo.put("frecuencia", contrato.frecuencia)
        nuevo.put("tasa_interes", contrato.tasaInteres.toString())
        nuevo.put("cuota_mensual", contrato.cuotaMensual.toString())
        nuevo.put("fecha_inicio", fInicio ?: JSONObject.NULL)
        nuevo.put("fecha_fin", fFin ?: JSONObject.NULL)
        nuevo.put("notas", contrato.notas)
        nuevo.put("estado", contrato.estado)
        nuevo.put("usuario_id", usuarioId().takeIf { it > 0 } ?: JSONObject.NULL)
        nuevo.put("created_at", fechaHoraIsoActual())
        nuevo.put("updated_at", fechaHoraIsoActual())
        normalizarFila("fin_contratos", nuevo)
        arr.put(nuevo)
        guardarTabla("fin_contratos", arr)
    }

    fun eliminarContrato(id: Int) {
        val arr = obtenerTabla("fin_contratos")
        val nuevo = JSONArray()
        for (i in 0 until arr.length()) {
            val o = arr.optJSONObject(i) ?: continue
            if (o.optInt("id") != id) nuevo.put(o)
        }
        guardarTabla("fin_contratos", nuevo)
    }

    fun siguienteContratoId(): Int = (obtenerContratos().maxOfOrNull { it.id } ?: 0) + 1

    // ----------------------------------------------------------------------
    // CUOTAS (fin_cuotas)
    // ----------------------------------------------------------------------

    data class CuotaOffline(
        val id: Int,
        val contratoId: Int,
        val numero: Int,
        val monto: Double,
        val capital: Double,
        val interes: Double,
        val mora: Double,
        val fechaVencimiento: String,
        val fechaPago: String,
        val estado: String
    )

    fun obtenerCuotas(): List<CuotaOffline> {
        val arr = obtenerTabla("fin_cuotas")
        val lista = mutableListOf<CuotaOffline>()
        for (i in 0 until arr.length()) {
            val o = arr.optJSONObject(i) ?: continue
            lista.add(
                CuotaOffline(
                    id = o.optInt("id"),
                    contratoId = o.optInt("contrato_id"),
                    numero = o.optInt("numero", 0),
                    monto = o.optString("monto").aDouble(),
                    capital = o.optString("capital").aDouble(),
                    interes = o.optString("interes").aDouble(),
                    mora = o.optString("mora").aDouble(),
                    fechaVencimiento = o.optString("fecha_vencimiento", ""),
                    fechaPago = o.optString("fecha_pago", ""),
                    estado = o.optString("estado", "pendiente")
                )
            )
        }
        return lista
    }

    fun guardarCuota(cuota: CuotaOffline) {
        val arr = obtenerTabla("fin_cuotas")
        for (i in 0 until arr.length()) {
            val o = arr.optJSONObject(i) ?: continue
            if (o.optInt("id") == cuota.id) {
                o.put("contrato_id", cuota.contratoId)
                o.put("numero", cuota.numero)
                o.put("monto", cuota.monto.toString())
                o.put("capital", cuota.capital.toString())
                o.put("interes", cuota.interes.toString())
                o.put("mora", cuota.mora.toString())
                o.put("fecha_vencimiento", cuota.fechaVencimiento)
                o.put("fecha_pago", cuota.fechaPago)
                o.put("estado", cuota.estado)
                guardarTabla("fin_cuotas", arr)
                return
            }
        }
        val nuevo = JSONObject()
        nuevo.put("id", cuota.id)
        nuevo.put("empresa_id", jsonRaiz?.optInt("empresa_id", 2) ?: 2)
        nuevo.put("contrato_id", cuota.contratoId)
        nuevo.put("numero", cuota.numero)
        nuevo.put("monto", cuota.monto.toString())
        nuevo.put("capital", cuota.capital.toString())
        nuevo.put("interes", cuota.interes.toString())
        nuevo.put("mora", cuota.mora.toString())
        nuevo.put("fecha_vencimiento", cuota.fechaVencimiento)
        nuevo.put("fecha_pago", cuota.fechaPago)
        nuevo.put("estado", cuota.estado)
        nuevo.put("created_at", fechaHoraIsoActual())
        normalizarFila("fin_cuotas", nuevo)
        arr.put(nuevo)
        guardarTabla("fin_cuotas", arr)
    }

    fun siguienteCuotaId(): Int = (obtenerCuotas().maxOfOrNull { it.id } ?: 0) + 1

    // ----------------------------------------------------------------------
    // PAGOS (fin_pagos)
    // ----------------------------------------------------------------------

    data class PagoOffline(
        val id: Int,
        val contratoId: Int,
        val monto: Double,
        val montoCapital: Double,
        val montoInteres: Double,
        val montoMora: Double,
        val fecha: String,
        val notas: String
    )

    fun obtenerPagos(): List<PagoOffline> {
        val arr = obtenerTabla("fin_pagos")
        val lista = mutableListOf<PagoOffline>()
        for (i in 0 until arr.length()) {
            val o = arr.optJSONObject(i) ?: continue
            lista.add(
                PagoOffline(
                    id = o.optInt("id"),
                    contratoId = o.optInt("contrato_id"),
                    monto = o.optString("monto").aDouble(),
                    montoCapital = o.optString("monto_capital").aDouble(),
                    montoInteres = o.optString("monto_interes").aDouble(),
                    montoMora = o.optString("monto_mora").aDouble(),
                    fecha = o.optString("fecha", ""),
                    notas = o.optString("notas", "")
                )
            )
        }
        return lista
    }

    fun guardarPago(pago: PagoOffline) {
        val arr = obtenerTabla("fin_pagos")
        for (i in 0 until arr.length()) {
            val o = arr.optJSONObject(i) ?: continue
            if (o.optInt("id") == pago.id) {
                o.put("contrato_id", pago.contratoId)
                o.put("usuario_id", usuarioId().takeIf { it > 0 } ?: JSONObject.NULL)
                o.put("monto", pago.monto.toString())
                o.put("monto_capital", pago.montoCapital.toString())
                o.put("monto_interes", pago.montoInteres.toString())
                o.put("monto_mora", pago.montoMora.toString())
                o.put("metodo_pago_id", JSONObject.NULL)
                o.put("referencia", JSONObject.NULL)
                o.put("fecha", pago.fecha)
                o.put("notas", pago.notas)
                o.put("created_at", fechaHoraIsoActual())
                guardarTabla("fin_pagos", arr)
                return
            }
        }
        val nuevo = JSONObject()
        nuevo.put("id", pago.id)
        nuevo.put("empresa_id", jsonRaiz?.optInt("empresa_id", 2) ?: 2)
        nuevo.put("contrato_id", pago.contratoId)
        nuevo.put("usuario_id", usuarioId().takeIf { it > 0 } ?: JSONObject.NULL)
        nuevo.put("monto", pago.monto.toString())
        nuevo.put("monto_capital", pago.montoCapital.toString())
        nuevo.put("monto_interes", pago.montoInteres.toString())
        nuevo.put("monto_mora", pago.montoMora.toString())
        nuevo.put("metodo_pago_id", JSONObject.NULL)
        nuevo.put("referencia", JSONObject.NULL)
        nuevo.put("fecha", pago.fecha)
        nuevo.put("notas", pago.notas)
        nuevo.put("created_at", fechaHoraIsoActual())
        normalizarFila("fin_pagos", nuevo)
        arr.put(nuevo)
        guardarTabla("fin_pagos", arr)
    }

    fun siguientePagoId(): Int = (obtenerPagos().maxOfOrNull { it.id } ?: 0) + 1

    /** Crea el enlace pago↔cuota en fin_pago_cuotas (como hace la web al pagar). */
    fun guardarPagoCuotaEnlace(pagoId: Int, cuotaId: Int, monto: Double) {
        val arr = obtenerTabla("fin_pago_cuotas")
        val nuevo = JSONObject()
        nuevo.put("id", (obtenerTabla("fin_pago_cuotas").let { a ->
            var max = 0
            for (i in 0 until a.length()) max = maxOf(max, a.optJSONObject(i)?.optInt("id", 0) ?: 0)
            max
        }) + 1)
        nuevo.put("pago_id", pagoId)
        nuevo.put("cuota_id", cuotaId)
        nuevo.put("monto", monto.toString())
        normalizarFila("fin_pago_cuotas", nuevo)
        arr.put(nuevo)
        guardarTabla("fin_pago_cuotas", arr)
    }

    /** Suma lo ya pagado de una cuota (fin_pago_cuotas) para calcular su saldo restante. */
    fun montoPagadoCuota(cuotaId: Int): Double {
        val arr = obtenerTabla("fin_pago_cuotas")
        var total = 0.0
        for (i in 0 until arr.length()) {
            val o = arr.optJSONObject(i) ?: continue
            if (o.optInt("cuota_id") == cuotaId) {
                total += o.optString("monto").aDouble()
            }
        }
        return Math.round(total * 100.0) / 100.0
    }

    /** Fecha actual en formato ISO (yyyy-MM-dd), el formato usado en el JSON. */
    fun fechaIsoHoy(): String {
        val c = Calendar.getInstance()
        val d = c.get(Calendar.DAY_OF_MONTH).toString().padStart(2, '0')
        val m = (c.get(Calendar.MONTH) + 1).toString().padStart(2, '0')
        return "${c.get(Calendar.YEAR)}-$m-$d"
    }

    /**
     * Registra el pago de una cuota de un contrato y persiste TODO el cambio al JSON:
     * 1) Marca la cuota como "pagada" con su fecha de pago.
     * 2) Agrega un pago nuevo a fin_pagos.
     * 3) Reduce el saldo pendiente del contrato.
     * 4) Guarda el archivo y sube [version] para que las pantallas se refresquen.
     */
    fun registrarPagoCuota(
        context: Context,
        contratoId: Int,
        cuotaNumero: Int,
        monto: Double,
        notas: String = ""
    ): Boolean {
        if (monto <= 0) return false
        val cuota = obtenerCuotas().firstOrNull { it.contratoId == contratoId && it.numero == cuotaNumero } ?: return false
        val fecha = fechaIsoHoy()

        // 1) Marcar la cuota como pagada
        guardarCuota(
            cuota.copy(
                estado = "pagada",
                fechaPago = fecha
            )
        )

        // 2) Agregar el pago y el enlace pago↔cuota
        val pagoId = siguientePagoId()
        guardarPago(
            PagoOffline(
                id = pagoId,
                contratoId = contratoId,
                monto = monto,
                montoCapital = cuota.capital,
                montoInteres = cuota.interes,
                montoMora = cuota.mora,
                fecha = fecha,
                notas = notas
            )
        )
        guardarPagoCuotaEnlace(pagoId, cuota.id, monto)

        // 3) Reducir el saldo del contrato
        val contrato = obtenerContratos().firstOrNull { it.id == contratoId }
        if (contrato != null) {
            val nuevoSaldo = (contrato.saldoPendiente - monto).coerceAtLeast(0.0)
            val nuevoEstado = if (nuevoSaldo <= 0.0) "pagado" else contrato.estado
            guardarContrato(contrato.copy(saldoPendiente = nuevoSaldo, estado = nuevoEstado))
        }

        // 4) Persistir y notificar a las pantallas
        guardar(context)
        version++
        Log.d("PV_OFFLINE", "registrarPagoCuota: cuota #$cuotaNumero del contrato $contratoId pagada por $monto")
        return true
    }

    // ----------------------------------------------------------------------
    // ALERTAS (fin_alertas)
    // ----------------------------------------------------------------------

    data class AlertaOffline(
        val id: Int,
        val contratoId: Int,
        val tipo: String,
        val mensaje: String,
        val estado: String,
        val fecha: String
    )

    fun obtenerAlertas(): List<AlertaOffline> {
        val arr = obtenerTabla("fin_alertas")
        val lista = mutableListOf<AlertaOffline>()
        for (i in 0 until arr.length()) {
            val o = arr.optJSONObject(i) ?: continue
            lista.add(
                AlertaOffline(
                    id = o.optInt("id"),
                    contratoId = o.optInt("contrato_id"),
                    tipo = o.optString("tipo", "vencimiento"),
                    mensaje = o.optString("mensaje", ""),
                    estado = o.optString("estado", "activa"),
                    fecha = o.optString("fecha", "")
                )
            )
        }
        return lista
    }

    // ----------------------------------------------------------------------
    // CATEGORÍAS (fin_categorias)
    // ----------------------------------------------------------------------

    data class CategoriaFinOffline(val id: Int, val nombre: String, val color: String, val descripcion: String)

    fun obtenerCategoriasFin(): List<CategoriaFinOffline> {
        val arr = obtenerTabla("fin_categorias")
        val lista = mutableListOf<CategoriaFinOffline>()
        for (i in 0 until arr.length()) {
            val o = arr.optJSONObject(i) ?: continue
            lista.add(
                CategoriaFinOffline(
                    id = o.optInt("id"),
                    nombre = o.optString("nombre", ""),
                    color = o.optString("color", "#94a3b8"),
                    descripcion = o.optString("descripcion", "")
                )
            )
        }
        return lista
    }

    fun formatoMonto(v: Double): String {
        val entero = Math.round(v).toInt()
        val grupos = entero.toString().reversed().chunked(3).joinToString(",").reversed()
        return simboloMoneda() + grupos
    }

    // ----------------------------------------------------------------------
    // EMPRESA (configuración de la empresa importada)
    // ----------------------------------------------------------------------

    data class EmpresaOffline(
        val id: Int,
        val nombre: String,
        val rnc: String,
        val razonSocial: String,
        val direccion: String,
        val telefono: String,
        val moneda: String,
        val simboloMoneda: String,
        val locale: String,
        val impuestoNombre: String,
        val impuestoPorcentaje: String,
        val mensajeFactura: String
    )

    fun obtenerEmpresa(): EmpresaOffline? {
        val e = jsonRaiz?.optJSONObject("empresa") ?: return null
        return try {
            EmpresaOffline(
                id = e.optInt("id"),
                nombre = e.optString("nombre_empresa", ""),
                rnc = e.optString("rnc", ""),
                razonSocial = e.optString("razon_social", ""),
                direccion = e.optString("direccion", ""),
                telefono = e.optString("telefono", ""),
                moneda = e.optString("moneda", "DOP"),
                simboloMoneda = e.optString("simbolo_moneda", "RD$"),
                locale = e.optString("locale", "es-DO"),
                impuestoNombre = e.optString("impuesto_nombre", "ITBIS"),
                impuestoPorcentaje = e.optString("impuesto_porcentaje", "0"),
                mensajeFactura = e.optString("mensaje_factura", "")
            )
        } catch (ex: Exception) {
            Log.e(TAG, "obtenerEmpresa: ERROR ${ex.message}", ex)
            null
        }
    }

    /** Símbolo de moneda configurado por la empresa importada; por defecto "RD$". */
    fun simboloMoneda(): String =
        obtenerEmpresa()?.simboloMoneda?.takeIf { it.isNotBlank() } ?: "RD$"

    /** Código ISO de la moneda configurada por la empresa (ej. "DOP"). */
    fun moneda(): String =
        obtenerEmpresa()?.moneda?.takeIf { it.isNotBlank() } ?: "DOP"

    // ----------------------------------------------------------------------
    // VENTAS: productos, clientes y guardado de ventas (POS)
    // ----------------------------------------------------------------------

    data class ProductoOffline(
        val id: Int,
        val nombre: String,
        val descripcion: String,
        val sku: String,
        val codigoBarras: String,
        val precioVenta: Double,
        val precioCompra: Double,
        val precioOferta: Double,
        val precioMayorista: Double,
        val cantidadMayorista: Int,
        val stock: Double,
        val stockMinimo: Double,
        val stockMaximo: Double,
        val aplicaItbis: Boolean,
        val activo: Boolean,
        val categoriaId: Int?,
        val marcaId: Int?,
        val unidadMedidaId: Int?,
        val imagenUrl: String,
        val lote: String,
        val ubicacionBodega: String
    )

    data class ClienteVentaOffline(
        val id: Int,
        val nombreCompleto: String,
        val documento: String,
        val telefono: String
    )

    data class TipoComprobanteOffline(
        val id: Int,
        val codigo: String,
        val nombre: String,
        val prefijoNcf: String
    )

    /** Tipos de comprobante (tabla global "tipos_comprobante"). */
    fun obtenerTiposComprobante(): List<TipoComprobanteOffline> {
        val arr = obtenerTabla("tipos_comprobante")
        val lista = mutableListOf<TipoComprobanteOffline>()
        for (i in 0 until arr.length()) {
            val o = arr.optJSONObject(i) ?: continue
            if (o.optInt("activo", 1) != 1) continue
            lista.add(
                TipoComprobanteOffline(
                    id = o.optInt("id"),
                    codigo = o.optString("codigo", ""),
                    nombre = o.optString("nombre", ""),
                    prefijoNcf = o.optString("prefijo_ncf", "")
                )
            )
        }
        return lista.sortedBy { it.id }
    }

    /** Productos del JSON importado (tabla "productos"). */
    fun obtenerProductos(): List<ProductoOffline> {
        val arr = obtenerTabla("productos")
        val lista = mutableListOf<ProductoOffline>()
        for (i in 0 until arr.length()) {
            val o = arr.optJSONObject(i) ?: continue
            lista.add(
                ProductoOffline(
                    id = o.optInt("id"),
                    nombre = o.optString("nombre", ""),
                    descripcion = o.optString("descripcion", ""),
                    sku = o.optString("sku", ""),
                    codigoBarras = o.optString("codigo_barras", ""),
                    precioVenta = o.optString("precio_venta").toDoubleOrNull() ?: 0.0,
                    precioCompra = o.optString("precio_compra").toDoubleOrNull() ?: 0.0,
                    precioOferta = o.optString("precio_oferta").toDoubleOrNull() ?: 0.0,
                    precioMayorista = o.optString("precio_mayorista").toDoubleOrNull() ?: 0.0,
                    cantidadMayorista = o.optString("cantidad_mayorista").toIntOrNull() ?: 6,
                    stock = o.optString("stock").toDoubleOrNull() ?: 0.0,
                    stockMinimo = o.optString("stock_minimo").toDoubleOrNull() ?: 5.0,
                    stockMaximo = o.optString("stock_maximo").toDoubleOrNull() ?: 100.0,
                    aplicaItbis = o.optInt("aplica_itbis", 1) == 1,
                    activo = o.optInt("activo", 1) == 1,
                    categoriaId = if (o.isNull("categoria_id")) null else o.optInt("categoria_id"),
                    marcaId = if (o.isNull("marca_id")) null else o.optInt("marca_id"),
                    unidadMedidaId = if (o.isNull("unidad_medida_id")) null else o.optInt("unidad_medida_id"),
                    imagenUrl = o.optString("imagen_url", ""),
                    lote = o.optString("lote", ""),
                    ubicacionBodega = o.optString("ubicacion_bodega", "")
                )
            )
        }
        return lista
    }

    /** Clientes del JSON importado (tabla "clientes"). */
    fun obtenerClientesVenta(): List<ClienteVentaOffline> {
        val arr = obtenerTabla("clientes")
        val lista = mutableListOf<ClienteVentaOffline>()
        for (i in 0 until arr.length()) {
            val o = arr.optJSONObject(i) ?: continue
            val nombre = o.optString("nombre", "")
            val apellidos = o.optString("apellidos", "")
            lista.add(
                ClienteVentaOffline(
                    id = o.optInt("id"),
                    nombreCompleto = if (apellidos.isBlank()) nombre else "$nombre $apellidos",
                    documento = o.optStringO("numero_documento"),
                    telefono = o.optStringO("telefono")
                )
            )
        }
        return lista
    }

    data class ClienteDetalleOffline(
        val id: Int,
        val nombreCompleto: String,
        val documento: String,
        val telefono: String,
        val clasificacion: String,
        val score: Int,
        val activo: Boolean
    )

    /** Clientes con perfil crediticio (tabla "clientes"). */
    fun obtenerClientesDetalle(): List<ClienteDetalleOffline> {
        val arr = obtenerTabla("clientes")
        val lista = mutableListOf<ClienteDetalleOffline>()
        for (i in 0 until arr.length()) {
            val o = arr.optJSONObject(i) ?: continue
            val nombre = o.optString("nombre", "")
            val apellidos = o.optString("apellidos", "")
            lista.add(
                ClienteDetalleOffline(
                    id = o.optInt("id"),
                    nombreCompleto = if (apellidos.isBlank()) nombre else "$nombre $apellidos",
                    documento = o.optStringO("numero_documento"),
                    telefono = o.optStringO("telefono"),
                    clasificacion = o.optString("clasificacion_credito", "C").ifBlank { "C" },
                    score = o.optString("score_crediticio").toIntOrNull() ?: 50,
                    activo = o.optInt("activo", 1) == 1
                )
            )
        }
        return lista
    }

    fun obtenerClientePorId(id: Long): ClienteDetalleOffline? = obtenerClientesDetalle().firstOrNull { it.id.toLong() == id }

    /** Crea o actualiza un cliente en la tabla "clientes". */
    fun guardarCliente(context: Context, c: JSONObject) {
        try {
            val arr = obtenerTabla("clientes")
            val id = c.optInt("id")
            val campos = listOf(
                "empresa_id", "nombre", "apellidos", "numero_documento", "tipo_documento_id",
                "telefono", "email", "direccion", "activo"
            )
            var existe = false
            for (i in 0 until arr.length()) {
                val o = arr.optJSONObject(i) ?: continue
                if (o.optInt("id") == id) {
                    for (k in campos) if (c.has(k)) o.put(k, c.get(k))
                    existe = true
                    break
                }
            }
            if (!existe) {
                val nuevo = JSONObject()
                for (k in campos) if (c.has(k)) nuevo.put(k, c.get(k))
                nuevo.put("id", id)
                nuevo.put("fecha_creacion", fechaHoraIsoActual())
                uniformarFilas(nuevo, "clientes")
                arr.put(nuevo)
            }
            guardarTabla("clientes", arr)
            guardar(context)
            version++
        } catch (e: Exception) {
            Log.e(TAG, "guardarCliente: ${e.message}", e)
        }
    }

    /** Nombre de la categoría por id (tabla "categorias"). */
    fun obtenerCategoriaNombre(categoriaId: Int?): String {
        if (categoriaId == null) return "Sin categoría"
        val arr = obtenerTabla("categorias")
        for (i in 0 until arr.length()) {
            val o = arr.optJSONObject(i) ?: continue
            if (o.optInt("id") == categoriaId) return o.optString("nombre", "Sin categoría")
        }
        return "Sin categoría"
    }

    data class CategoriaOffline(
        val id: Int,
        val nombre: String,
        val descripcion: String = "",
        val activo: Boolean = true,
        val fechaCreacion: String = ""
    )
    data class MarcaOffline(
        val id: Int,
        val nombre: String,
        val paisOrigen: String = "",
        val descripcion: String = "",
        val activo: Boolean = true,
        val fechaCreacion: String = ""
    )
    data class UnidadMedidaOffline(val id: Int, val nombre: String, val abreviatura: String)

    /** Categorías del JSON (tabla "categorias"), activas e inactivas. */
    fun obtenerCategorias(): List<CategoriaOffline> {
        val arr = obtenerTabla("categorias")
        val lista = mutableListOf<CategoriaOffline>()
        for (i in 0 until arr.length()) {
            val o = arr.optJSONObject(i) ?: continue
            lista.add(
                CategoriaOffline(
                    id = o.optInt("id"),
                    nombre = o.optString("nombre", ""),
                    descripcion = o.optStringO("descripcion"),
                    activo = o.optInt("activo", 1) == 1,
                    fechaCreacion = o.optString("fecha_creacion", "")
                )
            )
        }
        return lista.sortedBy { it.nombre }
    }

    /** Marcas del JSON (tabla "marcas"), activas e inactivas. */
    fun obtenerMarcas(): List<MarcaOffline> {
        val arr = obtenerTabla("marcas")
        val lista = mutableListOf<MarcaOffline>()
        for (i in 0 until arr.length()) {
            val o = arr.optJSONObject(i) ?: continue
            lista.add(
                MarcaOffline(
                    id = o.optInt("id"),
                    nombre = o.optString("nombre", ""),
                    paisOrigen = o.optStringO("pais_origen"),
                    descripcion = o.optStringO("descripcion"),
                    activo = o.optInt("activo", 1) == 1,
                    fechaCreacion = o.optString("fecha_creacion", "")
                )
            )
        }
        return lista.sortedBy { it.nombre }
    }

    fun obtenerUnidadesMedida(): List<UnidadMedidaOffline> {
        val arr = obtenerTabla("unidades_medida")
        val lista = mutableListOf<UnidadMedidaOffline>()
        for (i in 0 until arr.length()) {
            val o = arr.optJSONObject(i) ?: continue
            lista.add(
                UnidadMedidaOffline(
                    o.optInt("id"),
                    o.optString("nombre", ""),
                    o.optString("abreviatura", "")
                )
            )
        }
        return lista
    }

    fun obtenerMarcaNombre(marcaId: Int?): String =
        if (marcaId == null) "Sin marca" else obtenerMarcas().firstOrNull { it.id == marcaId }?.nombre ?: "Sin marca"

    fun obtenerUnidadNombre(unidadId: Int?): String {
        if (unidadId == null) return "und"
        return obtenerUnidadesMedida().firstOrNull { it.id == unidadId }?.let { u ->
            if (u.abreviatura.isNotBlank()) "${u.nombre} (${u.abreviatura})" else u.nombre
        } ?: "und"
    }

    fun obtenerProductoPorId(id: Long): ProductoOffline? = obtenerProductos().firstOrNull { it.id.toLong() == id }

    /** Genera un código de barras único (13 dígitos) que no exista en la BD local. */
    fun generarCodigoBarrasUnico(): String {
        val existentes = obtenerProductos().map { it.codigoBarras }.toSet()
        var codigo = ""
        do {
            val num = (1000000000000L..9999999999999L).random()
            codigo = num.toString()
        } while (codigo in existentes)
        return codigo
    }

    /** Genera un SKU único que no exista en la BD local. */
    fun generarSkuUnico(): String {
        val existentes = obtenerProductos().map { it.sku }.toSet()
        var sku = ""
        do {
            sku = "SKU-${(10000..99999).random()}"
        } while (sku in existentes)
        return sku
    }

    /** Crea o actualiza un producto en la tabla "productos". */
    fun guardarProducto(context: Context, prod: JSONObject) {
        try {
            val arr = obtenerTabla("productos")
            val pid = prod.optInt("id")
            val campos = listOf(
                "empresa_id", "nombre", "descripcion", "codigo_barras", "sku", "categoria_id",
                "marca_id", "unidad_medida_id", "precio_compra", "precio_venta", "precio_oferta",
                "precio_mayorista", "cantidad_mayorista", "stock", "stock_minimo", "stock_maximo",
                "imagen_url", "aplica_itbis", "activo", "fecha_vencimiento", "lote", "ubicacion_bodega"
            )
            var existe = false
            for (i in 0 until arr.length()) {
                val o = arr.optJSONObject(i) ?: continue
                if (o.optInt("id") == pid) {
                    for (k in campos) if (prod.has(k)) o.put(k, prod.get(k))
                    existe = true
                    break
                }
            }
            if (!existe) {
                val nuevo = JSONObject()
                for (k in campos) if (prod.has(k)) nuevo.put(k, prod.get(k))
                nuevo.put("id", pid)
                nuevo.put("fecha_creacion", fechaHoraIsoActual())
                aplicarDefaultsProducto(nuevo)
                uniformarFilas(nuevo, "productos")
                arr.put(nuevo)
            }
            guardarTabla("productos", arr)
            guardar(context)
            version++
        } catch (e: Exception) {
            Log.e(TAG, "guardarProducto: ${e.message}", e)
        }
    }

    /** Rellena con sus valores por defecto las columnas NOT NULL de "productos"
     *  (para que la subida a la web nunca falle con "cannot be null"). */
    private fun aplicarDefaultsProducto(o: JSONObject) {
        if (o.isNull("es_rastreable") || !o.has("es_rastreable")) o.put("es_rastreable", 0)
        if (o.isNull("tipo_activo") || !o.has("tipo_activo")) o.put("tipo_activo", "no_rastreable")
        if (o.isNull("requiere_serie") || !o.has("requiere_serie")) o.put("requiere_serie", 0)
        if (o.isNull("permite_financiamiento") || !o.has("permite_financiamiento")) o.put("permite_financiamiento", 0)
        if (o.isNull("stock") || !o.has("stock")) o.put("stock", 0)
        if (o.isNull("stock_minimo") || !o.has("stock_minimo")) o.put("stock_minimo", 5)
        if (o.isNull("stock_maximo") || !o.has("stock_maximo")) o.put("stock_maximo", 100)
        if (o.isNull("cantidad_mayorista") || !o.has("cantidad_mayorista")) o.put("cantidad_mayorista", 6)
        if (o.isNull("meses_garantia") || !o.has("meses_garantia")) o.put("meses_garantia", 0)
        if (o.isNull("aplica_itbis") || !o.has("aplica_itbis")) o.put("aplica_itbis", 1)
        if (o.isNull("activo") || !o.has("activo")) o.put("activo", 1)
        if (o.isNull("fecha_actualizacion") || !o.has("fecha_actualizacion")) o.put("fecha_actualizacion", fechaHoraIsoActual())
    }

    /** Elimina un producto de la tabla "productos". */
    fun eliminarProducto(context: Context, id: Long) {
        try {
            val arr = obtenerTabla("productos")
            val nuevo = JSONArray()
            for (i in 0 until arr.length()) {
                val o = arr.optJSONObject(i) ?: continue
                if (o.optInt("id").toLong() != id) nuevo.put(o)
            }
            guardarTabla("productos", nuevo)
            guardar(context)
            version++
        } catch (e: Exception) {
            Log.e(TAG, "eliminarProducto: ${e.message}", e)
        }
    }

    /** Elimina varios productos a la vez. Devuelve cuántos se eliminaron. */
    fun eliminarProductos(context: Context, ids: List<Long>): Int {
        return try {
            val idSet = ids.toSet()
            if (idSet.isEmpty()) return 0
            val arr = obtenerTabla("productos")
            val nuevo = JSONArray()
            var eliminados = 0
            for (i in 0 until arr.length()) {
                val o = arr.optJSONObject(i) ?: continue
                if (o.optInt("id").toLong() in idSet) {
                    eliminados++
                } else {
                    nuevo.put(o)
                }
            }
            guardarTabla("productos", nuevo)
            guardar(context)
            version++
            eliminados
        } catch (e: Exception) {
            Log.e(TAG, "eliminarProductos: ${e.message}", e)
            0
        }
    }

    /** Elimina todos los productos de la empresa. Devuelve cuántos se eliminaron. */
    fun eliminarTodosProductos(context: Context): Int {
        return try {
            val arr = obtenerTabla("productos")
            val total = arr.length()
            guardarTabla("productos", JSONArray())
            guardar(context)
            version++
            total
        } catch (e: Exception) {
            Log.e(TAG, "eliminarTodosProductos: ${e.message}", e)
            0
        }
    }

    /** Siguiente id disponible para una tabla (max id + 1). */
    fun proximoIdTabla(nombre: String): Int {
        val arr = obtenerTabla(nombre)
        var maxId = 0
        for (i in 0 until arr.length()) {
            val id = arr.optJSONObject(i)?.optInt("id", 0) ?: 0
            if (id > maxId) maxId = id
        }
        return maxId + 1
    }

    /**
     * Rellena la fila [obj] con TODAS las columnas que ya existen en la tabla
     * (unión de claves de las filas actuales + las del propio obj), poniendo
     * null en las que falten. Así el JSON exportado tiene columnas uniformes y
     * la subida a la web nunca falla con "Bind parameters must not contain undefined".
     */
    private fun uniformarFilas(obj: JSONObject, tabla: String) {
        try {
            val claves = mutableSetOf<String>()
            val arr = obtenerTabla(tabla)
            for (i in 0 until arr.length()) {
                val o = arr.optJSONObject(i) ?: continue
                val it = o.keys()
                while (it.hasNext()) claves.add(it.next())
            }
            val it = obj.keys()
            while (it.hasNext()) claves.add(it.next())
            for (k in claves) {
                if (!obj.has(k)) obj.put(k, JSONObject.NULL)
            }
        } catch (e: Exception) {
            Log.e(TAG, "uniformarFilas($tabla): ${e.message}", e)
        }
    }

    /**
     * Guarda una venta generada en el móvil dentro del JSON offline
     * (tablas "ventas", "detalle_ventas" y "venta_extras") y descuenta stock.
     */
    fun guardarVentaOffline(
        context: Context,
        venta: JSONObject,
        detalles: JSONArray,
        extras: JSONArray,
        stockPorProducto: Map<Int, Double>
    ) {
        try {
            uniformarFilas(venta, "ventas")
            val ventas = obtenerTabla("ventas")
            ventas.put(venta)
            guardarTabla("ventas", ventas)

            val detallesArr = obtenerTabla("detalle_ventas")
            for (i in 0 until detalles.length()) {
                val d = detalles.optJSONObject(i)
                if (d != null) uniformarFilas(d, "detalle_ventas")
                detallesArr.put(d)
            }
            guardarTabla("detalle_ventas", detallesArr)

            if (extras.length() > 0) {
                val extrasArr = obtenerTabla("venta_extras")
                for (i in 0 until extras.length()) {
                    val e = extras.optJSONObject(i)
                    if (e != null) uniformarFilas(e, "venta_extras")
                    extrasArr.put(e)
                }
                guardarTabla("venta_extras", extrasArr)
            }

            val productos = obtenerTabla("productos")
            for (i in 0 until productos.length()) {
                val p = productos.optJSONObject(i) ?: continue
                val dec = stockPorProducto[p.optInt("id")] ?: continue
                val st = p.optString("stock").toDoubleOrNull() ?: 0.0
                p.put("stock", (st - dec).coerceAtLeast(0.0))
            }
            guardarTabla("productos", productos)

            guardar(context)
            version++
        } catch (e: Exception) {
            Log.e(TAG, "guardarVentaOffline: ${e.message}", e)
        }
    }

    data class VentaOffline(
        val id: Long,
        val numeroInterno: String,
        val ncf: String,
        val caja: String,
        val cliente: String,
        val vendedor: String,
        val metodoPago: String,
        val total: Double,
        val estado: String,
        val estadoDgii: String,
        val fecha: String
    )

    /** Ventas guardadas en el JSON (tabla "ventas"), con nombre de cliente y vendedor. */
    fun obtenerVentas(context: Context): List<VentaOffline> {
        val arr = obtenerTabla("ventas")
        val clientes = obtenerClientesVenta().associateBy { it.id }
        val vendedor = cargarSesion(context)?.usuario?.optString("nombre", "")
            ?.takeIf { it.isNotBlank() && it != "null" } ?: "Admin"
        val lista = mutableListOf<VentaOffline>()
        for (i in 0 until arr.length()) {
            val o = arr.optJSONObject(i) ?: continue
            val clienteId = o.optInt("cliente_id")
            lista.add(
                VentaOffline(
                    id = o.optInt("id").toLong(),
                    numeroInterno = o.optString("numero_interno", ""),
                    ncf = o.optString("ncf", ""),
                    caja = "#1",
                    cliente = clientes[clienteId]?.nombreCompleto ?: "Consumidor Final",
                    vendedor = vendedor,
                    metodoPago = o.optString("metodo_pago", "efectivo"),
                    total = o.optString("total").toDoubleOrNull() ?: 0.0,
                    estado = o.optString("estado", "emitida"),
                    estadoDgii = o.optString("estado_dgii", "no_enviado"),
                    fecha = o.optString("fecha_venta", "")
                )
            )
        }
        return lista.sortedByDescending { it.fecha }
    }

    /** Reconstruye un [TicketVenta] desde el JSON (venta + detalle_ventas + venta_extras). */
    fun obtenerVentaTicket(context: Context, ventaId: Long): TicketVenta? {
        val arr = obtenerTabla("ventas")
        val productos = obtenerProductos().associateBy { it.id }
        val clientes = obtenerClientesVenta().associateBy { it.id }
        val vendedor = cargarSesion(context)?.usuario?.optString("nombre", "")
            ?.takeIf { it.isNotBlank() && it != "null" } ?: "Admin"
        for (i in 0 until arr.length()) {
            val o = arr.optJSONObject(i) ?: continue
            if (o.optInt("id").toLong() != ventaId) continue

            val lineas = mutableListOf<LineaTicket>()
            val detalles = obtenerTabla("detalle_ventas")
            for (j in 0 until detalles.length()) {
                val d = detalles.optJSONObject(j) ?: continue
                if (d.optInt("venta_id") != o.optInt("id")) continue
                val prod = productos[d.optInt("producto_id")]
                lineas.add(
                    LineaTicket(
                        nombre = prod?.nombre ?: "Producto ${d.optInt("producto_id")}",
                        cantidad = d.optString("cantidad").toDoubleOrNull() ?: 0.0,
                        precio = d.optString("precio_unitario").toDoubleOrNull() ?: 0.0,
                        total = d.optString("total").toDoubleOrNull() ?: 0.0
                    )
                )
            }
            val extrasArr = obtenerTabla("venta_extras")
            for (j in 0 until extrasArr.length()) {
                val e = extrasArr.optJSONObject(j) ?: continue
                if (e.optInt("venta_id") != o.optInt("id")) continue
                lineas.add(
                    LineaTicket(
                        nombre = e.optString("nombre", "Extra"),
                        cantidad = e.optString("cantidad").toDoubleOrNull() ?: 1.0,
                        precio = e.optString("precio_unitario").toDoubleOrNull() ?: 0.0,
                        total = e.optString("monto_total").toDoubleOrNull() ?: 0.0,
                        esExtra = true
                    )
                )
            }

            val cliente = clientes[o.optInt("cliente_id")]
            val tipoNombre = obtenerTiposComprobante()
                .firstOrNull { it.id == o.optInt("tipo_comprobante_id") }?.nombre
                ?: "Comprobante Consumidor Final"
            return TicketVenta(
                numeroInterno = o.optString("numero_interno", ""),
                ncf = o.optString("ncf", ""),
                tipoComprobante = tipoNombre,
                fecha = o.optString("fecha_venta", ""),
                clienteNombre = cliente?.nombreCompleto,
                clienteDocumento = cliente?.documento,
                vendedorNombre = vendedor,
                metodoPago = o.optString("metodo_pago", "efectivo"),
                lineas = lineas,
                subtotal = o.optString("subtotal").toDoubleOrNull() ?: 0.0,
                itbis = o.optString("itbis").toDoubleOrNull() ?: 0.0,
                descuento = o.optString("descuento").toDoubleOrNull() ?: 0.0,
                total = o.optString("total").toDoubleOrNull() ?: 0.0,
                efectivoRecibido = o.optString("efectivo_recibido").toDoubleOrNull() ?: 0.0,
                cambio = o.optString("cambio").toDoubleOrNull() ?: 0.0
            )
        }
        return null
    }

    /** Elimina una venta del JSON (ventas + detalle_ventas + venta_extras) y restaura el stock. */
    fun eliminarVenta(context: Context, ventaId: Long): Boolean {
        return try {
            val ventas = obtenerTabla("ventas")
            val detalles = obtenerTabla("detalle_ventas")
            val extras = obtenerTabla("venta_extras")
            val productos = obtenerTabla("productos")

            // Restaurar stock de los productos de esa venta
            for (i in 0 until detalles.length()) {
                val d = detalles.optJSONObject(i) ?: continue
                if (d.optInt("venta_id").toLong() != ventaId) continue
                val pid = d.optInt("producto_id")
                val cant = d.optString("cantidad").toDoubleOrNull() ?: 0.0
                for (j in 0 until productos.length()) {
                    val p = productos.optJSONObject(j) ?: continue
                    if (p.optInt("id") == pid) {
                        val st = p.optString("stock").toDoubleOrNull() ?: 0.0
                        p.put("stock", st + cant)
                    }
                }
            }

            val nuevasVentas = JSONArray()
            for (i in 0 until ventas.length()) {
                val o = ventas.optJSONObject(i) ?: continue
                if (o.optInt("id").toLong() != ventaId) nuevasVentas.put(o)
            }
            val nuevosDetalles = JSONArray()
            for (i in 0 until detalles.length()) {
                val o = detalles.optJSONObject(i) ?: continue
                if (o.optInt("venta_id").toLong() != ventaId) nuevosDetalles.put(o)
            }
            val nuevosExtras = JSONArray()
            for (i in 0 until extras.length()) {
                val o = extras.optJSONObject(i) ?: continue
                if (o.optInt("venta_id").toLong() != ventaId) nuevosExtras.put(o)
            }

            guardarTabla("ventas", nuevasVentas)
            guardarTabla("detalle_ventas", nuevosDetalles)
            guardarTabla("venta_extras", nuevosExtras)
            guardarTabla("productos", productos)
            guardar(context)
            version++
            true
        } catch (e: Exception) {
            Log.e(TAG, "eliminarVenta: ${e.message}", e)
            false
        }
    }

    // ----------------------------------------------------------------------
    // PROVEEDORES
    // ----------------------------------------------------------------------

    data class ProveedorOffline(
        val id: Int,
        val nombreComercial: String,
        val razonSocial: String,
        val rnc: String,
        val actividadEconomica: String,
        val contacto: String,
        val telefono: String,
        val email: String,
        val direccion: String,
        val sector: String,
        val municipio: String,
        val provincia: String,
        val sitioWeb: String,
        val condicionesPago: String,
        val activo: Boolean
    )

    /** Proveedores del JSON (tabla "proveedores"), activos e inactivos. */
    fun obtenerProveedores(): List<ProveedorOffline> {
        val arr = obtenerTabla("proveedores")
        val lista = mutableListOf<ProveedorOffline>()
        for (i in 0 until arr.length()) {
            val o = arr.optJSONObject(i) ?: continue
            lista.add(
                ProveedorOffline(
                    id = o.optInt("id"),
                    nombreComercial = o.optStringO("nombre_comercial").ifBlank { o.optString("razon_social", "") },
                    razonSocial = o.optStringO("razon_social"),
                    rnc = o.optStringO("rnc"),
                    actividadEconomica = o.optStringO("actividad_economica"),
                    contacto = o.optStringO("contacto"),
                    telefono = o.optStringO("telefono"),
                    email = o.optStringO("email"),
                    direccion = o.optStringO("direccion"),
                    sector = o.optStringO("sector"),
                    municipio = o.optStringO("municipio"),
                    provincia = o.optStringO("provincia"),
                    sitioWeb = o.optStringO("sitio_web"),
                    condicionesPago = o.optStringO("condiciones_pago"),
                    activo = o.optInt("activo", 1) == 1
                )
            )
        }
        return lista.sortedBy { it.nombreComercial.lowercase() }
    }

    fun obtenerProveedorPorId(id: Int): ProveedorOffline? = obtenerProveedores().firstOrNull { it.id == id }

    /** Crea (o actualiza) un proveedor en "proveedores" y devuelve su id. */
    fun guardarProveedor(context: Context, prov: JSONObject): Int {
        try {
            val arr = obtenerTabla("proveedores")
            val id = if (prov.optInt("id") > 0) prov.optInt("id") else proximoIdTabla("proveedores")
            val campos = listOf(
                "empresa_id", "rnc", "razon_social", "nombre_comercial", "actividad_economica",
                "contacto", "telefono", "email", "direccion", "sector", "municipio", "provincia",
                "sitio_web", "condiciones_pago", "activo"
            )
            var existe = false
            for (i in 0 until arr.length()) {
                val o = arr.optJSONObject(i) ?: continue
                if (o.optInt("id") == id) {
                    for (k in campos) if (prov.has(k)) o.put(k, prov.get(k))
                    existe = true
                    break
                }
            }
            if (!existe) {
                val nuevo = JSONObject()
                nuevo.put("id", id)
                nuevo.put("empresa_id", obtenerEmpresa()?.id ?: 0)
                for (k in campos) if (prov.has(k)) nuevo.put(k, prov.get(k))
                if (!nuevo.has("activo")) nuevo.put("activo", 1)
                uniformarFilas(nuevo, "proveedores")
                arr.put(nuevo)
            }
            guardarTabla("proveedores", arr)
            guardar(context)
            version++
            return id
        } catch (e: Exception) {
            Log.e(TAG, "guardarProveedor: ${e.message}", e)
            return 0
        }
    }

    /**
     * Elimina un proveedor; si tiene compras asociadas solo lo desactiva
     * (igual que la web).
     */
    fun eliminarProveedor(context: Context, id: Int): Boolean {
        return try {
            val tieneCompras = obtenerCompras().any { it.proveedorId == id && it.estado != "anulada" }
            val arr = obtenerTabla("proveedores")
            if (tieneCompras) {
                for (i in 0 until arr.length()) {
                    val o = arr.optJSONObject(i) ?: continue
                    if (o.optInt("id") == id) o.put("activo", 0)
                }
            } else {
                val nuevo = JSONArray()
                for (i in 0 until arr.length()) {
                    val o = arr.optJSONObject(i) ?: continue
                    if (o.optInt("id") != id) nuevo.put(o)
                }
                guardarTabla("proveedores", nuevo)
                guardar(context)
                version++
                return true
            }
            guardarTabla("proveedores", arr)
            guardar(context)
            version++
            true
        } catch (e: Exception) {
            Log.e(TAG, "eliminarProveedor: ${e.message}", e)
            false
        }
    }

    // ----------------------------------------------------------------------
    // COMPRAS
    // ----------------------------------------------------------------------

    data class CompraOffline(
        val id: Long,
        val numero: String,
        val ncf: String,
        val proveedor: String,
        val proveedorId: Int,
        val tipoComprobanteNombre: String,
        val metodoPago: String,
        val estado: String,
        val subtotal: Double,
        val itbis: Double,
        val total: Double,
        val notas: String,
        val fecha: String
    )

    data class DetalleCompraOffline(
        val productoNombre: String,
        val cantidad: Int,
        val precioUnitario: Double,
        val subtotal: Double
    )

    /** Compras del JSON (tabla "compras") con nombre del proveedor y comprobante. */
    fun obtenerCompras(): List<CompraOffline> {
        val arr = obtenerTabla("compras")
        val proveedores = obtenerProveedores().associateBy { it.id }
        val tipos = obtenerTiposComprobante().associateBy { it.id }
        val lista = mutableListOf<CompraOffline>()
        for (i in 0 until arr.length()) {
            val o = arr.optJSONObject(i) ?: continue
            val proveedorId = o.optInt("proveedor_id")
            lista.add(
                CompraOffline(
                    id = o.optInt("id").toLong(),
                    numero = "CMP-%04d".format(o.optInt("id")),
                    ncf = o.optString("ncf", ""),
                    proveedor = proveedores[proveedorId]?.nombreComercial ?: "Proveedor $proveedorId",
                    proveedorId = proveedorId,
                    tipoComprobanteNombre = tipos[o.optInt("tipo_comprobante_id")]?.nombre ?: "",
                    metodoPago = o.optString("metodo_pago", "efectivo"),
                    estado = o.optString("estado", "recibida"),
                    subtotal = o.optString("subtotal").toDoubleOrNull() ?: 0.0,
                    itbis = o.optString("itbis").toDoubleOrNull() ?: 0.0,
                    total = o.optString("total").toDoubleOrNull() ?: 0.0,
                    notas = o.optStringO("notas"),
                    fecha = o.optString("fecha_compra", "")
                )
            )
        }
        return lista.sortedByDescending { it.fecha }
    }

    /** Líneas de una compra (tabla "detalle_compras"). */
    fun obtenerCompraDetalles(compraId: Long): List<DetalleCompraOffline> {
        val arr = obtenerTabla("detalle_compras")
        val productos = obtenerProductos().associateBy { it.id }
        val lista = mutableListOf<DetalleCompraOffline>()
        for (i in 0 until arr.length()) {
            val o = arr.optJSONObject(i) ?: continue
            if (o.optInt("compra_id").toLong() != compraId) continue
            val pid = o.optInt("producto_id")
            lista.add(
                DetalleCompraOffline(
                    productoNombre = productos[pid]?.nombre ?: "Producto $pid",
                    cantidad = o.optInt("cantidad"),
                    precioUnitario = o.optString("precio_unitario").toDoubleOrNull() ?: 0.0,
                    subtotal = o.optString("subtotal").toDoubleOrNull() ?: 0.0
                )
            )
        }
        return lista
    }

    /**
     * Genera el siguiente NCF disponible para un [prefijo] (p. ej. "B02")
     * según las compras ya guardadas en la tabla "compras".
     */
    fun proximoNcf(prefijo: String): String {
        val arr = obtenerTabla("compras")
        var maxSec = 0
        for (i in 0 until arr.length()) {
            val o = arr.optJSONObject(i) ?: continue
            val ncf = o.optString("ncf", "")
            if (ncf.startsWith(prefijo)) {
                val sec = ncf.removePrefix(prefijo).toIntOrNull() ?: 0
                if (sec > maxSec) maxSec = sec
            }
        }
        return "$prefijo${(maxSec + 1).toString().padStart(8, '0')}"
    }

    /**
     * Guarda una compra generada en el móvil dentro del JSON offline
     * (tablas "compras", "detalle_compras"), aumenta el stock de los
     * productos (crea los nuevos) y registra los movimientos de inventario.
     */
    fun guardarCompraOffline(
        context: Context,
        compra: JSONObject,
        detalles: JSONArray
    ): Boolean {
        try {
            val compraId = proximoIdTabla("compras")
            compra.put("id", compraId)
            compra.put("empresa_id", obtenerEmpresa()?.id ?: 0)
            compra.put("usuario_id", usuarioId())
            compra.put("estado", "recibida")
            if (!compra.has("fecha_compra")) compra.put("fecha_compra", fechaHoraIsoActual())
            uniformarFilas(compra, "compras")
            val compras = obtenerTabla("compras")
            compras.put(compra)
            guardarTabla("compras", compras)

            val detallesArr = obtenerTabla("detalle_compras")
            val productos = obtenerTabla("productos")
            for (i in 0 until detalles.length()) {
                val d = detalles.optJSONObject(i) ?: continue
                val esNuevo = d.optBoolean("es_nuevo")
                val cantidad = d.optString("cantidad").toDoubleOrNull() ?: 0.0
                val precioUnitario = d.optString("precio_unitario").toDoubleOrNull() ?: 0.0
                var productoId = d.optInt("producto_id")
                var stockAnterior = 0.0
                var stockNuevo = 0.0

                if (esNuevo) {
                    val nuevoId = proximoIdTabla("productos")
                    val np = JSONObject()
                    np.put("id", nuevoId)
                    np.put("empresa_id", obtenerEmpresa()?.id ?: 0)
                    np.put("nombre", d.optString("nombre", ""))
                    np.put("precio_compra", precioUnitario)
                    np.put("precio_venta", precioUnitario * 1.3)
                    np.put("stock", cantidad)
                    np.put("activo", 1)
                    aplicarDefaultsProducto(np)
                    uniformarFilas(np, "productos")
                    productos.put(np)
                    stockNuevo = cantidad
                    productoId = nuevoId
                } else {
                    for (j in 0 until productos.length()) {
                        val p = productos.optJSONObject(j) ?: continue
                        if (p.optInt("id") == productoId) {
                            stockAnterior = p.optString("stock").toDoubleOrNull() ?: 0.0
                            stockNuevo = stockAnterior + cantidad
                            p.put("stock", stockNuevo)
                            p.put("precio_compra", precioUnitario)
                            break
                        }
                    }
                }
                guardarTabla("productos", productos)

                val det = JSONObject()
                det.put("id", proximoIdTabla("detalle_compras"))
                det.put("compra_id", compraId)
                det.put("producto_id", productoId)
                det.put("cantidad", cantidad.toInt())
                det.put("precio_unitario", precioUnitario)
                det.put("subtotal", d.optString("subtotal").toDoubleOrNull() ?: 0.0)
                uniformarFilas(det, "detalle_compras")
                detallesArr.put(det)
                guardarTabla("detalle_compras", detallesArr)

                val movs = obtenerTabla("movimientos_inventario")
                val o = JSONObject()
                o.put("id", proximoIdTabla("movimientos_inventario"))
                o.put("empresa_id", obtenerEmpresa()?.id ?: 0)
                o.put("producto_id", productoId)
                o.put("tipo", "entrada")
                o.put("cantidad", cantidad)
                o.put("stock_anterior", stockAnterior)
                o.put("stock_nuevo", stockNuevo)
                o.put("referencia", "COMPRA-$compraId")
                o.put("usuario_id", usuarioId())
                o.put("notas", "Compra a proveedor")
                o.put("fecha", fechaHoraIsoActual())
                uniformarFilas(o, "movimientos_inventario")
                movs.put(o)
                guardarTabla("movimientos_inventario", movs)
            }

            guardar(context)
            version++
            return true
        } catch (e: Exception) {
            Log.e(TAG, "guardarCompraOffline: ${e.message}", e)
            return false
        }
    }

    /** Marca una compra como anulada y devuelve el stock de sus productos. */
    fun anularCompra(context: Context, compraId: Long): Boolean {
        return try {
            val compras = obtenerTabla("compras")
            val detalles = obtenerTabla("detalle_compras")
            val productos = obtenerTabla("productos")

            for (i in 0 until detalles.length()) {
                val d = detalles.optJSONObject(i) ?: continue
                if (d.optInt("compra_id").toLong() != compraId) continue
                val pid = d.optInt("producto_id")
                val cant = d.optString("cantidad").toDoubleOrNull() ?: 0.0
                var stockAnterior = 0.0
                var stockNuevo = 0.0
                for (j in 0 until productos.length()) {
                    val p = productos.optJSONObject(j) ?: continue
                    if (p.optInt("id") == pid) {
                        stockAnterior = p.optString("stock").toDoubleOrNull() ?: 0.0
                        stockNuevo = (stockAnterior - cant).coerceAtLeast(0.0)
                        p.put("stock", stockNuevo)
                        break
                    }
                }
                guardarTabla("productos", productos)

                val movs = obtenerTabla("movimientos_inventario")
                val o = JSONObject()
                o.put("id", proximoIdTabla("movimientos_inventario"))
                o.put("empresa_id", obtenerEmpresa()?.id ?: 0)
                o.put("producto_id", pid)
                o.put("tipo", "salida")
                o.put("cantidad", cant)
                o.put("stock_anterior", stockAnterior)
                o.put("stock_nuevo", stockNuevo)
                o.put("referencia", "COMPRA-$compraId")
                o.put("usuario_id", usuarioId())
                o.put("notas", "Anulacion de compra")
                o.put("fecha", fechaHoraIsoActual())
                uniformarFilas(o, "movimientos_inventario")
                movs.put(o)
                guardarTabla("movimientos_inventario", movs)
            }

            for (i in 0 until compras.length()) {
                val o = compras.optJSONObject(i) ?: continue
                if (o.optInt("id").toLong() == compraId) o.put("estado", "anulada")
            }
            guardarTabla("compras", compras)
            guardar(context)
            version++
            true
        } catch (e: Exception) {
            Log.e(TAG, "anularCompra: ${e.message}", e)
            false
        }
    }

    // ----------------------------------------------------------------------
    // COTIZACIONES
    // ----------------------------------------------------------------------

    data class DetalleCotizacionOffline(
        val productoId: Int?,
        val nombreProducto: String,
        val descripcionProducto: String,
        val cantidad: Double,
        val precioUnitario: Double,
        val subtotal: Double,
        val itbis: Double,
        val total: Double
    )

    data class CotizacionOffline(
        val id: Int,
        val numero: String,
        val cliente: String,
        val clienteId: Int?,
        val estado: String,
        val subtotal: Double,
        val descuento: Double,
        val itbis: Double,
        val total: Double,
        val fechaEmision: String,
        val fechaVencimiento: String,
        val observaciones: String
    )

    fun proximoNumeroCotizacion(): String = "COT-%06d".format(proximoIdTabla("cotizaciones"))

    /** Cotizaciones del JSON (tabla "cotizaciones"), sin las anuladas. */
    fun obtenerCotizaciones(): List<CotizacionOffline> {
        val arr = obtenerTabla("cotizaciones")
        val clientes = obtenerClientesVenta().associateBy { it.id }
        val lista = mutableListOf<CotizacionOffline>()
        for (i in 0 until arr.length()) {
            val o = arr.optJSONObject(i) ?: continue
            if (o.optString("estado", "borrador") == "anulada") continue
            val clienteId = if (o.isNull("cliente_id")) null else o.optInt("cliente_id")
            lista.add(
                CotizacionOffline(
                    id = o.optInt("id"),
                    numero = o.optString("numero_cotizacion", ""),
                    cliente = clientes[clienteId]?.nombreCompleto ?: "Cliente $clienteId",
                    clienteId = clienteId,
                    estado = o.optString("estado", "borrador"),
                    subtotal = o.optString("subtotal").toDoubleOrNull() ?: 0.0,
                    descuento = o.optString("descuento").toDoubleOrNull() ?: 0.0,
                    itbis = o.optString("itbis").toDoubleOrNull() ?: 0.0,
                    total = o.optString("total").toDoubleOrNull() ?: 0.0,
                    fechaEmision = o.optString("fecha_emision", ""),
                    fechaVencimiento = o.optString("fecha_vencimiento", ""),
                    observaciones = o.optStringO("observaciones")
                )
            )
        }
        return lista.sortedByDescending { it.id }
    }

    fun obtenerCotizacionPorId(id: Int): CotizacionOffline? = obtenerCotizaciones().firstOrNull { it.id == id }

    /** Líneas de una cotización (tabla "cotizacion_detalle"). */
    fun obtenerCotizacionDetalles(id: Int): List<DetalleCotizacionOffline> {
        val arr = obtenerTabla("cotizacion_detalle")
        val lista = mutableListOf<DetalleCotizacionOffline>()
        for (i in 0 until arr.length()) {
            val o = arr.optJSONObject(i) ?: continue
            if (o.optInt("cotizacion_id") != id) continue
            lista.add(
                DetalleCotizacionOffline(
                    productoId = if (o.isNull("producto_id")) null else o.optInt("producto_id"),
                    nombreProducto = o.optString("nombre_producto", ""),
                    descripcionProducto = o.optStringO("descripcion_producto"),
                    cantidad = o.optString("cantidad").toDoubleOrNull() ?: 0.0,
                    precioUnitario = o.optString("precio_unitario").toDoubleOrNull() ?: 0.0,
                    subtotal = o.optString("subtotal").toDoubleOrNull() ?: 0.0,
                    itbis = o.optString("itbis").toDoubleOrNull() ?: 0.0,
                    total = o.optString("total").toDoubleOrNull() ?: 0.0
                )
            )
        }
        return lista
    }

    /**
     * Guarda una cotización (crea o actualiza) junto con sus detalles en el JSON
     * offline (tablas "cotizaciones" y "cotizacion_detalle").
     */
    fun guardarCotizacionOffline(
        context: Context,
        cotizacion: JSONObject,
        detalles: JSONArray
    ): Boolean {
        try {
            val id = if (cotizacion.optInt("id") > 0) cotizacion.optInt("id") else proximoIdTabla("cotizaciones")
            cotizacion.put("id", id)
            if (!cotizacion.has("numero_cotizacion") || cotizacion.optString("numero_cotizacion").isBlank()) {
                cotizacion.put("numero_cotizacion", "COT-%06d".format(id))
            }
            cotizacion.put("empresa_id", obtenerEmpresa()?.id ?: 0)
            cotizacion.put("usuario_id", usuarioId())
            val subt = cotizacion.optString("subtotal").toDoubleOrNull() ?: 0.0
            val desc = cotizacion.optString("descuento").toDoubleOrNull() ?: 0.0
            cotizacion.put("monto_gravado", subt - desc)
            if (!cotizacion.has("estado")) cotizacion.put("estado", "borrador")
            uniformarFilas(cotizacion, "cotizaciones")

            val arr = obtenerTabla("cotizaciones")
            var existe = false
            for (i in 0 until arr.length()) {
                val o = arr.optJSONObject(i) ?: continue
                if (o.optInt("id") == id) {
                    val it = cotizacion.keys()
                    while (it.hasNext()) {
                        val k = it.next()
                        o.put(k, cotizacion.get(k))
                    }
                    existe = true
                    break
                }
            }
            if (!existe) arr.put(cotizacion)
            guardarTabla("cotizaciones", arr)

            // Reemplaza los detalles de esta cotización
            val detallesArr = obtenerTabla("cotizacion_detalle")
            val nuevosDetalles = JSONArray()
            for (i in 0 until detallesArr.length()) {
                val o = detallesArr.optJSONObject(i) ?: continue
                if (o.optInt("cotizacion_id") != id) nuevosDetalles.put(o)
            }
            for (i in 0 until detalles.length()) {
                val d = detalles.optJSONObject(i) ?: continue
                d.put("id", proximoIdTabla("cotizacion_detalle"))
                d.put("cotizacion_id", id)
                uniformarFilas(d, "cotizacion_detalle")
                nuevosDetalles.put(d)
            }
            guardarTabla("cotizacion_detalle", nuevosDetalles)

            guardar(context)
            version++
            return true
        } catch (e: Exception) {
            Log.e(TAG, "guardarCotizacionOffline: ${e.message}", e)
            return false
        }
    }

    /** Eliminación lógica: marca la cotización como anulada (igual que la web). */
    fun eliminarCotizacion(context: Context, id: Int): Boolean {
        return try {
            val arr = obtenerTabla("cotizaciones")
            for (i in 0 until arr.length()) {
                val o = arr.optJSONObject(i) ?: continue
                if (o.optInt("id") == id) o.put("estado", "anulada")
            }
            guardarTabla("cotizaciones", arr)
            guardar(context)
            version++
            true
        } catch (e: Exception) {
            Log.e(TAG, "eliminarCotizacion: ${e.message}", e)
            false
        }
    }

    /** Cambia el estado de una cotización (borrador/enviada/aprobada/vencida/anulada). */
    fun cambiarEstadoCotizacion(context: Context, id: Int, estado: String): Boolean {
        return try {
            val arr = obtenerTabla("cotizaciones")
            for (i in 0 until arr.length()) {
                val o = arr.optJSONObject(i) ?: continue
                if (o.optInt("id") == id) o.put("estado", estado)
            }
            guardarTabla("cotizaciones", arr)
            guardar(context)
            version++
            true
        } catch (e: Exception) {
            Log.e(TAG, "cambiarEstadoCotizacion: ${e.message}", e)
            false
        }
    }

    // ----------------------------------------------------------------------
    // CATEGORIAS
    // ----------------------------------------------------------------------

    fun obtenerCategoriaPorId(id: Int): CategoriaOffline? = obtenerCategorias().firstOrNull { it.id == id }

    /** Cantidad de productos que pertenecen a una categoría. */
    fun contarProductosCategoria(categoriaId: Int): Int =
        obtenerProductos().count { it.categoriaId == categoriaId }

    /** Crea (o actualiza) una categoría en "categorias". */
    fun guardarCategoria(context: Context, cat: JSONObject): Int {
        try {
            val arr = obtenerTabla("categorias")
            val id = if (cat.optInt("id") > 0) cat.optInt("id") else proximoIdTabla("categorias")
            val campos = listOf("empresa_id", "nombre", "descripcion", "activo")
            var existe = false
            for (i in 0 until arr.length()) {
                val o = arr.optJSONObject(i) ?: continue
                if (o.optInt("id") == id) {
                    for (k in campos) if (cat.has(k)) o.put(k, cat.get(k))
                    existe = true
                    break
                }
            }
            if (!existe) {
                val nuevo = JSONObject()
                nuevo.put("id", id)
                nuevo.put("empresa_id", obtenerEmpresa()?.id ?: 0)
                for (k in campos) if (cat.has(k)) nuevo.put(k, cat.get(k))
                if (!nuevo.has("activo")) nuevo.put("activo", 1)
                uniformarFilas(nuevo, "categorias")
                arr.put(nuevo)
            }
            guardarTabla("categorias", arr)
            guardar(context)
            version++
            return id
        } catch (e: Exception) {
            Log.e(TAG, "guardarCategoria: ${e.message}", e)
            return 0
        }
    }

    /** Elimina una categoría; si tiene productos solo la desactiva (igual que la web). */
    fun eliminarCategoria(context: Context, id: Int): Boolean {
        return try {
            val tieneProductos = contarProductosCategoria(id) > 0
            val arr = obtenerTabla("categorias")
            if (tieneProductos) {
                for (i in 0 until arr.length()) {
                    val o = arr.optJSONObject(i) ?: continue
                    if (o.optInt("id") == id) o.put("activo", 0)
                }
            } else {
                val nuevo = JSONArray()
                for (i in 0 until arr.length()) {
                    val o = arr.optJSONObject(i) ?: continue
                    if (o.optInt("id") != id) nuevo.put(o)
                }
                guardarTabla("categorias", nuevo)
                guardar(context)
                version++
                return true
            }
            guardarTabla("categorias", arr)
            guardar(context)
            version++
            true
        } catch (e: Exception) {
            Log.e(TAG, "eliminarCategoria: ${e.message}", e)
            false
        }
    }

    fun obtenerMarcaPorId(id: Int): MarcaOffline? = obtenerMarcas().firstOrNull { it.id == id }

    /** Cantidad de productos que pertenecen a una marca. */
    fun contarProductosMarca(marcaId: Int): Int =
        obtenerProductos().count { it.marcaId == marcaId }

    /** Crea (o actualiza) una marca en "marcas". */
    fun guardarMarca(context: Context, m: JSONObject): Int {
        try {
            val arr = obtenerTabla("marcas")
            val id = if (m.optInt("id") > 0) m.optInt("id") else proximoIdTabla("marcas")
            val campos = listOf("empresa_id", "nombre", "pais_origen", "descripcion", "activo")
            var existe = false
            for (i in 0 until arr.length()) {
                val o = arr.optJSONObject(i) ?: continue
                if (o.optInt("id") == id) {
                    for (k in campos) if (m.has(k)) o.put(k, m.get(k))
                    existe = true
                    break
                }
            }
            if (!existe) {
                val nuevo = JSONObject()
                nuevo.put("id", id)
                nuevo.put("empresa_id", obtenerEmpresa()?.id ?: 0)
                for (k in campos) if (m.has(k)) nuevo.put(k, m.get(k))
                if (!nuevo.has("activo")) nuevo.put("activo", 1)
                uniformarFilas(nuevo, "marcas")
                arr.put(nuevo)
            }
            guardarTabla("marcas", arr)
            guardar(context)
            version++
            return id
        } catch (e: Exception) {
            Log.e(TAG, "guardarMarca: ${e.message}", e)
            return 0
        }
    }

    /** Elimina una marca; si tiene productos solo la desactiva (igual que la web). */
    fun eliminarMarca(context: Context, id: Int): Boolean {
        return try {
            val tieneProductos = contarProductosMarca(id) > 0
            val arr = obtenerTabla("marcas")
            if (tieneProductos) {
                for (i in 0 until arr.length()) {
                    val o = arr.optJSONObject(i) ?: continue
                    if (o.optInt("id") == id) o.put("activo", 0)
                }
            } else {
                val nuevo = JSONArray()
                for (i in 0 until arr.length()) {
                    val o = arr.optJSONObject(i) ?: continue
                    if (o.optInt("id") != id) nuevo.put(o)
                }
                guardarTabla("marcas", nuevo)
                guardar(context)
                version++
                return true
            }
            guardarTabla("marcas", arr)
            guardar(context)
            version++
            true
        } catch (e: Exception) {
            Log.e(TAG, "eliminarMarca: ${e.message}", e)
            false
        }
    }

    // ----------------------------------------------------------------------
    // GASTOS (tabla "gastos")
    // ----------------------------------------------------------------------

    data class GastoGeneralOffline(
        val id: Int,
        val concepto: String,
        val monto: Double,
        val categoria: String,
        val comprobanteNumero: String,
        val notas: String,
        val fechaGasto: String,
        val cajaId: Int?,
        val cajaNumero: Int?,
        val usuarioNombre: String
    )

    /** Gastos del JSON (tabla "gastos"), con caja y usuario. */
    fun obtenerGastosGenerales(context: Context): List<GastoGeneralOffline> {
        val arr = obtenerTabla("gastos")
        val cajas = obtenerCajas().associateBy { it.id }
        val vendedor = cargarSesion(context)?.usuario?.optString("nombre", "")
            ?.takeIf { it.isNotBlank() && it != "null" } ?: "Admin"
        val lista = mutableListOf<GastoGeneralOffline>()
        for (i in 0 until arr.length()) {
            val o = arr.optJSONObject(i) ?: continue
            val cajaId = if (o.isNull("caja_id")) null else o.optInt("caja_id")
            lista.add(
                GastoGeneralOffline(
                    id = o.optInt("id"),
                    concepto = o.optString("concepto", ""),
                    monto = o.optString("monto").toDoubleOrNull() ?: 0.0,
                    categoria = o.optStringO("categoria"),
                    comprobanteNumero = o.optStringO("comprobante_numero"),
                    notas = o.optStringO("notas"),
                    fechaGasto = o.optString("fecha_gasto", ""),
                    cajaId = cajaId,
                    cajaNumero = cajas[cajaId]?.numeroCaja,
                    usuarioNombre = vendedor
                )
            )
        }
        return lista.sortedByDescending { it.fechaGasto }
    }

    fun obtenerGastoGeneralPorId(context: Context, id: Int): GastoGeneralOffline? =
        obtenerGastosGenerales(context).firstOrNull { it.id == id }

    /** Gastos de una caja concreta (tabla "gastos"). */
    fun gastosGeneralesDeCaja(context: Context, cajaId: Int): List<GastoGeneralOffline> =
        obtenerGastosGenerales(context).filter { it.cajaId == cajaId }

    /** Registra un gasto en la tabla "gastos" asociado a la caja abierta. */
    fun guardarGastoGeneral(
        context: Context,
        cajaId: Int,
        concepto: String,
        monto: Double,
        categoria: String,
        comprobante: String,
        notas: String
    ): Boolean {
        return try {
            val gastos = obtenerTabla("gastos")
            val o = JSONObject()
            o.put("id", proximoIdTabla("gastos"))
            o.put("empresa_id", obtenerEmpresa()?.id ?: 0)
            o.put("usuario_id", usuarioId())
            o.put("caja_id", cajaId)
            o.put("concepto", concepto)
            o.put("monto", monto)
            o.put("categoria", if (categoria.isBlank()) JSONObject.NULL else categoria)
            o.put("comprobante_numero", if (comprobante.isBlank()) JSONObject.NULL else comprobante)
            o.put("notas", if (notas.isBlank()) JSONObject.NULL else notas)
            o.put("fecha_gasto", fechaHoraIsoActual())
            uniformarFilas(o, "gastos")
            gastos.put(o)
            guardarTabla("gastos", gastos)
            guardar(context)
            version++
            true
        } catch (e: Exception) {
            Log.e(TAG, "guardarGastoGeneral: ${e.message}", e)
            false
        }
    }

    /** Actualiza un gasto existente (tabla "gastos"). */
    fun actualizarGastoGeneral(
        context: Context,
        id: Int,
        concepto: String,
        monto: Double,
        categoria: String,
        comprobante: String,
        notas: String
    ): Boolean {
        return try {
            val gastos = obtenerTabla("gastos")
            for (i in 0 until gastos.length()) {
                val o = gastos.optJSONObject(i) ?: continue
                if (o.optInt("id") == id) {
                    o.put("concepto", concepto)
                    o.put("monto", monto)
                    o.put("categoria", if (categoria.isBlank()) JSONObject.NULL else categoria)
                    o.put("comprobante_numero", if (comprobante.isBlank()) JSONObject.NULL else comprobante)
                    o.put("notas", if (notas.isBlank()) JSONObject.NULL else notas)
                    break
                }
            }
            guardarTabla("gastos", gastos)
            guardar(context)
            version++
            true
        } catch (e: Exception) {
            Log.e(TAG, "actualizarGastoGeneral: ${e.message}", e)
            false
        }
    }

    /** Elimina un gasto de la tabla "gastos". */
    fun eliminarGastoGeneral(context: Context, id: Int): Boolean {
        return try {
            val gastos = obtenerTabla("gastos")
            val nuevo = JSONArray()
            for (i in 0 until gastos.length()) {
                val o = gastos.optJSONObject(i) ?: continue
                if (o.optInt("id") != id) nuevo.put(o)
            }
            guardarTabla("gastos", nuevo)
            guardar(context)
            version++
            true
        } catch (e: Exception) {
            Log.e(TAG, "eliminarGastoGeneral: ${e.message}", e)
            false
        }
    }

    /** Siguiente número de comprobante disponible (GAS-000001...) sin repetir. */
    fun proximoComprobanteGasto(): String {
        val arr = obtenerTabla("gastos")
        var max = 0
        for (i in 0 until arr.length()) {
            val o = arr.optJSONObject(i) ?: continue
            val ncf = o.optString("comprobante_numero", "")
            if (ncf.startsWith("GAS-")) {
                val n = ncf.removePrefix("GAS-").toIntOrNull() ?: 0
                if (n > max) max = n
            }
        }
        return "GAS-%06d".format(max + 1)
    }

    /** Verifica si un número de comprobante ya existe en la tabla "gastos". */
    fun existeComprobanteGasto(comprobante: String): Boolean {
        if (comprobante.isBlank()) return false
        val arr = obtenerTabla("gastos")
        for (i in 0 until arr.length()) {
            val o = arr.optJSONObject(i) ?: continue
            if (o.optString("comprobante_numero", "").equals(comprobante, ignoreCase = true)) return true
        }
        return false
    }

    // ----------------------------------------------------------------------
    // DASHBOARD
    // ----------------------------------------------------------------------

    data class ProductoVendidoOffline(
        val producto: ProductoOffline,
        val cantidad: Double,
        val monto: Double
    )

    data class ClienteRecienteOffline(
        val id: Int,
        val nombreCompleto: String,
        val documento: String,
        val fechaCreacion: String
    )

    /** Productos con stock bajo (stock <= stock_minimo y activos). */
    fun productosBajoStock(): List<ProductoOffline> =
        obtenerProductos().filter { it.activo && it.stock <= it.stockMinimo }
            .sortedBy { it.stock - it.stockMinimo }
            .take(10)

    /** Productos más vendidos desde una fecha (cantidad y monto por producto). */
    fun productosTopVendidos(context: Context, desdeISO: String): List<ProductoVendidoOffline> {
        val ventasEmitidas = obtenerVentas(context)
            .filter { it.estado == "emitida" && it.fecha >= desdeISO }
            .map { it.id }
            .toSet()
        val dets = obtenerTabla("detalle_ventas")
        val productos = obtenerProductos().associateBy { it.id }
        val acc = mutableMapOf<Int, Pair<Double, Double>>()
        for (i in 0 until dets.length()) {
            val d = dets.optJSONObject(i) ?: continue
            if (d.optInt("venta_id").toLong() !in ventasEmitidas) continue
            val pid = d.optInt("producto_id")
            val cant = d.optString("cantidad").toDoubleOrNull() ?: 0.0
            val tot = d.optString("total").toDoubleOrNull() ?: 0.0
            val prev = acc[pid] ?: (0.0 to 0.0)
            acc[pid] = (prev.first + cant) to (prev.second + tot)
        }
        return acc.entries
            .mapNotNull { (pid, v) -> productos[pid]?.let { ProductoVendidoOffline(it, v.first, v.second) } }
            .sortedByDescending { it.cantidad }
            .take(10)
    }

    /** Ventas por producto en un rango de fechas (todos los productos, incluso sin ventas). */
    fun productosVendidosRango(context: Context, desde: String, hasta: String): List<ProductoVendidoOffline> {
        val ventasEmitidas = obtenerVentas(context)
            .filter { it.estado == "emitida" }
            .filter { v -> val f = v.fecha.take(10); f >= desde && f <= hasta }
            .map { it.id }
            .toSet()
        val dets = obtenerTabla("detalle_ventas")
        val productos = obtenerProductos()
        val acc = mutableMapOf<Int, Pair<Double, Double>>()
        for (i in 0 until dets.length()) {
            val d = dets.optJSONObject(i) ?: continue
            if (d.optInt("venta_id").toLong() !in ventasEmitidas) continue
            val pid = d.optInt("producto_id")
            val cant = d.optString("cantidad").toDoubleOrNull() ?: 0.0
            val tot = d.optString("total").toDoubleOrNull() ?: 0.0
            val prev = acc[pid] ?: (0.0 to 0.0)
            acc[pid] = (prev.first + cant) to (prev.second + tot)
        }
        return productos.map { p ->
            val v = acc[p.id] ?: (0.0 to 0.0)
            ProductoVendidoOffline(p, v.first, v.second)
        }.sortedByDescending { it.cantidad }
    }

    /** Últimos clientes registrados (tabla "clientes"). */
    fun obtenerClientesRecientes(limite: Int = 5): List<ClienteRecienteOffline> {
        val arr = obtenerTabla("clientes")
        val lista = mutableListOf<ClienteRecienteOffline>()
        for (i in 0 until arr.length()) {
            val o = arr.optJSONObject(i) ?: continue
            val nombre = o.optString("nombre", "")
            val apellidos = o.optString("apellidos", "")
            lista.add(
                ClienteRecienteOffline(
                    id = o.optInt("id"),
                    nombreCompleto = if (apellidos.isBlank()) nombre else "$nombre $apellidos",
                    documento = o.optStringO("numero_documento"),
                    fechaCreacion = o.optString("fecha_creacion", "")
                )
            )
        }
        return lista.sortedByDescending { it.fechaCreacion }.take(limite)
    }

    // ----------------------------------------------------------------------
    // USUARIOS
    // ----------------------------------------------------------------------

    data class UsuarioOffline(
        val id: Int,
        val nombre: String,
        val cedula: String,
        val email: String,
        val tipo: String,
        val rolId: Int?,
        val rolNombre: String,
        val activo: Boolean,
        val fechaCreacion: String
    )

    /** Usuarios del JSON (tabla "usuarios"), con su rol. */
    fun obtenerUsuarios(): List<UsuarioOffline> {
        val arr = obtenerTabla("usuarios")
        val roles = obtenerTabla("roles")
        val rolPorId = mutableMapOf<Int, String>()
        for (i in 0 until roles.length()) {
            val o = roles.optJSONObject(i) ?: continue
            rolPorId[o.optInt("id")] = o.optString("nombre", "")
        }
        val lista = mutableListOf<UsuarioOffline>()
        for (i in 0 until arr.length()) {
            val o = arr.optJSONObject(i) ?: continue
            val rolId = if (o.isNull("rol_id")) null else o.optInt("rol_id")
            lista.add(
                UsuarioOffline(
                    id = o.optInt("id"),
                    nombre = o.optString("nombre", ""),
                    cedula = o.optStringO("cedula"),
                    email = o.optStringO("email"),
                    tipo = o.optString("tipo", "vendedor"),
                    rolId = rolId,
                    rolNombre = rolPorId[rolId] ?: "",
                    activo = o.optInt("activo", 1) == 1,
                    fechaCreacion = o.optString("fecha_creacion", "")
                )
            )
        }
        return lista.sortedBy { it.nombre.lowercase() }
    }

    fun obtenerUsuarioPorId(id: Int): UsuarioOffline? = obtenerUsuarios().firstOrNull { it.id == id }

    /** Busca el id de un rol por su nombre (tabla "roles"). */
    fun obtenerRolIdPorNombre(nombre: String): Int? {
        if (nombre.isBlank()) return null
        val arr = obtenerTabla("roles")
        for (i in 0 until arr.length()) {
            val o = arr.optJSONObject(i) ?: continue
            if (o.optString("nombre", "").equals(nombre, ignoreCase = true)) return o.optInt("id")
        }
        return null
    }

    /** Crea (o actualiza) un usuario en "usuarios". */
    fun guardarUsuario(context: Context, u: JSONObject): Int {
        try {
            val arr = obtenerTabla("usuarios")
            val id = if (u.optInt("id") > 0) u.optInt("id") else proximoIdTabla("usuarios")
            val campos = listOf("empresa_id", "rol_id", "nombre", "cedula", "email", "avatar_url", "password", "tipo", "activo", "permite_impresion", "offline_habilitado")
            var existe = false
            for (i in 0 until arr.length()) {
                val o = arr.optJSONObject(i) ?: continue
                if (o.optInt("id") == id) {
                    for (k in campos) if (u.has(k)) o.put(k, u.get(k))
                    existe = true
                    break
                }
            }
            if (!existe) {
                val nuevo = JSONObject()
                nuevo.put("id", id)
                nuevo.put("empresa_id", obtenerEmpresa()?.id ?: 0)
                for (k in campos) if (u.has(k)) nuevo.put(k, u.get(k))
                if (!nuevo.has("activo")) nuevo.put("activo", 1)
                if (!nuevo.has("permite_impresion")) nuevo.put("permite_impresion", 1)
                if (!nuevo.has("offline_habilitado")) nuevo.put("offline_habilitado", 1)
                uniformarFilas(nuevo, "usuarios")
                arr.put(nuevo)
            }
            guardarTabla("usuarios", arr)
            guardar(context)
            version++
            return id
        } catch (e: Exception) {
            Log.e(TAG, "guardarUsuario: ${e.message}", e)
            return 0
        }
    }

    /** Elimina un usuario de la tabla "usuarios". */
    fun eliminarUsuario(context: Context, id: Int): Boolean {
        return try {
            val arr = obtenerTabla("usuarios")
            val nuevo = JSONArray()
            for (i in 0 until arr.length()) {
                val o = arr.optJSONObject(i) ?: continue
                if (o.optInt("id") != id) nuevo.put(o)
            }
            guardarTabla("usuarios", nuevo)
            guardar(context)
            version++
            true
        } catch (e: Exception) {
            Log.e(TAG, "eliminarUsuario: ${e.message}", e)
            false
        }
    }

    // ----------------------------------------------------------------------
    // CAJAS / TURNOS
    // ----------------------------------------------------------------------

    data class CajaOffline(
        val id: Int,
        val numeroCaja: Int,
        val montoInicial: Double,
        val montoFinal: Double,
        val totalVentas: Double,
        val totalEfectivo: Double,
        val totalDebito: Double,
        val totalCredito: Double,
        val totalTransferencia: Double,
        val totalCheque: Double,
        val totalGastos: Double,
        val diferencia: Double,
        val estado: String,
        val fechaCaja: String,
        val fechaApertura: String,
        val fechaCierre: String,
        val notas: String
    )

    data class GastoOffline(
        val id: Int,
        val cajaId: Int,
        val concepto: String,
        val monto: Double,
        val categoria: String,
        val comprobante: String,
        val notas: String,
        val fecha: String
    )

    fun obtenerCajas(): List<CajaOffline> {
        val arr = obtenerTabla("cajas")
        val lista = mutableListOf<CajaOffline>()
        for (i in 0 until arr.length()) {
            val o = arr.optJSONObject(i) ?: continue
            lista.add(
                CajaOffline(
                    id = o.optInt("id"),
                    numeroCaja = o.optInt("numero_caja"),
                    montoInicial = o.optString("monto_inicial").toDoubleOrNull() ?: 0.0,
                    montoFinal = o.optString("monto_final").toDoubleOrNull() ?: 0.0,
                    totalVentas = o.optString("total_ventas").toDoubleOrNull() ?: 0.0,
                    totalEfectivo = o.optString("total_efectivo").toDoubleOrNull() ?: 0.0,
                    totalDebito = o.optString("total_tarjeta_debito").toDoubleOrNull() ?: 0.0,
                    totalCredito = o.optString("total_tarjeta_credito").toDoubleOrNull() ?: 0.0,
                    totalTransferencia = o.optString("total_transferencia").toDoubleOrNull() ?: 0.0,
                    totalCheque = o.optString("total_cheque").toDoubleOrNull() ?: 0.0,
                    totalGastos = o.optString("total_gastos").toDoubleOrNull() ?: 0.0,
                    diferencia = o.optString("diferencia").toDoubleOrNull() ?: 0.0,
                    estado = o.optString("estado", "abierta"),
                    fechaCaja = o.optString("fecha_caja", ""),
                    fechaApertura = o.optString("fecha_apertura", ""),
                    fechaCierre = o.optString("fecha_cierre", ""),
                    notas = o.optString("notas", "")
                )
            )
        }
        return lista.sortedByDescending { it.id }
    }

    fun obtenerCajaAbierta(): CajaOffline? = obtenerCajas().firstOrNull { it.estado == "abierta" }

    fun obtenerHistorialCajas(): List<CajaOffline> = obtenerCajas().filter { it.estado == "cerrada" }

    fun abrirCaja(context: Context, numeroCaja: Int, montoInicial: Double) {
        try {
            val cajas = obtenerTabla("cajas")
            val o = JSONObject()
            o.put("id", proximoIdTabla("cajas"))
            o.put("empresa_id", obtenerEmpresa()?.id ?: 0)
            o.put("usuario_id", usuarioId())
            o.put("numero_caja", numeroCaja)
            o.put("fecha_caja", fechaHoraIsoActual().take(10))
            o.put("monto_inicial", montoInicial)
            o.put("estado", "abierta")
            o.put("fecha_apertura", fechaHoraIsoActual())
            uniformarFilas(o, "cajas")
            cajas.put(o)
            guardarTabla("cajas", cajas)
            guardar(context)
            version++
        } catch (e: Exception) {
            Log.e(TAG, "abrirCaja: ${e.message}", e)
        }
    }

    /** Calcula los totales de una caja a partir de las ventas de su día y los gastos. */
    fun calcularTotalesCaja(caja: CajaOffline, context: Context): CajaOffline {
        val ventas = obtenerVentas(context).filter { it.fecha.take(10) == caja.fechaCaja }
        val total = ventas.sumOf { it.total }
        val porMetodo = ventas.groupBy { it.metodoPago }.mapValues { (_, v) -> v.sumOf { it.total } }
        val gastos = obtenerGastos(caja.id).sumOf { it.monto } + gastosGeneralesDeCaja(context, caja.id).sumOf { it.monto }
        val esperado = caja.montoInicial + total - gastos
        val diferencia = if (caja.estado == "cerrada") caja.montoFinal - esperado else 0.0
        return caja.copy(
            totalVentas = total,
            totalEfectivo = porMetodo["efectivo"] ?: 0.0,
            totalDebito = porMetodo["tarjeta_debito"] ?: 0.0,
            totalCredito = porMetodo["tarjeta_credito"] ?: 0.0,
            totalTransferencia = porMetodo["transferencia"] ?: 0.0,
            totalCheque = porMetodo["cheque"] ?: 0.0,
            totalGastos = gastos,
            diferencia = diferencia
        )
    }

    fun ventasDeCaja(context: Context, caja: CajaOffline): List<VentaOffline> =
        obtenerVentas(context).filter { it.fecha.take(10) == caja.fechaCaja }

    fun cerrarCaja(context: Context, cajaId: Int, montoFinal: Double, notas: String) {
        try {
            val cajas = obtenerTabla("cajas")
            val caja = obtenerCajaAbierta() ?: return
            val calculada = calcularTotalesCaja(caja, context)
            for (i in 0 until cajas.length()) {
                val o = cajas.optJSONObject(i) ?: continue
                if (o.optInt("id") != cajaId) continue
                val esperado = caja.montoInicial + calculada.totalVentas - calculada.totalGastos
                o.put("total_ventas", calculada.totalVentas)
                o.put("total_efectivo", calculada.totalEfectivo)
                o.put("total_tarjeta_debito", calculada.totalDebito)
                o.put("total_tarjeta_credito", calculada.totalCredito)
                o.put("total_transferencia", calculada.totalTransferencia)
                o.put("total_cheque", calculada.totalCheque)
                o.put("total_gastos", calculada.totalGastos)
                o.put("monto_final", montoFinal)
                o.put("diferencia", montoFinal - esperado)
                o.put("estado", "cerrada")
                o.put("fecha_cierre", fechaHoraIsoActual())
                o.put("notas", notas)
                break
            }
            guardarTabla("cajas", cajas)
            guardar(context)
            version++
        } catch (e: Exception) {
            Log.e(TAG, "cerrarCaja: ${e.message}", e)
        }
    }

    fun registrarGasto(context: Context, cajaId: Int, concepto: String, monto: Double, categoria: String, comprobante: String, notas: String) {
        try {
            val gastos = obtenerTabla("cajas_gastos")
            val o = JSONObject()
            o.put("id", proximoIdTabla("cajas_gastos"))
            o.put("caja_id", cajaId)
            o.put("concepto", concepto)
            o.put("monto", monto)
            o.put("categoria", categoria)
            o.put("numero_comprobante", comprobante)
            o.put("notas", notas)
            o.put("fecha", fechaHoraIsoActual())
            uniformarFilas(o, "cajas_gastos")
            gastos.put(o)
            guardarTabla("cajas_gastos", gastos)
            guardar(context)
            version++
        } catch (e: Exception) {
            Log.e(TAG, "registrarGasto: ${e.message}", e)
        }
    }

    fun obtenerGastos(cajaId: Int): List<GastoOffline> {
        val arr = obtenerTabla("cajas_gastos")
        val lista = mutableListOf<GastoOffline>()
        for (i in 0 until arr.length()) {
            val o = arr.optJSONObject(i) ?: continue
            if (o.optInt("caja_id") != cajaId) continue
            lista.add(
                GastoOffline(
                    id = o.optInt("id"),
                    cajaId = cajaId,
                    concepto = o.optString("concepto", ""),
                    monto = o.optString("monto").toDoubleOrNull() ?: 0.0,
                    categoria = o.optString("categoria", ""),
                    comprobante = o.optString("numero_comprobante", ""),
                    notas = o.optString("notas", ""),
                    fecha = o.optString("fecha", "")
                )
            )
        }
        return lista
    }

    // ----------------------------------------------------------------------
    // INVENTARIO / MOVIMIENTOS
    // ----------------------------------------------------------------------

    data class MovimientoOffline(
        val id: Int,
        val productoId: Int,
        val productoNombre: String,
        val tipo: String,
        val cantidad: Double,
        val stockAnterior: Double,
        val stockNuevo: Double,
        val referencia: String,
        val notas: String,
        val fecha: String
    )

    /** Registra un movimiento de inventario y actualiza el stock del producto. */
    fun registrarMovimiento(context: Context, productoId: Int, tipo: String, cantidad: Double, referencia: String, notas: String) {
        try {
            val productos = obtenerTabla("productos")
            var stockAnterior = 0.0
            var stockNuevo = 0.0
            var encontrado = false
            for (i in 0 until productos.length()) {
                val p = productos.optJSONObject(i) ?: continue
                if (p.optInt("id") != productoId) continue
                stockAnterior = p.optString("stock").toDoubleOrNull() ?: 0.0
                stockNuevo = when (tipo) {
                    "entrada", "devolucion" -> stockAnterior + cantidad
                    "ajuste" -> cantidad
                    else -> (stockAnterior - cantidad).coerceAtLeast(0.0)
                }
                p.put("stock", stockNuevo)
                encontrado = true
                break
            }
            if (!encontrado) return
            guardarTabla("productos", productos)

            val movs = obtenerTabla("movimientos_inventario")
            val o = JSONObject()
            o.put("id", proximoIdTabla("movimientos_inventario"))
            o.put("empresa_id", obtenerEmpresa()?.id ?: 0)
            o.put("producto_id", productoId)
            o.put("tipo", tipo)
            o.put("cantidad", cantidad)
            o.put("stock_anterior", stockAnterior)
            o.put("stock_nuevo", stockNuevo)
            o.put("referencia", referencia)
            o.put("usuario_id", usuarioId())
            o.put("notas", notas)
            o.put("fecha", fechaHoraIsoActual())
            uniformarFilas(o, "movimientos_inventario")
            movs.put(o)
            guardarTabla("movimientos_inventario", movs)
            guardar(context)
            version++
        } catch (e: Exception) {
            Log.e(TAG, "registrarMovimiento: ${e.message}", e)
        }
    }

    fun obtenerMovimientos(): List<MovimientoOffline> {
        val arr = obtenerTabla("movimientos_inventario")
        val productos = obtenerProductos().associateBy { it.id }
        val lista = mutableListOf<MovimientoOffline>()
        for (i in 0 until arr.length()) {
            val o = arr.optJSONObject(i) ?: continue
            val pid = o.optInt("producto_id")
            lista.add(
                MovimientoOffline(
                    id = o.optInt("id"),
                    productoId = pid,
                    productoNombre = productos[pid]?.nombre ?: "Producto $pid",
                    tipo = o.optString("tipo", ""),
                    cantidad = o.optString("cantidad").toDoubleOrNull() ?: 0.0,
                    stockAnterior = o.optString("stock_anterior").toDoubleOrNull() ?: 0.0,
                    stockNuevo = o.optString("stock_nuevo").toDoubleOrNull() ?: 0.0,
                    referencia = o.optString("referencia", ""),
                    notas = o.optString("notas", ""),
                    fecha = o.optString("fecha", "")
                )
            )
        }
        return lista.sortedByDescending { it.fecha }
    }
}
