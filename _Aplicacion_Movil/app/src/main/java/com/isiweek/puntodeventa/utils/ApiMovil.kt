package com.isiweek.puntodeventa.utils

import org.json.JSONObject
import java.io.BufferedReader
import java.io.InputStreamReader
import java.net.HttpURLConnection
import java.net.URL

/**
 * Cliente HTTP simple (HttpURLConnection, sin dependencias) para la seccion
 * "Opcion 1" de Configuracion: login online contra el servidor y descarga
 * del JSON de la empresa para importarlo en la app offline.
 */
object ApiMovil {

    /** URL base del servidor web (Next.js). Cambiar segun despliegue. */
    const val BASE_URL = "http://72.62.128.63:3000"

    private const val TIMEOUT_MS = 60000

    /** Resultado del login online. */
    data class SesionMovil(
        val exito: Boolean,
        val mensaje: String,
        val usuario: JSONObject?,
        val empresa: JSONObject?
    )

    /** Llama a /api/movil/login con correo y contrasena. */
    suspend fun login(email: String, password: String): SesionMovil {
        val cuerpo = JSONObject().put("email", email).put("password", password)
        val (codigo, texto) = peticionPost(
            "$BASE_URL/api/movil/login",
            cuerpo
        )
        val json = parsearJson(texto)
        if (json == null) {
            return SesionMovil(false, mensajeRespuestaInvalida(codigo, texto), null, null)
        }
        val exito = json.optBoolean("success", false)
        return SesionMovil(
            exito = exito,
            mensaje = json.optString("mensaje", "Error"),
            usuario = json.optJSONObject("usuario"),
            empresa = json.optJSONObject("empresa")
        )
    }

    /** Llama a /api/movil/descargar y devuelve el texto JSON de la base de datos completa. */
    suspend fun descargar(email: String, password: String): ResultadoDescarga {
        val cuerpo = JSONObject().put("email", email).put("password", password)
        val (codigo, texto) = peticionPost(
            "$BASE_URL/api/movil/descargar",
            cuerpo
        )
        val json = parsearJson(texto)
        if (json == null) {
            return ResultadoDescarga(false, mensajeRespuestaInvalida(codigo, texto), null)
        }
        val exito = json.optBoolean("success", false)
        if (exito) {
            val datos = json.optJSONObject("datos")
            if (datos != null) {
                return ResultadoDescarga(true, json.optString("mensaje", "OK"), datos.toString())
            } else {
                return ResultadoDescarga(false, "La respuesta no contiene los datos", null)
            }
        } else {
            return ResultadoDescarga(false, json.optString("mensaje", "Error"), null)
        }
    }

    data class ResultadoDescarga(
        val exito: Boolean,
        val mensaje: String,
        val textoJson: String?,
        val tablas: List<String> = emptyList()
    )

    /** Llama a /api/movil/subir con la base de datos modificada y la sube a la web.
     *  Al terminar bien, la web vuelve a poner la empresa online. */
    suspend fun subir(email: String, password: String, baseDatos: JSONObject): ResultadoDescarga {
        val cuerpo = JSONObject()
            .put("email", email)
            .put("password", password)
            .put("baseDatos", baseDatos)
        val (codigo, texto) = peticionPost(
            "$BASE_URL/api/movil/subir",
            cuerpo
        )
        val json = parsearJson(texto)
        if (json == null) {
            return ResultadoDescarga(false, mensajeRespuestaInvalida(codigo, texto), null)
        }
        val exito = json.optBoolean("success", false)
        val tablas = if (exito) {
            val arr = json.optJSONArray("tablas")
            if (arr != null) {
                (0 until arr.length()).map { arr.optString(it) }
            } else {
                emptyList()
            }
        } else {
            emptyList()
        }
        return ResultadoDescarga(exito, json.optString("mensaje", "Error"), null, tablas)
    }

    /** Llama a /api/movil/ponerOnline para volver a poner la empresa ONLINE en la web. */
    suspend fun ponerOnline(email: String, password: String): ResultadoDescarga {
        val cuerpo = JSONObject()
            .put("email", email)
            .put("password", password)
        val (codigo, texto) = peticionPost(
            "$BASE_URL/api/movil/ponerOnline",
            cuerpo
        )
        val json = parsearJson(texto)
        if (json == null) {
            return ResultadoDescarga(false, mensajeRespuestaInvalida(codigo, texto), null)
        }
        val exito = json.optBoolean("success", false)
        return ResultadoDescarga(exito, json.optString("mensaje", "Error"), null)
    }

    /**
     * Realiza el POST y devuelve (codigoHTTP, cuerpo). Si hay error de red,
     * lanza una excepcion con un mensaje claro (la captura el llamador).
     */
    private suspend fun peticionPost(urlString: String, cuerpo: JSONObject): Pair<Int, String> {
        return withContextIO {
            var conn: HttpURLConnection? = null
            try {
                conn = URL(urlString).openConnection() as HttpURLConnection
                conn.requestMethod = "POST"
                conn.connectTimeout = TIMEOUT_MS
                conn.readTimeout = TIMEOUT_MS
                conn.doOutput = true
                conn.setRequestProperty("Content-Type", "application/json")
                conn.setRequestProperty("Accept", "application/json")

                val payload = cuerpo.toString()
                conn.outputStream.use { out ->
                    out.write(payload.toByteArray(Charsets.UTF_8))
                }

                val code = conn.responseCode
                val stream = if (code in 200..299) conn.inputStream else conn.errorStream
                val body = stream?.let {
                    BufferedReader(InputStreamReader(it, Charsets.UTF_8)).use { r -> r.readText() }
                } ?: ""
                code to body
            } finally {
                conn?.disconnect()
            }
        }
    }

    /**
     * Intenta interpretar el cuerpo como JSON. Si no es JSON (HTML, texto plano,
     * vacio), devuelve null para no reventar con JSONException.
     */
    private fun parsearJson(texto: String): JSONObject? {
        val limpio = texto.trim()
        if (limpio.isEmpty()) return null
        return try {
            JSONObject(limpio)
        } catch (e: Exception) {
            null
        }
    }

    /** Mensaje claro cuando el servidor no devuelve un JSON valido. */
    private fun mensajeRespuestaInvalida(codigo: Int, texto: String): String {
        val limpio = texto.trim()
        val esHtml = limpio.startsWith("<!DOCTYPE") || limpio.startsWith("<html") ||
            limpio.contains("<body")
        val detalle = if (limpio.length > 120) limpio.take(120) + "..." else limpio
        return "El servidor respondio con un error (HTTP $codigo, ${if (esHtml) "pagina no encontrada o error del servidor" else "respuesta no JSON"}). Verifica la URL del servidor y que la API este desplegada. Detalle: $detalle"
    }

    private suspend fun <T> withContextIO(bloque: () -> T): T =
        kotlinx.coroutines.withContext(kotlinx.coroutines.Dispatchers.IO) { bloque() }
}
