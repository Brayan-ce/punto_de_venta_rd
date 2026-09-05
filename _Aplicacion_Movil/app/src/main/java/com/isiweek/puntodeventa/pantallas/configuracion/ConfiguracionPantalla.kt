package com.isiweek.puntodeventa.pantallas.configuracion

import android.net.Uri
import android.util.Log
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.RowScope
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.outlined.ArrowBack
import androidx.compose.material.icons.outlined.CheckCircle
import androidx.compose.material.icons.outlined.CloudOff
import androidx.compose.material.icons.outlined.CloudSync
import androidx.compose.material.icons.outlined.CloudUpload
import androidx.compose.material.icons.outlined.Delete
import androidx.compose.material.icons.outlined.Email
import androidx.compose.material.icons.outlined.FolderOpen
import androidx.compose.material.icons.outlined.Lock
import androidx.compose.material.icons.outlined.KeyboardArrowDown
import androidx.compose.material.icons.outlined.KeyboardArrowUp
import androidx.compose.material.icons.outlined.Login
import androidx.compose.material.icons.outlined.Person
import androidx.compose.material.icons.outlined.Settings
import androidx.compose.material.icons.outlined.Visibility
import androidx.compose.material.icons.outlined.VisibilityOff
import androidx.compose.material.icons.outlined.Warning
import androidx.compose.material3.Checkbox
import androidx.compose.material3.CheckboxDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import com.isiweek.puntodeventa.i18n.Idioma
import com.isiweek.puntodeventa.i18n.Traducciones
import com.isiweek.puntodeventa.offline.RepositorioOffline
import com.isiweek.puntodeventa.ui.componentes.TokensWeb
import com.isiweek.puntodeventa.utils.ApiMovil
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import java.io.File

@Composable
fun ConfiguracionPantalla(
    idioma: Idioma,
    oscuro: Boolean,
    onVolver: () -> Unit
) {
    val t = TokensWeb(
        fondoPrincipal = if (oscuro) Color(0xFF1E293B) else Color(0xFFFFFFFF),
        fondoElevado = if (oscuro) Color(0xFF1E293B) else Color(0xFFFFFFFF),
        fondoTerciario = if (oscuro) Color(0xFF334155) else Color(0xFFF1F5F9),
        fondoContenido = if (oscuro) Color(0xFF0F172A) else Color(0xFFF8FAFC),
        textoPrimario = if (oscuro) Color(0xFFF1F5F9) else Color(0xFF0F172A),
        textoSecundario = if (oscuro) Color(0xFFCBD5E1) else Color(0xFF475569),
        textoTerciario = if (oscuro) Color(0xFF94A3B8) else Color(0xFF94A3B8),
        bordeClaro = if (oscuro) Color(0xFF334155) else Color(0xFFE5E7EB),
        bordeMedio = if (oscuro) Color(0xFF475569) else Color(0xFFD1D5DB),
        primario = Color(0xFF2563EB),
        primarioClaro = if (oscuro) Color(0xFF2563EB).copy(alpha = 0.15f) else Color(0xFFDBEAFE),
        exito = Color(0xFF10B981)
    )

    val context = LocalContext.current
    val ambito = rememberCoroutineScope()

    var importando by remember { mutableStateOf(false) }
    var progreso by remember { mutableIntStateOf(0) }
    var bdImportada by remember { mutableStateOf(false) }
    var mensajeInfo by remember { mutableStateOf("") }
    var nombreArchivo by remember { mutableStateOf("") }
    var errorImport by remember { mutableStateOf("") }
    var resumenDatos by remember { mutableStateOf(listOf<Pair<String, Int>>()) }
    var exportando by remember { mutableStateOf(false) }
    var mensajeExport by remember { mutableStateOf("") }
    var sincronizandoApp by remember { mutableStateOf(false) }
    var mensajeSyncApp by remember { mutableStateOf("") }
    var mostrarModalJson by remember { mutableStateOf(false) }
    var mostrarModalSync by remember { mutableStateOf(false) }
    var mostrarModalBorrar by remember { mutableStateOf(false) }
    var mostrarModalBorrado by remember { mutableStateOf(false) }
    var borrando by remember { mutableStateOf(false) }
    var opcionActiva by remember { mutableIntStateOf(0) }

    // ===== Estado del login online (Opción 1) =====
    var correoLogin by remember { mutableStateOf("") }
    var passwordLogin by remember { mutableStateOf("") }
    var ingresandoLogin by remember { mutableStateOf(false) }
    var errorLogin by remember { mutableStateOf("") }
    var sesionMovil by remember { mutableStateOf<ApiMovil.SesionMovil?>(null) }
    var importandoDatos by remember { mutableStateOf(false) }
    var mensajeImportar by remember { mutableStateOf("") }
    var errorImportar by remember { mutableStateOf("") }
    var subiendoDatos by remember { mutableStateOf(false) }
    var mensajeSubir by remember { mutableStateOf("") }
    var recordarme by remember { mutableStateOf(true) }
    var expandirDatos by remember { mutableStateOf(false) }
    var mostrarModalSubir by remember { mutableStateOf(false) }
    var tablasSubidas by remember { mutableStateOf(0) }
    var totalTablasSubir by remember { mutableStateOf(0) }
    var errorSubir by remember { mutableStateOf("") }
    var poniendoOnline by remember { mutableStateOf(false) }
    var mensajeOnline by remember { mutableStateOf("") }
    var errorOnline by remember { mutableStateOf("") }

    // Restaura la sesión de login persistida y el estado importado para que no se
    // pierdan al navegar o cerrar la app. Solo se borran con "Limpiar datos del sistema".
    LaunchedEffect(Unit) {
        val sesionGuardada = RepositorioOffline.cargarSesion(context)
        if (sesionGuardada != null) {
            if (sesionGuardada.usuario != null || sesionGuardada.empresa != null) {
                val sesion = ApiMovil.SesionMovil(
                    exito = true,
                    mensaje = "",
                    usuario = sesionGuardada.usuario,
                    empresa = sesionGuardada.empresa
                )
                sesionMovil = sesion
            }
            if (correoLogin.isEmpty()) correoLogin = sesionGuardada.correo
            if (passwordLogin.isEmpty()) passwordLogin = sesionGuardada.password
        }
        if (!bdImportada && RepositorioOffline.hayDatosOffline()) {
            bdImportada = true
            nombreArchivo = RepositorioOffline.NOMBRE_ARCHIVO
        }
        // Recalcular el resumen desde la memoria del repositorio (no del archivo),
        // para que refleje los cambios hechos en las demás secciones offline.
        if (RepositorioOffline.hayDatosOffline()) {
            resumenDatos = extraerResumenDesdeRepo()
        } else {
            resumenDatos = emptyList()
        }
    }

    // "Recuérdame": guarda correo/contraseña apenas se escriben, para que el
    // cliente no tenga que teclearlos en cada visita. Persisten aunque se limpien datos.
    LaunchedEffect(recordarme, correoLogin, passwordLogin) {
        if (recordarme && correoLogin.isNotBlank() && passwordLogin.isNotBlank()) {
            RepositorioOffline.guardarCredenciales(context, correoLogin.trim(), passwordLogin)
        }
    }

    // Los mensajes de verificación/error de "subir" y "poner online" se muestran un rato
    // y luego se limpian, para que no queden pegados al navegar o reabrir la app.
    LaunchedEffect(mensajeSubir, errorSubir, mensajeOnline, errorOnline) {
        if (mensajeSubir.isNotEmpty() || errorSubir.isNotEmpty() || mensajeOnline.isNotEmpty() || errorOnline.isNotEmpty()) {
            delay(8000)
            mensajeSubir = ""
            errorSubir = ""
            mensajeOnline = ""
            errorOnline = ""
        }
    }

    fun leerYGuardarJson(uri: Uri) {
        ambito.launch {
            importando = true
            errorImport = ""
            mensajeInfo = ""
            exportando = false
            mensajeExport = ""
            progreso = 10
            try {
                val texto = context.contentResolver.openInputStream(uri)?.bufferedReader()?.use { it.readText() }
                    ?: throw Exception("No se pudo leer el archivo")
                Log.d("PV_OFFLINE", "IMPORTAR: archivo leido, tamano=${texto.length} chars, primeros 80: ${texto.take(80).replace("\n", " ")}")
                progreso = 45
                val nombre = (context.contentResolver.query(uri, null, null, null, null)?.use { c ->
                    val idx = c.getColumnIndex(android.provider.OpenableColumns.DISPLAY_NAME)
                    if (idx >= 0 && c.moveToFirst()) c.getString(idx) else null
                }) ?: "base_datos_offline.json"
                nombreArchivo = nombre
                val archivo = File(context.filesDir, "base_datos_offline.json")
                archivo.writeText(texto)
                // Recargar el repositorio offline para que las secciones lean los datos importados
                val cargo = RepositorioOffline.cargar(context)
                Log.d("PV_OFFLINE", "IMPORTAR: cargar() resultado=$cargo, hayDatosOffline=${RepositorioOffline.hayDatosOffline()}, version=${RepositorioOffline.version}")
                val nClientes = RepositorioOffline.obtenerClientesFin().size
                Log.d("PV_OFFLINE", "IMPORTAR: clientes leidos por obtenerClientesFin()=$nClientes")
                progreso = 70
                // Generar resumen de las tablas importadas
                resumenDatos = extraerResumen(texto)
                Log.d("PV_OFFLINE", "IMPORTAR: resumen tablas=${resumenDatos.size}. Detalle: ${resumenDatos.take(20).joinToString(" | ") { "${it.first}=${it.second}" }}")
                if (resumenDatos.isEmpty()) {
                    throw Exception(Traducciones.texto("config.jsonSinTablas", idioma))
                }
                progreso = 90
                delay(300)
                progreso = 100
                bdImportada = true
                mensajeInfo = Traducciones.texto("config.exitoImportar", idioma)
                mostrarModalJson = true
            } catch (e: Exception) {
                errorImport = Traducciones.texto("config.errorImportar", idioma) + " " + (e.message ?: "")
            } finally {
                importando = false
            }
        }
    }

    fun sincronizarApp() {
        Log.d("PV_OFFLINE", "SINCRONIZAR APP: boton presionado")
        ambito.launch {
            sincronizandoApp = true
            mensajeSyncApp = ""
            try {
                // Aplicar a toda la app los datos importados: persistir y recargar el repositorio
                RepositorioOffline.guardar(context)
                val cargo = RepositorioOffline.cargar(context)
                Log.d("PV_OFFLINE", "SINCRONIZAR APP: cargar()=$cargo, hayDatosOffline=${RepositorioOffline.hayDatosOffline()}, version=${RepositorioOffline.version}")
                val nClientes = RepositorioOffline.obtenerClientesFin().size
                Log.d("PV_OFFLINE", "SINCRONIZAR APP: clientes disponibles=$nClientes")
                bdImportada = RepositorioOffline.hayDatosOffline()
                resumenDatos = extraerResumen(File(context.filesDir, RepositorioOffline.NOMBRE_ARCHIVO).readText())
                mensajeSyncApp = Traducciones.texto("config.appSincronizada", idioma)
                mostrarModalSync = true
            } catch (e: Exception) {
                Log.e("PV_OFFLINE", "SINCRONIZAR APP: ERROR ${e.message}", e)
                mensajeSyncApp = Traducciones.texto("config.errorAppSincronizar", idioma)
            } finally {
                sincronizandoApp = false
            }
        }
    }

    fun borrarTodoLocal() {
        Log.d("PV_OFFLINE", "BORRAR TODO: limpiando datos locales")
        ambito.launch {
            borrando = true
            try {
                RepositorioOffline.limpiarTodo(context)
                bdImportada = false
                resumenDatos = emptyList()
                nombreArchivo = ""
                sesionMovil = null
                mensajeInfo = ""
                mensajeSyncApp = ""
                mostrarModalBorrar = false
                mostrarModalJson = false
                mostrarModalSync = false
                mostrarModalBorrado = true
            } finally {
                borrando = false
            }
        }
    }

    val selectorArchivo = rememberLauncherForActivityResult(
        ActivityResultContracts.OpenDocument()
    ) { uri ->
        if (uri != null) leerYGuardarJson(uri)
    }

    fun iniciarSesionMovil() {
        Log.d("PV_OFFLINE", "LOGIN MOVIL: intentando iniciar sesion con ${correoLogin}")
        val correo = correoLogin.trim()
        val pass = passwordLogin
        if (correo.isEmpty() || pass.isEmpty()) {
            errorLogin = Traducciones.texto("config.loginCorreo", idioma) + " / " + Traducciones.texto("config.loginPassword", idioma) + " requeridos"
            return
        }
        ambito.launch {
            ingresandoLogin = true
            errorLogin = ""
            errorImportar = ""
            mensajeImportar = ""
            try {
                val res = ApiMovil.login(correo, pass)
                if (res.exito && res.usuario != null) {
                    sesionMovil = res
                    errorLogin = ""
                    if (recordarme) {
                        RepositorioOffline.guardarSesion(context, res.usuario, res.empresa, correo, pass)
                    } else {
                        RepositorioOffline.limpiarSesion(context)
                    }
                    Log.d("PV_OFFLINE", "LOGIN MOVIL: exito, usuario=${res.usuario.optString("email")}, tipo=${res.usuario.optString("tipo")}")
                } else {
                    sesionMovil = null
                    errorLogin = res.mensaje.ifBlank { Traducciones.texto("config.loginSoloAdmin", idioma) }
                }
            } catch (e: Exception) {
                sesionMovil = null
                errorLogin = Traducciones.texto("config.loginErrorConexion", idioma) + " " + (e.message ?: "")
            } finally {
                ingresandoLogin = false
            }
        }
    }

    fun importarDatosCuenta() {
        val sesion = sesionMovil
        val correo = correoLogin.trim()
        val pass = passwordLogin
        if (sesion == null || correo.isEmpty() || pass.isEmpty()) return
        ambito.launch {
            importandoDatos = true
            mensajeImportar = ""
            errorImportar = ""
            try {
                val res = ApiMovil.descargar(correo, pass)
                if (res.exito && res.textoJson != null) {
                    val texto = res.textoJson
                    val archivo = File(context.filesDir, "base_datos_offline.json")
                    archivo.writeText(texto)
                    val cargo = RepositorioOffline.cargar(context)
                    Log.d("PV_OFFLINE", "IMPORTAR CUENTA: cargar()=$cargo, hayDatos=${RepositorioOffline.hayDatosOffline()}, clientes=${RepositorioOffline.obtenerClientesFin().size}")
                    if (RepositorioOffline.hayDatosOffline()) {
                        bdImportada = true
                        nombreArchivo = "base_datos_offline.json"
                        resumenDatos = extraerResumen(texto)
                        mensajeImportar = Traducciones.texto("config.importarExito", idioma)
                    } else {
                        errorImportar = Traducciones.texto("config.importarError", idioma)
                    }
                } else {
                    errorImportar = res.mensaje.ifBlank { Traducciones.texto("config.importarError", idioma) }
                }
            } catch (e: Exception) {
                errorImportar = Traducciones.texto("config.importarError", idioma) + " " + (e.message ?: "")
            } finally {
                importandoDatos = false
            }
        }
    }

    fun subirCambios() {
        val sesion = sesionMovil
        val correo = correoLogin.trim()
        val pass = passwordLogin
        if (sesion == null) return
        ambito.launch {
            subiendoDatos = true
            mensajeSubir = ""
            errorSubir = ""
            try {
                if (correo.isEmpty() || pass.isEmpty()) {
                    errorSubir = Traducciones.texto("config.loginCorreo", idioma) + " / " + Traducciones.texto("config.loginPassword", idioma) + " requeridos"
                    return@launch
                }
                // Comparar contra las credenciales guardadas localmente al importar
                val guardada = RepositorioOffline.cargarSesion(context)
                if (guardada != null) {
                    val co = guardada.correo.trim()
                    val pa = guardada.password
                    if (co.isNotEmpty() && (co != correo || pa != pass)) {
                        errorSubir = Traducciones.texto("config.credencialesNoCoinciden", idioma)
                        return@launch
                    }
                }
                // Persistir primero los cambios en memoria al archivo, y subir DESDE la
                // memoria del repositorio (igual que la lista mostrada) para que nunca
                // suba una versión desactualizada del archivo.
                RepositorioOffline.guardar(context)
                val texto = RepositorioOffline.jsonCompleto()
                if (texto.isNullOrBlank()) {
                    errorSubir = Traducciones.texto("config.subirError", idioma)
                    return@launch
                }
                val baseDatos = org.json.JSONObject(texto)
                RepositorioOffline.sanearFechasParaSubir(baseDatos)
                val res = ApiMovil.subir(correo, pass, baseDatos)
                if (res.exito) {
                    mensajeSubir = Traducciones.texto("config.subirExito", idioma)
                    tablasSubidas = res.tablas.size
                    totalTablasSubir = baseDatos.optJSONObject("tablas")?.length() ?: res.tablas.size
                    mostrarModalSubir = true
                } else {
                    errorSubir = res.mensaje.ifBlank { Traducciones.texto("config.subirError", idioma) }
                }
            } catch (e: Exception) {
                errorSubir = Traducciones.texto("config.subirError", idioma) + " " + (e.message ?: "")
            } finally {
                subiendoDatos = false
            }
        }
    }

    fun ponerOnlineSistema() {
        val sesion = sesionMovil
        val correo = correoLogin.trim()
        val pass = passwordLogin
        if (sesion == null) return
        ambito.launch {
            poniendoOnline = true
            mensajeOnline = ""
            errorOnline = ""
            try {
                if (correo.isEmpty() || pass.isEmpty()) {
                    errorOnline = Traducciones.texto("config.loginCorreo", idioma) + " / " + Traducciones.texto("config.loginPassword", idioma) + " requeridos"
                    return@launch
                }
                val res = ApiMovil.ponerOnline(correo, pass)
                if (res.exito) {
                    // Limpiar los datos locales: la web vuelve a estar online y el sistema queda limpio.
                    RepositorioOffline.limpiarTodo(context)
                    bdImportada = false
                    resumenDatos = emptyList()
                    nombreArchivo = ""
                    sesionMovil = null
                    mensajeOnline = Traducciones.texto("config.onlineExito", idioma)
                } else {
                    errorOnline = res.mensaje.ifBlank { Traducciones.texto("config.onlineError", idioma) }
                }
            } catch (e: Exception) {
                errorOnline = Traducciones.texto("config.onlineError", idioma) + " " + (e.message ?: "")
            } finally {
                poniendoOnline = false
            }
        }
    }

    // Exportar el JSON modificado (guardado localmente) a un archivo elegido por el usuario
    val selectorGuardar = rememberLauncherForActivityResult(
        ActivityResultContracts.CreateDocument("application/json")
    ) { uri ->
        if (uri != null) {
            ambito.launch {
                exportando = true
                mensajeExport = ""
                try {
                    // Persistir los cambios en memoria al archivo antes de exportar
                    RepositorioOffline.guardar(context)
                    val archivo = File(context.filesDir, "base_datos_offline.json")
                    if (archivo.exists()) {
                        context.contentResolver.openOutputStream(uri)?.use { out ->
                            out.write(archivo.readBytes())
                        }
                        mensajeExport = Traducciones.texto("config.exitoExportar", idioma)
                    } else {
                        mensajeExport = Traducciones.texto("config.errorExportar", idioma)
                    }
                } catch (e: Exception) {
                    mensajeExport = Traducciones.texto("config.errorExportar", idioma) + " " + (e.message ?: "")
                } finally {
                    exportando = false
                }
            }
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(t.fondoContenido)
    ) {
        LazyColumn(
            modifier = Modifier
                .fillMaxWidth()
                .weight(1f),
            contentPadding = PaddingValues(top = 16.dp, bottom = 24.dp)
        ) {
            // Título de la pantalla
            item {
                Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.padding(horizontal = 16.dp)) {
                    Box(
                        modifier = Modifier
                            .size(40.dp)
                            .background(t.primarioClaro, RoundedCornerShape(10.dp)),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(Icons.Outlined.Settings, contentDescription = null, tint = t.primario, modifier = Modifier.size(22.dp))
                    }
                    Spacer(Modifier.width(12.dp))
                    Column {
                        Text(Traducciones.texto("config.titulo", idioma), fontSize = 20.sp, fontWeight = FontWeight.ExtraBold, color = t.textoPrimario)
                        Text(Traducciones.texto("config.subtitulo", idioma), fontSize = 13.sp, color = t.textoSecundario)
                    }
                }
            }

            item { SpacerItem(12) }

            // ================= PESTAÑAS: OPCIÓN 1 / OPCIÓN 2 =================
            item {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 14.dp)
                        .background(t.fondoElevado, RoundedCornerShape(12.dp))
                        .border(1.dp, t.bordeClaro, RoundedCornerShape(12.dp))
                        .padding(4.dp),
                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    PestañaConfig(
                        etiqueta = Traducciones.texto("config.opcion1", idioma),
                        seleccionada = opcionActiva == 0,
                        t = t,
                        oscuro = oscuro,
                        onClick = { opcionActiva = 0 }
                    )
                    PestañaConfig(
                        etiqueta = Traducciones.texto("config.opcion2", idioma),
                        seleccionada = opcionActiva == 1,
                        t = t,
                        oscuro = oscuro,
                        onClick = { opcionActiva = 1 }
                    )
                }
            }

            item { SpacerItem(12) }

            // ================= OPCIÓN 1: login online para importar datos =================
            if (opcionActiva == 0) {
                item {
                    SeccionLoginCuenta(
                        idioma = idioma,
                        oscuro = oscuro,
                        t = t,
                        correoLogin = correoLogin,
                        onCorreo = { correoLogin = it },
                        passwordLogin = passwordLogin,
                        onPassword = { passwordLogin = it },
                        recordarme = recordarme,
                        onRecordarme = {
                            recordarme = it
                            if (!it) RepositorioOffline.limpiarCredenciales(context)
                        },
                        expandirDatos = expandirDatos,
                        onExpandirDatos = { expandirDatos = it },
                        ingresandoLogin = ingresandoLogin,
                        errorLogin = errorLogin,
                        sesionMovil = sesionMovil,
                        importandoDatos = importandoDatos,
                        mensajeImportar = mensajeImportar,
                        errorImportar = errorImportar,
                        subiendoDatos = subiendoDatos,
                        mensajeSubir = mensajeSubir,
                        errorSubir = errorSubir,
                        poniendoOnline = poniendoOnline,
                        mensajeOnline = mensajeOnline,
                        errorOnline = errorOnline,
                        resumenDatos = resumenDatos,
                        bdImportada = bdImportada,
                        limpiando = borrando,
                        onIniciar = { iniciarSesionMovil() },
                        onImportar = { importarDatosCuenta() },
                        onSubir = { subirCambios() },
                        onPonerOnline = { ponerOnlineSistema() },
                        onLimpiar = { mostrarModalBorrar = true }
                    )
                }
            }

            // ================= OPCIÓN 2: modo offline y subida de JSON =================
            if (opcionActiva == 1) {

            // ================= MODO OFFLINE =================
            item {
                Text(
                    text = Traducciones.texto("config.modoOffline", idioma).uppercase(),
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                    color = t.textoTerciario,
                    modifier = Modifier.padding(horizontal = 16.dp, vertical = 6.dp)
                )
            }

            // Cómo usar
            item {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 14.dp)
                        .background(if (oscuro) Color(0xFF1E293B) else Color(0xFFFFFBEB), RoundedCornerShape(10.dp))
                        .border(1.dp, if (oscuro) Color(0xFF92400E) else Color(0xFFFDE68A), RoundedCornerShape(10.dp))
                        .padding(14.dp)
                ) {
                    Text(
                        text = Traducciones.texto("config.comoUsar", idioma),
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Bold,
                        color = if (oscuro) Color(0xFFFBBF24) else Color(0xFF92400E),
                        modifier = Modifier.padding(bottom = 8.dp)
                    )
                    Text(text = "1. " + Traducciones.texto("config.paso1", idioma), fontSize = 12.sp, lineHeight = 16.sp, color = if (oscuro) Color(0xFFFBBF24) else Color(0xFF92400E))
                    Text(text = "2. " + Traducciones.texto("config.paso2", idioma), fontSize = 12.sp, lineHeight = 16.sp, color = if (oscuro) Color(0xFFFBBF24) else Color(0xFF92400E))
                    Text(text = "3. " + Traducciones.texto("config.paso3", idioma), fontSize = 12.sp, lineHeight = 16.sp, color = if (oscuro) Color(0xFFFBBF24) else Color(0xFF92400E))
                }
            }

            item { SpacerItem(12) }

            // Aviso modo offline activo
            item {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 14.dp)
                        .background(if (oscuro) Color(0xFF064E3B) else Color(0xFFECFDF5), RoundedCornerShape(10.dp))
                        .border(1.dp, if (oscuro) Color(0xFF047857) else Color(0xFFA7F3D0), RoundedCornerShape(10.dp))
                        .padding(14.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        Icons.Outlined.CloudOff,
                        contentDescription = null,
                        tint = Color(0xFF10B981),
                        modifier = Modifier.size(22.dp)
                    )
                    Spacer(Modifier.width(10.dp))
                    Text(
                        text = Traducciones.texto("config.avisoModoActivo", idioma),
                        fontSize = 13.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = if (oscuro) Color(0xFF6EE7B7) else Color(0xFF065F46),
                        modifier = Modifier.weight(1f)
                    )
                }
            }

            item { SpacerItem(10) }

            // ================= IMPORTAR BASE DE DATOS =================
            item {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 14.dp)
                        .background(t.fondoElevado, RoundedCornerShape(16.dp))
                        .border(1.dp, t.bordeClaro, RoundedCornerShape(16.dp))
                ) {
                    Column(modifier = Modifier.padding(20.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Box(
                                modifier = Modifier
                                    .size(46.dp)
                                    .background(Color(0xFFF97316).copy(alpha = 0.15f), RoundedCornerShape(12.dp)),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(Icons.Outlined.CloudUpload, contentDescription = null, tint = Color(0xFFF97316), modifier = Modifier.size(26.dp))
                            }
                            Spacer(Modifier.width(12.dp))
                            Column(Modifier.weight(1f)) {
                                Text(Traducciones.texto("config.importarBD", idioma), fontSize = 17.sp, fontWeight = FontWeight.ExtraBold, color = t.textoPrimario)
                                Text(Traducciones.texto("config.descImportarBD", idioma), fontSize = 12.sp, lineHeight = 16.sp, color = t.textoSecundario)
                            }
                        }

                        Spacer(Modifier.height(16.dp))

                        // ===== ZONA DE CARGA =====
                        // Solo se muestra cuando aún no hay datos locales (o mientras se importa).
                        // Si ya se importó un JSON y no se borró local, no se pide importar de nuevo.
                        if (!bdImportada || importando) {
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .background(if (oscuro) Color(0xFF0F172A) else Color(0xFFF8FAFC), RoundedCornerShape(14.dp))
                                .border(
                                    width = if (importando) 1.dp else 2.dp,
                                    color = if (importando) t.bordeMedio else Color(0xFFF97316),
                                    shape = RoundedCornerShape(14.dp)
                                )
                                .clickable { if (!importando) selectorArchivo.launch(arrayOf("*/*")) }
                                .padding(vertical = 26.dp, horizontal = 16.dp),
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(56.dp)
                                    .background(if (oscuro) Color(0xFF1E293B) else Color(0xFFFFEDD5), RoundedCornerShape(28.dp)),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(
                                    if (importando) Icons.Outlined.CloudUpload else Icons.Outlined.FolderOpen,
                                    contentDescription = null,
                                    tint = Color(0xFFF97316),
                                    modifier = Modifier.size(28.dp)
                                )
                            }
                            Spacer(Modifier.height(12.dp))
                            Text(
                                text = Traducciones.texto("config.seleccionaJSON", idioma),
                                fontSize = 14.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = t.textoPrimario,
                                textAlign = TextAlign.Center
                            )
                            Spacer(Modifier.height(4.dp))
                            Text(
                                text = if (importando) Traducciones.texto("config.importando", idioma)
                                else if (nombreArchivo.isNotEmpty()) nombreArchivo
                                else Traducciones.texto("config.tocarImportar", idioma),
                                fontSize = 12.sp,
                                color = if (nombreArchivo.isNotEmpty()) Color(0xFFF97316) else t.textoSecundario,
                                fontWeight = if (nombreArchivo.isNotEmpty()) FontWeight.Bold else FontWeight.Normal,
                                textAlign = TextAlign.Center,
                                maxLines = 2
                            )
                        }

                        // Barra de progreso
                        if (importando) {
                            Spacer(Modifier.height(12.dp))
                            LinearProgressIndicator(
                                progress = { progreso / 100f },
                                modifier = Modifier.fillMaxWidth(),
                                color = Color(0xFFF97316),
                                trackColor = if (oscuro) Color(0xFF334155) else Color(0xFFE2E8F0)
                            )
                            Spacer(Modifier.height(4.dp))
                            Text("$progreso% · " + Traducciones.texto("config.tiempoCarga", idioma), fontSize = 11.sp, fontWeight = FontWeight.SemiBold, color = t.textoSecundario)
                        }

                        // Mensaje de resultado
                        if (mensajeInfo.isNotEmpty()) {
                            Spacer(Modifier.height(12.dp))
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .background(if (oscuro) Color(0xFF064E3B) else Color(0xFFECFDF5), RoundedCornerShape(10.dp))
                                    .border(1.dp, if (oscuro) Color(0xFF047857) else Color(0xFFA7F3D0), RoundedCornerShape(10.dp))
                                    .padding(12.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Icon(Icons.Outlined.CheckCircle, contentDescription = null, tint = Color(0xFF10B981), modifier = Modifier.size(18.dp))
                                Spacer(Modifier.width(8.dp))
                                Text(mensajeInfo, color = if (oscuro) Color(0xFF6EE7B7) else Color(0xFF065F46), fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
                            }
                        }

                        // Error
                        if (errorImport.isNotEmpty()) {
                            Spacer(Modifier.height(12.dp))
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .background(Color(0xFFEF4444).copy(alpha = 0.1f), RoundedCornerShape(10.dp))
                                    .border(1.dp, Color(0xFFEF4444).copy(alpha = 0.2f), RoundedCornerShape(10.dp))
                                    .padding(12.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Icon(Icons.Outlined.Warning, contentDescription = null, tint = Color(0xFFEF4444), modifier = Modifier.size(18.dp))
                                Spacer(Modifier.width(8.dp))
                                Text(errorImport, color = Color(0xFFEF4444), fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
                            }
                        }
                        }

                        // ====== TARJETA DE CONFIGURACIÓN DE LA EMPRESA ======
                        if (bdImportada) {
                            Spacer(Modifier.height(18.dp))
                            val empresa = RepositorioOffline.obtenerEmpresa()
                            Column(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .background(if (oscuro) Color(0xFF1E293B) else Color(0xFFF0FDF4), RoundedCornerShape(12.dp))
                                    .border(1.dp, if (oscuro) Color(0xFF047857) else Color(0xFFBBF7D0), RoundedCornerShape(12.dp))
                                    .padding(14.dp)
                            ) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Box(
                                        modifier = Modifier
                                            .size(44.dp)
                                            .background(if (oscuro) Color(0xFF064E3B) else Color(0xFF10B981), RoundedCornerShape(10.dp)),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Text(
                                            text = RepositorioOffline.simboloMoneda(),
                                            fontSize = 15.sp,
                                            fontWeight = FontWeight.ExtraBold,
                                            color = Color.White
                                        )
                                    }
                                    Spacer(Modifier.width(12.dp))
                                    Column {
                                        Text(
                                            text = empresa?.nombre?.takeIf { it.isNotBlank() } ?: Traducciones.texto("config.empresaNombre", idioma),
                                            fontSize = 15.sp,
                                            fontWeight = FontWeight.ExtraBold,
                                            color = t.textoPrimario
                                        )
                                        Text(
                                            text = Traducciones.texto("config.monedaConfigTitulo", idioma),
                                            fontSize = 11.sp,
                                            fontWeight = FontWeight.SemiBold,
                                            color = if (oscuro) Color(0xFF6EE7B7) else Color(0xFF065F46)
                                        )
                                    }
                                }
                                Spacer(Modifier.height(12.dp))
                                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                                    FichaConfig(
                                        etiqueta = Traducciones.texto("config.moneda", idioma),
                                        valor = RepositorioOffline.moneda(),
                                        t = t,
                                        oscuro = oscuro
                                    )
                                    FichaConfig(
                                        etiqueta = Traducciones.texto("config.simbolo", idioma),
                                        valor = RepositorioOffline.simboloMoneda(),
                                        t = t,
                                        oscuro = oscuro
                                    )
                                }
                            }
                        }

                        // ====== RESUMEN DE DATOS IMPORTADOS ======
                        if (bdImportada && resumenDatos.isNotEmpty()) {
                            Spacer(Modifier.height(16.dp))
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .background(if (oscuro) Color(0xFF0F172A) else Color(0xFFF8FAFC), RoundedCornerShape(12.dp))
                                    .border(1.dp, t.bordeClaro, RoundedCornerShape(12.dp))
                                    .padding(12.dp)
                            ) {
                                Column {
                                    Row(
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .clickable { expandirDatos = !expandirDatos },
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Text(
                                            text = Traducciones.texto("config.resumenDatos", idioma),
                                            fontSize = 13.sp,
                                            fontWeight = FontWeight.Bold,
                                            color = t.textoPrimario,
                                            modifier = Modifier.weight(1f)
                                        )
                                        Text(
                                            text = if (expandirDatos) Traducciones.texto("config.ocultarDatos", idioma) else Traducciones.texto("config.expandirDatos", idioma),
                                            fontSize = 12.sp,
                                            color = t.primario,
                                            fontWeight = FontWeight.SemiBold
                                        )
                                        Icon(
                                            imageVector = if (expandirDatos) Icons.Outlined.KeyboardArrowUp else Icons.Outlined.KeyboardArrowDown,
                                            contentDescription = null,
                                            tint = t.primario,
                                            modifier = Modifier.size(18.dp)
                                        )
                                    }
                                    if (expandirDatos) {
                                        resumenDatos.forEach { (tabla, cantidad) ->
                                            Row(
                                                modifier = Modifier
                                                    .fillMaxWidth()
                                                    .padding(vertical = 3.dp),
                                                verticalAlignment = Alignment.CenterVertically
                                            ) {
                                                Text(
                                                    text = tabla,
                                                    fontSize = 12.sp,
                                                    color = t.textoSecundario,
                                                    modifier = Modifier.weight(1f)
                                                )
                                                Text(
                                                    text = cantidad.toString(),
                                                    fontSize = 12.sp,
                                                    fontWeight = FontWeight.Bold,
                                                    color = t.textoPrimario
                                                )
                                            }
                                        }
                                    }
                                }
                            }
                        }

                        // ====== BOTÓN DESCARGAR JSON MODIFICADO ======
                        if (bdImportada) {
                            Spacer(Modifier.height(14.dp))
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .background(if (oscuro) Color(0xFF0F172A) else Color(0xFFEFF6FF), RoundedCornerShape(10.dp))
                                    .border(1.dp, Color(0xFF2563EB), RoundedCornerShape(10.dp))
                                    .clickable { if (!exportando) selectorGuardar.launch("base_datos_offline_modificado.json") }
                                    .padding(vertical = 12.dp),
                                horizontalArrangement = Arrangement.Center,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Icon(Icons.Outlined.CloudUpload, contentDescription = null, tint = Color(0xFF2563EB), modifier = Modifier.size(18.dp))
                                Spacer(Modifier.width(6.dp))
                                Text(
                                    text = if (exportando) Traducciones.texto("config.exportando", idioma) else Traducciones.texto("config.descargarJson", idioma),
                                    color = Color(0xFF2563EB), fontSize = 14.sp, fontWeight = FontWeight.Bold
                                )
                            }
                            if (mensajeExport.isNotEmpty()) {
                                Spacer(Modifier.height(8.dp))
                                Text(mensajeExport, fontSize = 12.sp, fontWeight = FontWeight.SemiBold, color = t.textoSecundario)
                            }
                        }

                        // ====== BOTÓN SINCRONIZAR CON LA APP MÓVIL ======
                        if (bdImportada) {
                            Spacer(Modifier.height(14.dp))
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .background(Color(0xFF10B981), RoundedCornerShape(10.dp))
                                    .clickable { if (!sincronizandoApp) sincronizarApp() }
                                    .padding(vertical = 12.dp),
                                horizontalArrangement = Arrangement.Center,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Icon(Icons.Outlined.CloudSync, contentDescription = null, tint = Color.White, modifier = Modifier.size(18.dp))
                                Spacer(Modifier.width(6.dp))
                                Text(
                                    text = if (sincronizandoApp) Traducciones.texto("config.aplicandoApp", idioma) else Traducciones.texto("config.syncAppBoton", idioma),
                                    color = Color.White, fontSize = 14.sp, fontWeight = FontWeight.Bold
                                )
                            }
                            if (sincronizandoApp) {
                                Spacer(Modifier.height(10.dp))
                                LinearProgressIndicator(
                                    progress = { 0.8f },
                                    modifier = Modifier.fillMaxWidth(),
                                    color = Color(0xFF10B981),
                                    trackColor = if (oscuro) Color(0xFF334155) else Color(0xFFE2E8F0)
                                )
                            }
                            if (mensajeSyncApp.isNotEmpty() && !sincronizandoApp) {
                                Spacer(Modifier.height(10.dp))
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .background(if (oscuro) Color(0xFF064E3B) else Color(0xFFECFDF5), RoundedCornerShape(10.dp))
                                        .border(1.dp, if (oscuro) Color(0xFF047857) else Color(0xFFA7F3D0), RoundedCornerShape(10.dp))
                                        .padding(12.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Icon(Icons.Outlined.CheckCircle, contentDescription = null, tint = Color(0xFF10B981), modifier = Modifier.size(18.dp))
                                    Spacer(Modifier.width(8.dp))
                                    Text(mensajeSyncApp, color = if (oscuro) Color(0xFF6EE7B7) else Color(0xFF065F46), fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
                                }
                            }
                        }
                    }
                }
            }

            item { SpacerItem(24) }

            // ================= BORRAR TODO LOCAL =================
            item {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 14.dp)
                        .background(if (oscuro) Color(0xFF1C0F0F) else Color(0xFFFFF7F7), RoundedCornerShape(12.dp))
                        .border(1.dp, if (oscuro) Color(0xFF7F1D1D) else Color(0xFFFECACA), RoundedCornerShape(12.dp))
                ) {
                    Column(modifier = Modifier.padding(20.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Outlined.Warning, contentDescription = null, tint = Color(0xFFEF4444), modifier = Modifier.size(24.dp))
                            Spacer(Modifier.width(10.dp))
                            Column {
                                Text(Traducciones.texto("config.borrarLocal", idioma), fontSize = 16.sp, fontWeight = FontWeight.Bold, color = Color(0xFFEF4444))
                                Text(Traducciones.texto("config.descBorrarLocal", idioma), fontSize = 12.sp, color = t.textoSecundario)
                            }
                        }

                        Spacer(Modifier.height(14.dp))

                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .background(Color(0xFFEF4444), RoundedCornerShape(8.dp))
                                .clickable { if (!borrando) mostrarModalBorrar = true }
                                .padding(vertical = 12.dp),
                            horizontalArrangement = Arrangement.Center,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(Icons.Outlined.Delete, contentDescription = null, tint = Color.White, modifier = Modifier.size(18.dp))
                            Spacer(Modifier.width(6.dp))
                            Text(
                                text = if (borrando) Traducciones.texto("config.borrando", idioma) else Traducciones.texto("config.borrarLocal", idioma),
                                color = Color.White, fontSize = 14.sp, fontWeight = FontWeight.Bold
                            )
                        }
                    }
                }
            }

            item { SpacerItem(24) }

            } // fin opcionActiva == 1
        }
    }

    // ================= MODAL: JSON IMPORTADO =================
    if (mostrarModalJson) {
        Dialog(
            onDismissRequest = { mostrarModalJson = false },
            properties = DialogProperties(dismissOnClickOutside = false)
        ) {
            Box(
                modifier = Modifier.fillMaxSize().background(Color(0x8C000000)),
                contentAlignment = Alignment.Center
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp)
                        .background(t.fondoElevado, RoundedCornerShape(16.dp))
                        .border(1.dp, t.bordeClaro, RoundedCornerShape(16.dp))
                        .padding(20.dp)
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Outlined.CheckCircle, contentDescription = null, tint = Color(0xFF10B981), modifier = Modifier.size(26.dp))
                        Spacer(Modifier.width(10.dp))
                        Text(Traducciones.texto("config.modalJsonTitulo", idioma), fontSize = 17.sp, fontWeight = FontWeight.ExtraBold, color = Color(0xFF10B981), modifier = Modifier.weight(1f))
                    }
                    Spacer(Modifier.height(12.dp))
                    Text(
                        text = Traducciones.texto("config.modalJsonMensaje", idioma),
                        fontSize = 13.sp,
                        lineHeight = 18.sp,
                        color = t.textoSecundario
                    )
                    Spacer(Modifier.height(16.dp))
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(Color(0xFF10B981), RoundedCornerShape(8.dp))
                            .clickable { mostrarModalJson = false }
                            .padding(vertical = 12.dp),
                        horizontalArrangement = Arrangement.Center,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(Traducciones.texto("config.entendido", idioma), color = Color.White, fontSize = 14.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }

    // ================= MODAL: APP MÓVIL SINCRONIZADA =================
    if (mostrarModalSync) {
        Dialog(
            onDismissRequest = { mostrarModalSync = false },
            properties = DialogProperties(dismissOnClickOutside = false)
        ) {
            Box(
                modifier = Modifier.fillMaxSize().background(Color(0x8C000000)),
                contentAlignment = Alignment.Center
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp)
                        .background(t.fondoElevado, RoundedCornerShape(16.dp))
                        .border(1.dp, t.bordeClaro, RoundedCornerShape(16.dp))
                        .padding(20.dp)
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Outlined.CloudSync, contentDescription = null, tint = Color(0xFF10B981), modifier = Modifier.size(26.dp))
                        Spacer(Modifier.width(10.dp))
                        Text(Traducciones.texto("config.modalSyncTitulo", idioma), fontSize = 17.sp, fontWeight = FontWeight.ExtraBold, color = Color(0xFF10B981), modifier = Modifier.weight(1f))
                    }
                    Spacer(Modifier.height(12.dp))
                    Text(
                        text = Traducciones.texto("config.modalSyncMensaje", idioma),
                        fontSize = 13.sp,
                        lineHeight = 18.sp,
                        color = t.textoSecundario
                    )
                    Spacer(Modifier.height(16.dp))
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(Color(0xFF10B981), RoundedCornerShape(8.dp))
                            .clickable { mostrarModalSync = false }
                            .padding(vertical = 12.dp),
                        horizontalArrangement = Arrangement.Center,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(Traducciones.texto("config.entendido", idioma), color = Color.White, fontSize = 14.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }

    // ================= MODAL: DATOS SUBIDOS =================
    if (mostrarModalSubir) {
        Dialog(
            onDismissRequest = { mostrarModalSubir = false },
            properties = DialogProperties(dismissOnClickOutside = false)
        ) {
            Box(
                modifier = Modifier.fillMaxSize().background(Color(0x8C000000)),
                contentAlignment = Alignment.Center
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp)
                        .background(t.fondoElevado, RoundedCornerShape(16.dp))
                        .border(1.dp, t.bordeClaro, RoundedCornerShape(16.dp))
                        .padding(20.dp)
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Outlined.CheckCircle, contentDescription = null, tint = Color(0xFF10B981), modifier = Modifier.size(26.dp))
                        Spacer(Modifier.width(10.dp))
                        Text(Traducciones.texto("config.modalSubirTitulo", idioma), fontSize = 17.sp, fontWeight = FontWeight.ExtraBold, color = Color(0xFF10B981), modifier = Modifier.weight(1f))
                    }
                    Spacer(Modifier.height(12.dp))
                    Text(
                        text = Traducciones.texto("config.modalSubirMensaje", idioma) + " $tablasSubidas/$totalTablasSubir",
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Bold,
                        color = t.textoPrimario
                    )
                    Spacer(Modifier.height(6.dp))
                    Text(
                        text = Traducciones.texto("config.modalSubirDetalle", idioma),
                        fontSize = 13.sp,
                        lineHeight = 18.sp,
                        color = t.textoSecundario
                    )
                    Spacer(Modifier.height(16.dp))
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(Color(0xFF10B981), RoundedCornerShape(8.dp))
                            .clickable { mostrarModalSubir = false }
                            .padding(vertical = 12.dp),
                        horizontalArrangement = Arrangement.Center,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(Traducciones.texto("config.entendido", idioma), color = Color.White, fontSize = 14.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }

    // ================= MODAL: CONFIRMAR BORRADO =================
    if (mostrarModalBorrar) {
        Dialog(
            onDismissRequest = { mostrarModalBorrar = false },
            properties = DialogProperties(dismissOnClickOutside = false)
        ) {
            Box(
                modifier = Modifier.fillMaxSize().background(Color(0x8C000000)),
                contentAlignment = Alignment.Center
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp)
                        .background(t.fondoElevado, RoundedCornerShape(16.dp))
                        .border(1.dp, Color(0xFFEF4444).copy(alpha = 0.4f), RoundedCornerShape(16.dp))
                        .padding(20.dp)
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Outlined.Warning, contentDescription = null, tint = Color(0xFFEF4444), modifier = Modifier.size(26.dp))
                        Spacer(Modifier.width(10.dp))
                        Text(Traducciones.texto("config.borrarLocal", idioma), fontSize = 17.sp, fontWeight = FontWeight.ExtraBold, color = Color(0xFFEF4444), modifier = Modifier.weight(1f))
                    }
                    Spacer(Modifier.height(12.dp))
                    Text(
                        text = Traducciones.texto("config.confirmarBorrar", idioma),
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Bold,
                        color = t.textoPrimario
                    )
                    Spacer(Modifier.height(6.dp))
                    Text(
                        text = Traducciones.texto("config.confirmarBorrarDetalle", idioma),
                        fontSize = 13.sp,
                        lineHeight = 18.sp,
                        color = t.textoSecundario
                    )
                    Spacer(Modifier.height(16.dp))
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(Color(0xFFEF4444), RoundedCornerShape(8.dp))
                            .clickable { if (!borrando) borrarTodoLocal() }
                            .padding(vertical = 12.dp),
                        horizontalArrangement = Arrangement.Center,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(Icons.Outlined.Delete, contentDescription = null, tint = Color.White, modifier = Modifier.size(18.dp))
                        Spacer(Modifier.width(6.dp))
                        Text(
                            text = if (borrando) Traducciones.texto("config.borrando", idioma) else Traducciones.texto("config.borrar", idioma),
                            color = Color.White, fontSize = 14.sp, fontWeight = FontWeight.Bold
                        )
                    }
                    Spacer(Modifier.height(8.dp))
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(t.fondoTerciario, RoundedCornerShape(8.dp))
                            .clickable { mostrarModalBorrar = false }
                            .padding(vertical = 12.dp),
                        horizontalArrangement = Arrangement.Center,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(Traducciones.texto("config.cancelar", idioma), color = t.textoSecundario, fontSize = 14.sp, fontWeight = FontWeight.SemiBold)
                    }
                }
            }
        }
    }

    // ================= MODAL: DATOS BORRADOS =================
    if (mostrarModalBorrado) {
        Dialog(
            onDismissRequest = { mostrarModalBorrado = false },
            properties = DialogProperties(dismissOnClickOutside = false)
        ) {
            Box(
                modifier = Modifier.fillMaxSize().background(Color(0x8C000000)),
                contentAlignment = Alignment.Center
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp)
                        .background(t.fondoElevado, RoundedCornerShape(16.dp))
                        .border(1.dp, t.bordeClaro, RoundedCornerShape(16.dp))
                        .padding(20.dp)
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Outlined.CheckCircle, contentDescription = null, tint = Color(0xFF10B981), modifier = Modifier.size(26.dp))
                        Spacer(Modifier.width(10.dp))
                        Text(Traducciones.texto("config.datosBorradosTitulo", idioma), fontSize = 17.sp, fontWeight = FontWeight.ExtraBold, color = Color(0xFF10B981), modifier = Modifier.weight(1f))
                    }
                    Spacer(Modifier.height(12.dp))
                    Text(
                        text = Traducciones.texto("config.datosBorrados", idioma),
                        fontSize = 13.sp,
                        lineHeight = 18.sp,
                        color = t.textoSecundario
                    )
                    Spacer(Modifier.height(16.dp))
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(Color(0xFF10B981), RoundedCornerShape(8.dp))
                            .clickable { mostrarModalBorrado = false }
                            .padding(vertical = 12.dp),
                        horizontalArrangement = Arrangement.Center,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(Traducciones.texto("config.aceptar", idioma), color = Color.White, fontSize = 14.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }
}

@Composable
private fun SpacerItem(alto: Int) {
    Spacer(Modifier.height(alto.dp))
}

/** Sección Opción 1: login online con correo/contraseña y datos de la cuenta. */
@Composable
private fun SeccionLoginCuenta(
    idioma: Idioma,
    oscuro: Boolean,
    t: TokensWeb,
    correoLogin: String,
    onCorreo: (String) -> Unit,
    passwordLogin: String,
    onPassword: (String) -> Unit,
    recordarme: Boolean,
    onRecordarme: (Boolean) -> Unit,
    expandirDatos: Boolean,
    onExpandirDatos: (Boolean) -> Unit,
    ingresandoLogin: Boolean,
    errorLogin: String,
    sesionMovil: ApiMovil.SesionMovil?,
    importandoDatos: Boolean,
    mensajeImportar: String,
    errorImportar: String,
    subiendoDatos: Boolean,
    mensajeSubir: String,
    errorSubir: String,
    poniendoOnline: Boolean,
    mensajeOnline: String,
    errorOnline: String,
    resumenDatos: List<Pair<String, Int>>,
    bdImportada: Boolean,
    limpiando: Boolean,
    onIniciar: () -> Unit,
    onImportar: () -> Unit,
    onSubir: () -> Unit,
    onPonerOnline: () -> Unit,
    onLimpiar: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 14.dp)
            .background(t.fondoElevado, RoundedCornerShape(16.dp))
            .border(1.dp, t.bordeClaro, RoundedCornerShape(16.dp))
            .padding(20.dp)
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Box(
                modifier = Modifier
                    .size(46.dp)
                    .background(Color(0xFF2563EB).copy(alpha = 0.15f), RoundedCornerShape(12.dp)),
                contentAlignment = Alignment.Center
            ) {
                Icon(Icons.Outlined.Login, contentDescription = null, tint = Color(0xFF2563EB), modifier = Modifier.size(26.dp))
            }
            Spacer(Modifier.width(12.dp))
            Column(Modifier.weight(1f)) {
                Text(Traducciones.texto("config.loginTitulo", idioma), fontSize = 16.sp, fontWeight = FontWeight.ExtraBold, color = t.textoPrimario)
                Text(Traducciones.texto("config.loginSubtitulo", idioma), fontSize = 12.sp, lineHeight = 16.sp, color = t.textoSecundario)
            }
        }

        Spacer(Modifier.height(18.dp))

        if (!bdImportada) {
            CampoLogin(
                etiqueta = Traducciones.texto("config.loginCorreo", idioma),
                valor = correoLogin,
                onValor = onCorreo,
                t = t,
                oscuro = oscuro,
                icono = Icons.Outlined.Email,
                tipoTexto = KeyboardType.Email
            )

            Spacer(Modifier.height(12.dp))

            CampoLogin(
                etiqueta = Traducciones.texto("config.loginPassword", idioma),
                valor = passwordLogin,
                onValor = onPassword,
                t = t,
                oscuro = oscuro,
                icono = Icons.Outlined.Lock,
                tipoTexto = KeyboardType.Password,
                esPassword = true
            )

            Spacer(Modifier.height(8.dp))

            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable { onRecordarme(!recordarme) },
                verticalAlignment = Alignment.CenterVertically
            ) {
                Checkbox(
                    checked = recordarme,
                    onCheckedChange = onRecordarme,
                    colors = CheckboxDefaults.colors(
                        checkedColor = t.primario,
                        checkmarkColor = Color.White,
                        uncheckedColor = t.bordeMedio
                    )
                )
                Text(Traducciones.texto("config.recordarme", idioma), color = t.textoPrimario, fontSize = 13.sp)
            }

            Spacer(Modifier.height(8.dp))

            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(Color(0xFF2563EB), RoundedCornerShape(10.dp))
                    .clickable { if (!ingresandoLogin && !importandoDatos) onIniciar() }
                    .padding(vertical = 12.dp),
                horizontalArrangement = Arrangement.Center,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(Icons.Outlined.Login, contentDescription = null, tint = Color.White, modifier = Modifier.size(18.dp))
                Spacer(Modifier.width(6.dp))
                Text(
                    text = if (ingresandoLogin) Traducciones.texto("config.loginIngresando", idioma) else Traducciones.texto("config.loginBoton", idioma),
                    color = Color.White, fontSize = 14.sp, fontWeight = FontWeight.Bold
                )
            }
        } else {
            Spacer(Modifier.height(4.dp))
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(if (oscuro) Color(0xFF1E293B) else Color(0xFFFFFBEB), RoundedCornerShape(10.dp))
                    .border(1.dp, if (oscuro) Color(0xFF92400E) else Color(0xFFFDE68A), RoundedCornerShape(10.dp))
                    .padding(12.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(Icons.Outlined.Warning, contentDescription = null, tint = Color(0xFFF97316), modifier = Modifier.size(18.dp))
                Spacer(Modifier.width(8.dp))
                Text(
                    text = Traducciones.texto("config.loginBloqueado", idioma),
                    color = if (oscuro) Color(0xFFFBBF24) else Color(0xFF92400E),
                    fontSize = 13.sp,
                    fontWeight = FontWeight.SemiBold
                )
            }
        }

        if (errorLogin.isNotEmpty()) {
            Spacer(Modifier.height(12.dp))
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(Color(0xFFEF4444).copy(alpha = 0.1f), RoundedCornerShape(10.dp))
                    .border(1.dp, Color(0xFFEF4444).copy(alpha = 0.2f), RoundedCornerShape(10.dp))
                    .padding(12.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(Icons.Outlined.Warning, contentDescription = null, tint = Color(0xFFEF4444), modifier = Modifier.size(18.dp))
                Spacer(Modifier.width(8.dp))
                Text(errorLogin, color = Color(0xFFEF4444), fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
            }
        }

        val sesion = sesionMovil
        if (sesion != null && sesion.exito && sesion.usuario != null) {
            Spacer(Modifier.height(18.dp))

            // ===== Perfil del usuario =====
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(if (oscuro) Color(0xFF1E293B) else Color(0xFFF0FDF4), RoundedCornerShape(12.dp))
                    .border(1.dp, if (oscuro) Color(0xFF047857) else Color(0xFFBBF7D0), RoundedCornerShape(12.dp))
                    .padding(14.dp)
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        modifier = Modifier
                            .size(44.dp)
                            .background(if (oscuro) Color(0xFF064E3B) else Color(0xFF10B981), RoundedCornerShape(10.dp)),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(Icons.Outlined.Person, contentDescription = null, tint = Color.White, modifier = Modifier.size(22.dp))
                    }
                    Spacer(Modifier.width(12.dp))
                    Column {
                        Text(Traducciones.texto("config.perfilTitulo", idioma), fontSize = 11.sp, fontWeight = FontWeight.SemiBold, color = if (oscuro) Color(0xFF6EE7B7) else Color(0xFF065F46))
                        Text(sesion.usuario.optString("nombre", ""), fontSize = 16.sp, fontWeight = FontWeight.ExtraBold, color = t.textoPrimario)
                        Text(sesion.usuario.optString("email", ""), fontSize = 12.sp, color = t.textoSecundario)
                    }
                }
                Spacer(Modifier.height(10.dp))
                FichaConfigAncha(
                    etiqueta = Traducciones.texto("config.perfilRol", idioma),
                    valor = Traducciones.texto("config.perfilAdmin", idioma),
                    t = t,
                    oscuro = oscuro
                )
                Spacer(Modifier.height(8.dp))
                FichaConfigAncha(
                    etiqueta = Traducciones.texto("config.rnc", idioma),
                    valor = sesion.empresa?.optString("rnc", "-") ?: "-",
                    t = t,
                    oscuro = oscuro
                )
            }

            // ===== Datos de la empresa =====
            val empresa = sesion.empresa
            if (empresa != null) {
                Spacer(Modifier.height(14.dp))
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(if (oscuro) Color(0xFF0F172A) else Color(0xFFF8FAFC), RoundedCornerShape(12.dp))
                        .border(1.dp, t.bordeClaro, RoundedCornerShape(12.dp))
                        .padding(14.dp)
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Box(
                            modifier = Modifier
                                .size(40.dp)
                                .background(if (oscuro) Color(0xFF1E293B) else Color(0xFFDBEAFE), RoundedCornerShape(10.dp)),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = empresa.optString("simbolo_moneda", "$").take(2),
                                fontSize = 14.sp,
                                fontWeight = FontWeight.ExtraBold,
                                color = Color(0xFF2563EB)
                            )
                        }
                        Spacer(Modifier.width(12.dp))
                        Column {
                            Text(Traducciones.texto("config.datosEmpresaTitulo", idioma), fontSize = 11.sp, fontWeight = FontWeight.SemiBold, color = t.textoTerciario)
                            Text(empresa.optString("nombre_empresa", ""), fontSize = 15.sp, fontWeight = FontWeight.ExtraBold, color = t.textoPrimario)
                            Text(empresa.optString("actividad_economica", ""), fontSize = 12.sp, color = t.textoSecundario)
                        }
                    }
                    Spacer(Modifier.height(12.dp))
                    FichaConfigAncha(
                        etiqueta = Traducciones.texto("config.moneda", idioma),
                        valor = empresa.optString("moneda", ""),
                        t = t,
                        oscuro = oscuro
                    )
                    Spacer(Modifier.height(8.dp))
                    FichaConfigAncha(
                        etiqueta = Traducciones.texto("config.telefono", idioma),
                        valor = empresa.optString("telefono", "-"),
                        t = t,
                        oscuro = oscuro
                    )
                    Spacer(Modifier.height(10.dp))
                    Text(empresa.optString("direccion", ""), fontSize = 12.sp, color = t.textoSecundario)
                    Text(empresa.optString("provincia", ""), fontSize = 12.sp, color = t.textoSecundario)
                }
            }

            // ===== Botón importar datos de esta cuenta (solo si no hay datos importados) =====
            if (!bdImportada) {
            Spacer(Modifier.height(16.dp))
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(if (importandoDatos) Color(0xFF94A3B8) else Color(0xFF10B981), RoundedCornerShape(10.dp))
                    .clickable { if (!importandoDatos) onImportar() }
                    .padding(vertical = 13.dp),
                horizontalArrangement = Arrangement.Center,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(Icons.Outlined.CloudUpload, contentDescription = null, tint = Color.White, modifier = Modifier.size(18.dp))
                Spacer(Modifier.width(6.dp))
                Text(
                    text = if (importandoDatos) Traducciones.texto("config.importandoDatos", idioma) else Traducciones.texto("config.importarDatosCuenta", idioma),
                    color = Color.White, fontSize = 14.sp, fontWeight = FontWeight.Bold
                )
            }
            if (importandoDatos) {
                Spacer(Modifier.height(10.dp))
                LinearProgressIndicator(
                    progress = { 0.9f },
                    modifier = Modifier.fillMaxWidth(),
                    color = Color(0xFF10B981),
                    trackColor = if (oscuro) Color(0xFF334155) else Color(0xFFE2E8F0)
                )
            }
            if (mensajeImportar.isNotEmpty()) {
                Spacer(Modifier.height(12.dp))
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(if (oscuro) Color(0xFF064E3B) else Color(0xFFECFDF5), RoundedCornerShape(10.dp))
                        .border(1.dp, if (oscuro) Color(0xFF047857) else Color(0xFFA7F3D0), RoundedCornerShape(10.dp))
                        .padding(12.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(Icons.Outlined.CheckCircle, contentDescription = null, tint = Color(0xFF10B981), modifier = Modifier.size(18.dp))
                    Spacer(Modifier.width(8.dp))
                    Text(mensajeImportar, color = if (oscuro) Color(0xFF6EE7B7) else Color(0xFF065F46), fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
                }
            }
            if (errorImportar.isNotEmpty()) {
                Spacer(Modifier.height(12.dp))
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(Color(0xFFEF4444).copy(alpha = 0.1f), RoundedCornerShape(10.dp))
                        .border(1.dp, Color(0xFFEF4444).copy(alpha = 0.2f), RoundedCornerShape(10.dp))
                        .padding(12.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(Icons.Outlined.Warning, contentDescription = null, tint = Color(0xFFEF4444), modifier = Modifier.size(18.dp))
                    Spacer(Modifier.width(8.dp))
                    Text(errorImportar, color = Color(0xFFEF4444), fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
                }
            }
            }

            // ===== Enlistado de los datos importados =====
            if (bdImportada && resumenDatos.isNotEmpty()) {
                Spacer(Modifier.height(18.dp))
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(if (oscuro) Color(0xFF0F172A) else Color(0xFFF8FAFC), RoundedCornerShape(12.dp))
                        .border(1.dp, t.bordeClaro, RoundedCornerShape(12.dp))
                        .padding(12.dp)
                ) {
                    Column {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable { onExpandirDatos(!expandirDatos) },
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = Traducciones.texto("config.resumenDatos", idioma),
                                fontSize = 13.sp,
                                fontWeight = FontWeight.Bold,
                                color = t.textoPrimario,
                                modifier = Modifier.weight(1f)
                            )
                            Text(
                                text = if (expandirDatos) Traducciones.texto("config.ocultarDatos", idioma) else Traducciones.texto("config.expandirDatos", idioma),
                                fontSize = 12.sp,
                                color = t.primario,
                                fontWeight = FontWeight.SemiBold
                            )
                            Icon(
                                imageVector = if (expandirDatos) Icons.Outlined.KeyboardArrowUp else Icons.Outlined.KeyboardArrowDown,
                                contentDescription = null,
                                tint = t.primario,
                                modifier = Modifier.size(18.dp)
                            )
                        }
                        if (expandirDatos) {
                            resumenDatos.forEach { (tabla, cantidad) ->
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(vertical = 3.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Text(
                                        text = tabla,
                                        fontSize = 12.sp,
                                        color = t.textoSecundario,
                                        modifier = Modifier.weight(1f)
                                    )
                                    Text(
                                        text = cantidad.toString(),
                                        fontSize = 12.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = t.textoPrimario
                                    )
                                }
                            }
                        }
                    }
                }
            }

            // ===== Verificación de identidad para subir (correo + contraseña) =====
            if (bdImportada) {
                Spacer(Modifier.height(16.dp))
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(if (oscuro) Color(0xFF1E293B) else Color(0xFFF8FAFC), RoundedCornerShape(12.dp))
                        .border(1.dp, t.bordeClaro, RoundedCornerShape(12.dp))
                        .padding(14.dp)
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Outlined.Lock, contentDescription = null, tint = Color(0xFF2563EB), modifier = Modifier.size(18.dp))
                        Spacer(Modifier.width(8.dp))
                        Text(
                            text = Traducciones.texto("config.verificarTitulo", idioma),
                            fontSize = 14.sp,
                            fontWeight = FontWeight.ExtraBold,
                            color = t.textoPrimario
                        )
                    }
                    Spacer(Modifier.height(10.dp))
                    CampoLogin(
                        etiqueta = Traducciones.texto("config.loginCorreo", idioma),
                        valor = correoLogin,
                        onValor = onCorreo,
                        t = t,
                        oscuro = oscuro,
                        icono = Icons.Outlined.Email,
                        tipoTexto = KeyboardType.Email
                    )
                    Spacer(Modifier.height(10.dp))
                    CampoLogin(
                        etiqueta = Traducciones.texto("config.loginPassword", idioma),
                        valor = passwordLogin,
                        onValor = onPassword,
                        t = t,
                        oscuro = oscuro,
                        icono = Icons.Outlined.Lock,
                        tipoTexto = KeyboardType.Password,
                        esPassword = true
                    )
                }
            }

            // ===== Paso 1: subir cambios a la base de datos =====
            if (bdImportada) {
                Spacer(Modifier.height(16.dp))
                Text(
                    text = Traducciones.texto("config.paso1Subir", idioma),
                    fontSize = 13.sp,
                    fontWeight = FontWeight.ExtraBold,
                    color = t.primario,
                    modifier = Modifier.padding(horizontal = 4.dp, vertical = 4.dp)
                )
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(if (subiendoDatos) Color(0xFF94A3B8) else Color(0xFF2563EB), RoundedCornerShape(10.dp))
                        .clickable { if (!subiendoDatos) onSubir() }
                        .padding(horizontal = 20.dp, vertical = 14.dp),
                    horizontalArrangement = Arrangement.Center,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(Icons.Outlined.CloudUpload, contentDescription = null, tint = Color.White, modifier = Modifier.size(20.dp))
                    Spacer(Modifier.width(10.dp))
                    Text(
                        text = if (subiendoDatos) Traducciones.texto("config.subiendo", idioma) else Traducciones.texto("config.subirBDMovil", idioma),
                        color = Color.White,
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Bold,
                        textAlign = TextAlign.Center,
                        modifier = Modifier.weight(1f)
                    )
                }
                if (subiendoDatos) {
                    Spacer(Modifier.height(10.dp))
                    LinearProgressIndicator(
                        progress = { 0.9f },
                        modifier = Modifier.fillMaxWidth(),
                        color = Color(0xFF2563EB),
                        trackColor = if (oscuro) Color(0xFF334155) else Color(0xFFE2E8F0)
                    )
                    Spacer(Modifier.height(6.dp))
                    Text(
                        text = Traducciones.texto("config.subiendoAviso", idioma),
                        fontSize = 12.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = t.textoSecundario,
                        textAlign = TextAlign.Center,
                        modifier = Modifier.fillMaxWidth()
                    )
                }
                if (mensajeSubir.isNotEmpty()) {
                    Spacer(Modifier.height(12.dp))
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(if (oscuro) Color(0xFF064E3B) else Color(0xFFECFDF5), RoundedCornerShape(10.dp))
                            .border(1.dp, if (oscuro) Color(0xFF047857) else Color(0xFFA7F3D0), RoundedCornerShape(10.dp))
                            .padding(12.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(Icons.Outlined.CheckCircle, contentDescription = null, tint = Color(0xFF10B981), modifier = Modifier.size(20.dp))
                        Spacer(Modifier.width(8.dp))
                        Text(
                            text = mensajeSubir,
                            color = if (oscuro) Color(0xFF6EE7B7) else Color(0xFF065F46),
                            fontSize = 13.sp,
                            fontWeight = FontWeight.SemiBold,
                            modifier = Modifier.weight(1f)
                        )
                    }
                }
                if (errorSubir.isNotEmpty()) {
                    Spacer(Modifier.height(12.dp))
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(Color(0xFFEF4444).copy(alpha = 0.1f), RoundedCornerShape(10.dp))
                            .border(1.dp, Color(0xFFEF4444).copy(alpha = 0.2f), RoundedCornerShape(10.dp))
                            .padding(12.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(Icons.Outlined.Warning, contentDescription = null, tint = Color(0xFFEF4444), modifier = Modifier.size(20.dp))
                        Spacer(Modifier.width(8.dp))
                        Text(
                            text = errorSubir,
                            color = Color(0xFFEF4444),
                            fontSize = 13.sp,
                            fontWeight = FontWeight.SemiBold,
                            modifier = Modifier.weight(1f)
                        )
                    }
                }

                // ===== Paso 2: poner online el sistema =====
                Spacer(Modifier.height(12.dp))
                Text(
                    text = Traducciones.texto("config.paso2Online", idioma),
                    fontSize = 13.sp,
                    fontWeight = FontWeight.ExtraBold,
                    color = Color(0xFF10B981),
                    modifier = Modifier.padding(horizontal = 4.dp, vertical = 4.dp)
                )
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(if (poniendoOnline) Color(0xFF94A3B8) else Color(0xFF10B981), RoundedCornerShape(10.dp))
                        .clickable { if (!poniendoOnline) onPonerOnline() }
                        .padding(horizontal = 20.dp, vertical = 14.dp),
                    horizontalArrangement = Arrangement.Center,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(Icons.Outlined.CloudSync, contentDescription = null, tint = Color.White, modifier = Modifier.size(20.dp))
                    Spacer(Modifier.width(10.dp))
                    Text(
                        text = if (poniendoOnline) Traducciones.texto("config.poniendoOnline", idioma) else Traducciones.texto("config.ponerOnline", idioma),
                        color = Color.White,
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Bold,
                        textAlign = TextAlign.Center,
                        modifier = Modifier.weight(1f)
                    )
                }
                if (poniendoOnline) {
                    Spacer(Modifier.height(10.dp))
                    LinearProgressIndicator(
                        progress = { 0.9f },
                        modifier = Modifier.fillMaxWidth(),
                        color = Color(0xFF10B981),
                        trackColor = if (oscuro) Color(0xFF334155) else Color(0xFFE2E8F0)
                    )
                }
                if (mensajeOnline.isNotEmpty()) {
                    Spacer(Modifier.height(12.dp))
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(if (oscuro) Color(0xFF064E3B) else Color(0xFFECFDF5), RoundedCornerShape(10.dp))
                            .border(1.dp, if (oscuro) Color(0xFF047857) else Color(0xFFA7F3D0), RoundedCornerShape(10.dp))
                            .padding(12.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(Icons.Outlined.CheckCircle, contentDescription = null, tint = Color(0xFF10B981), modifier = Modifier.size(20.dp))
                        Spacer(Modifier.width(8.dp))
                        Text(
                            text = mensajeOnline,
                            color = if (oscuro) Color(0xFF6EE7B7) else Color(0xFF065F46),
                            fontSize = 13.sp,
                            fontWeight = FontWeight.SemiBold,
                            modifier = Modifier.weight(1f)
                        )
                    }
                }
                if (errorOnline.isNotEmpty()) {
                    Spacer(Modifier.height(12.dp))
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(Color(0xFFEF4444).copy(alpha = 0.1f), RoundedCornerShape(10.dp))
                            .border(1.dp, Color(0xFFEF4444).copy(alpha = 0.2f), RoundedCornerShape(10.dp))
                            .padding(12.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(Icons.Outlined.Warning, contentDescription = null, tint = Color(0xFFEF4444), modifier = Modifier.size(20.dp))
                        Spacer(Modifier.width(8.dp))
                        Text(
                            text = errorOnline,
                            color = Color(0xFFEF4444),
                            fontSize = 13.sp,
                            fontWeight = FontWeight.SemiBold,
                            modifier = Modifier.weight(1f)
                        )
                    }
                }
            }

            // ===== Botón limpiar datos del sistema =====
            if (bdImportada) {
                Spacer(Modifier.height(16.dp))
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(Color(0xFFEF4444), RoundedCornerShape(10.dp))
                        .clickable { if (!limpiando) onLimpiar() }
                        .padding(vertical = 13.dp),
                    horizontalArrangement = Arrangement.Center,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(Icons.Outlined.Delete, contentDescription = null, tint = Color.White, modifier = Modifier.size(18.dp))
                    Spacer(Modifier.width(6.dp))
                    Text(
                        text = if (limpiando) Traducciones.texto("config.borrando", idioma) else Traducciones.texto("config.limpiarOffline", idioma),
                        color = Color.White, fontSize = 14.sp, fontWeight = FontWeight.Bold
                    )
                }
            }
        }
    }
}

/** Campo de texto para el login (soporta contraseña con puntos). */
@Composable
private fun CampoLogin(
    etiqueta: String,
    valor: String,
    onValor: (String) -> Unit,
    t: TokensWeb,
    oscuro: Boolean,
    icono: androidx.compose.ui.graphics.vector.ImageVector,
    tipoTexto: KeyboardType = KeyboardType.Text,
    esPassword: Boolean = false
) {
    var mostrarPassword by remember { mutableStateOf(false) }
    Column {
        Text(etiqueta, fontSize = 12.sp, fontWeight = FontWeight.SemiBold, color = t.textoSecundario)
        Spacer(Modifier.height(6.dp))
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .height(44.dp)
                .background(if (oscuro) Color(0xFF0F172A) else Color(0xFFF8FAFC), RoundedCornerShape(8.dp))
                .border(1.dp, t.bordeMedio, RoundedCornerShape(8.dp))
                .padding(horizontal = 12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(icono, contentDescription = null, tint = t.textoTerciario, modifier = Modifier.size(16.dp))
            Spacer(Modifier.width(8.dp))
            androidx.compose.foundation.text.BasicTextField(
                value = valor,
                onValueChange = onValor,
                singleLine = true,
                textStyle = androidx.compose.ui.text.TextStyle(color = t.textoPrimario, fontSize = 14.sp),
                cursorBrush = androidx.compose.ui.graphics.SolidColor(t.primario),
                visualTransformation = if (esPassword && !mostrarPassword) PasswordVisualTransformation() else androidx.compose.ui.text.input.VisualTransformation.None,
                keyboardOptions = androidx.compose.foundation.text.KeyboardOptions(keyboardType = tipoTexto),
                modifier = Modifier.weight(1f)
            )
            if (esPassword) {
                Spacer(Modifier.width(8.dp))
                Icon(
                    if (mostrarPassword) Icons.Outlined.VisibilityOff else Icons.Outlined.Visibility,
                    contentDescription = null,
                    tint = t.textoTerciario,
                    modifier = Modifier
                        .size(20.dp)
                        .clickable { mostrarPassword = !mostrarPassword }
                )
            }
        }
    }
}

/** Pestaña de navegación dentro de Configuración (Opción 1 / Opción 2). */
@Composable
private fun RowScope.PestañaConfig(
    etiqueta: String,
    seleccionada: Boolean,
    t: TokensWeb,
    oscuro: Boolean,
    onClick: () -> Unit
) {
    Box(
        modifier = Modifier
            .weight(1f)
            .background(
                if (seleccionada) t.primario else if (oscuro) Color(0xFF1E293B) else Color(0xFFF1F5F9),
                RoundedCornerShape(9.dp)
            )
            .clickable(onClick = onClick)
            .padding(vertical = 10.dp),
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = etiqueta,
            fontSize = 14.sp,
            fontWeight = if (seleccionada) FontWeight.ExtraBold else FontWeight.SemiBold,
            color = if (seleccionada) Color.White else t.textoSecundario
        )
    }
}

/** Ficha a ancho completo, apilada una debajo de otra (para valores largos). */
@Composable
private fun FichaConfigAncha(
    etiqueta: String,
    valor: String,
    t: TokensWeb,
    oscuro: Boolean
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .background(if (oscuro) Color(0xFF0F172A) else Color(0xFFFFFFFF), RoundedCornerShape(10.dp))
            .border(1.dp, t.bordeClaro, RoundedCornerShape(10.dp))
            .padding(vertical = 10.dp, horizontal = 12.dp)
    ) {
        Text(
            text = etiqueta.uppercase(),
            fontSize = 10.sp,
            fontWeight = FontWeight.Bold,
            color = t.textoTerciario
        )
        Spacer(Modifier.height(2.dp))
        Text(
            text = valor,
            fontSize = 16.sp,
            fontWeight = FontWeight.ExtraBold,
            color = t.textoPrimario
        )
    }
}

/** Pequeña ficha con etiqueta y valor usada en la tarjeta de configuración de la empresa. */
@Composable
private fun RowScope.FichaConfig(
    etiqueta: String,
    valor: String,
    t: TokensWeb,
    oscuro: Boolean
) {
    Column(
        modifier = Modifier
            .weight(1f)
            .background(if (oscuro) Color(0xFF0F172A) else Color(0xFFFFFFFF), RoundedCornerShape(10.dp))
            .border(1.dp, t.bordeClaro, RoundedCornerShape(10.dp))
            .padding(vertical = 10.dp, horizontal = 12.dp)
    ) {
        Text(
            text = etiqueta.uppercase(),
            fontSize = 10.sp,
            fontWeight = FontWeight.Bold,
            color = t.textoTerciario
        )
        Spacer(Modifier.height(2.dp))
        Text(
            text = valor,
            fontSize = 16.sp,
            fontWeight = FontWeight.ExtraBold,
            color = t.textoPrimario
        )
    }
}

/** Extrae un resumen (tabla -> cantidad de filas) del JSON de base de datos importado. */
private fun extraerResumen(texto: String): List<Pair<String, Int>> {
    return try {
        val obj = org.json.JSONObject(texto)
        val tablas = obj.optJSONObject("tablas")
        if (tablas == null) return emptyList()
        val resumen = mutableListOf<Pair<String, Int>>()
        val keys = tablas.keys()
        while (keys.hasNext()) {
            val clave = keys.next()
            val arr = tablas.optJSONArray(clave)
            resumen.add(Pair(clave, arr?.length() ?: 0))
        }
        resumen.sortedByDescending { it.second }
    } catch (e: Exception) {
        emptyList()
    }
}

/** Extrae el resumen desde la memoria del RepositorioOffline (no del archivo),
 *  para que refleje los cambios hechos en las demás secciones offline. */
private fun extraerResumenDesdeRepo(): List<Pair<String, Int>> {
    val texto = RepositorioOffline.jsonCompleto() ?: return emptyList()
    return extraerResumen(texto)
}
