package com.isiweek.puntodeventa.pantallas.financiamiento

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.outlined.ArrowBack
import androidx.compose.material.icons.automirrored.outlined.ArrowForward
import androidx.compose.material.icons.outlined.Add
import androidx.compose.material.icons.outlined.Calculate
import androidx.compose.material.icons.outlined.Check
import androidx.compose.material.icons.outlined.CheckCircle
import androidx.compose.material.icons.outlined.ChevronLeft
import androidx.compose.material.icons.outlined.ChevronRight
import androidx.compose.material.icons.outlined.Close
import androidx.compose.material.icons.outlined.CreditCard
import androidx.compose.material.icons.outlined.Delete
import androidx.compose.material.icons.outlined.Description
import androidx.compose.material.icons.outlined.Info
import androidx.compose.material.icons.outlined.Payments
import androidx.compose.material.icons.outlined.Person
import androidx.compose.material.icons.outlined.Search
import androidx.compose.material.icons.outlined.Shield
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.isiweek.puntodeventa.i18n.Idioma
import com.isiweek.puntodeventa.i18n.Traducciones
import com.isiweek.puntodeventa.offline.RepositorioOffline
import com.isiweek.puntodeventa.ui.componentes.CampoMoneda
import com.isiweek.puntodeventa.ui.componentes.CampoWeb
import com.isiweek.puntodeventa.ui.componentes.TokensWeb
import java.util.Calendar

private data class ActivoNuevo(val nombre: String, val descripcion: String, val serial: String, val valor: String)
private data class FiadorNuevo(val nombre: String, val cedula: String, val telefono: String, val email: String, val direccion: String)

private fun hoy(): String {
    val cal = Calendar.getInstance()
    return String.format("%02d/%02d/%04d", cal.get(Calendar.DAY_OF_MONTH), cal.get(Calendar.MONTH) + 1, cal.get(Calendar.YEAR))
}

private fun sumarPeriodos(fecha: String, cant: Int, freq: String): String {
    val parts = fecha.split("/")
    if (parts.size != 3) return fecha
    val cal = Calendar.getInstance()
    cal.clear()
    cal.set(parts[2].toInt(), parts[1].toInt() - 1, parts[0].toInt())
    when (freq) {
        "mensual" -> cal.add(Calendar.MONTH, cant)
        "quincenal" -> cal.add(Calendar.DAY_OF_YEAR, cant * 15)
        else -> cal.add(Calendar.DAY_OF_YEAR, cant * 7)
    }
    return String.format("%02d/%02d/%04d", cal.get(Calendar.DAY_OF_MONTH), cal.get(Calendar.MONTH) + 1, cal.get(Calendar.YEAR))
}

@Composable
fun NuevoPrestamoPantalla(
    idioma: Idioma,
    oscuro: Boolean,
    onVolver: () -> Unit,
    onCreado: (Int) -> Unit
) {
    val t = TokensWeb(
        fondoPrincipal = if (oscuro) Color(0xFF0F172A) else Color(0xFFFFFFFF),
        fondoElevado = if (oscuro) Color(0xFF1E293B) else Color(0xFFFFFFFF),
        fondoTerciario = if (oscuro) Color(0xFF334155) else Color(0xFFF1F5F9),
        fondoContenido = if (oscuro) Color(0xFF0F172A) else Color(0xFFF1F5F9),
        textoPrimario = if (oscuro) Color(0xFFF1F5F9) else Color(0xFF0F172A),
        textoSecundario = if (oscuro) Color(0xFFCBD5E1) else Color(0xFF475569),
        textoTerciario = if (oscuro) Color(0xFF94A3B8) else Color(0xFF94A3B8),
        bordeClaro = if (oscuro) Color(0xFF334155) else Color(0xFFE5E7EB),
        bordeMedio = if (oscuro) Color(0xFF475569) else Color(0xFFD1D5DB),
        primario = if (oscuro) Color(0xFF3B82F6) else Color(0xFF2563EB),
        primarioClaro = if (oscuro) Color(0xFF3B82F6).copy(alpha = 0.15f) else Color(0xFFDBEAFE),
        exito = Color(0xFF10B981)
    )

    var paso by remember { mutableStateOf(1) }
    val pasos = listOf(
        Traducciones.texto("nuevoPrestamo.pasoCliente", idioma),
        Traducciones.texto("nuevoPrestamo.pasoPlan", idioma),
        Traducciones.texto("nuevoPrestamo.pasoMontos", idioma),
        Traducciones.texto("nuevoPrestamo.pasoExtras", idioma),
        Traducciones.texto("nuevoPrestamo.pasoResumen", idioma)
    )

    val clientes = remember { obtenerClientesFinPantalla() }
    val POR_PAGINA = 8
    var buscarCliente by remember { mutableStateOf("") }
    var paginaCliente by remember { mutableStateOf(1) }
    var clienteSel by remember { mutableStateOf<ClienteFin?>(null) }

    var planSel by remember { mutableStateOf<PlanFin?>(null) }
    var opcionSel by remember { mutableStateOf<OpcionPlan?>(null) }

    var montoTotal by remember { mutableStateOf("") }
    var montoAdelantado by remember { mutableStateOf("") }
    var numeroMeses by remember { mutableStateOf("") }
    var fechaInicio by remember { mutableStateOf(hoy()) }
    var notas by remember { mutableStateOf("") }

    var tieneFiador by remember { mutableStateOf(false) }
    var fiador by remember { mutableStateOf(FiadorNuevo("", "", "", "", "")) }
    var tieneActivos by remember { mutableStateOf(false) }
    var activos by remember { mutableStateOf(listOf(ActivoNuevo("", "", "", ""))) }

    val cuotas = numeroMeses.toIntOrNull() ?: opcionSel?.meses ?: 0
    val mf = montoTotal.toDoubleOrNull() ?: 0.0
    val tasa = planSel?.tasaInteres ?: 0.0
    val totalPagar = if (mf > 0) mf * (1 + tasa / 100) else 0.0
    val totalIntereses = totalPagar - mf
    val cuotaMonto = if (cuotas > 0) totalPagar / cuotas else 0.0
    val adelantoNum = montoAdelantado.toDoubleOrNull() ?: 0.0
    val saldoRestante = totalPagar - adelantoNum
    val fechaFin = if (planSel != null && cuotas > 0) sumarPeriodos(fechaInicio, cuotas, planSel?.frecuencia ?: "mensual") else "—"

    val clientesFiltrados = clientes.filter {
        val q = buscarCliente.trim().lowercase()
        q.isEmpty() || (it.nombre + " " + it.apellidos).lowercase().contains(q) ||
            it.documento.lowercase().contains(q) || it.telefono.lowercase().contains(q)
    }
    val totalPaginas = ((clientesFiltrados.size + POR_PAGINA - 1) / POR_PAGINA).coerceAtLeast(1)
    val paginaActual = paginaCliente.coerceIn(1, totalPaginas)
    val clientesPagina = clientesFiltrados.drop((paginaActual - 1) * POR_PAGINA).take(POR_PAGINA)

    fun puedeAvanzar(): Boolean = when (paso) {
        1 -> clienteSel != null
        2 -> planSel != null
        3 -> mf > 0 && cuotas > 0 && !(adelantoNum > 0 && adelantoNum >= totalPagar)
        4 -> !(tieneFiador && fiador.nombre.isBlank()) && !(tieneActivos && activos.any { it.nombre.isBlank() })
        else -> true
    }

    fun crear() {
        val nuevoId = 1000 + obtenerContratosFin().size + obtenerContratosFinExtra().size
        val numero = "FIN-2-0000${obtenerContratosFin().size + 1}"
        val c = ContratoVer(
            id = nuevoId,
            numero = numero,
            cliente = "${clienteSel?.nombre ?: ""} ${clienteSel?.apellidos ?: ""}".trim(),
            documento = clienteSel?.documento ?: "",
            telefono = clienteSel?.telefono ?: "",
            email = clienteSel?.email ?: "",
            direccion = clienteSel?.direccion ?: "",
            estado = "activo",
            financiado = fmtMontoFin(mf),
            pagoAdelantado = fmtMontoFin(adelantoNum),
            totalPagar = fmtMontoFin(totalPagar),
            intereses = fmtMontoFin(totalIntereses),
            saldoPendiente = fmtMontoFin(saldoRestante),
            cuotaMensual = fmtMontoFin(cuotaMonto),
            frecuencia = planSel?.frecuencia ?: "mensual",
            meses = cuotas,
            tasa = "$tasa",
            plan = planSel?.nombre ?: "",
            fechaInicio = fechaInicio,
            fechaFin = fechaFin,
            vendedor = "Negocio de prueba",
            cuotasPagadas = 0,
            cobrado = fmtMontoFin(adelantoNum),
            cuotas = previewCuotas(adelantoNum, cuotaMonto, cuotas, fechaInicio, planSel?.frecuencia ?: "mensual"),
            pagos = emptyList()
        )
        registrarContratoVerExtra(c)
        if (RepositorioOffline.hayDatosOffline()) {
            RepositorioOffline.guardarContrato(
                RepositorioOffline.ContratoOffline(
                    id = nuevoId,
                    numero = numero,
                    clienteId = clienteSel?.id ?: 0,
                    planId = planSel?.id ?: 0,
                    montoTotal = mf,
                    montoInicial = adelantoNum,
                    montoFinanciado = mf,
                    totalIntereses = totalIntereses,
                    totalPagar = totalPagar,
                    saldoPendiente = saldoRestante,
                    meses = cuotas,
                    frecuencia = planSel?.frecuencia ?: "mensual",
                    tasaInteres = tasa,
                    cuotaMensual = cuotaMonto,
                    fechaInicio = fechaInicio,
                    fechaFin = fechaFin,
                    notas = "",
                    estado = "activo"
                )
            )

            // Generar y guardar las CUOTAS del contrato (igual que la web: una por plazo,
            // con vencimiento según la frecuencia, marcando pagadas/parciales según adelanto).
            val freq = planSel?.frecuencia ?: "mensual"
            val capitalPorCuota = if (cuotas > 0) mf / cuotas else 0.0
            val interesPorCuota = if (cuotas > 0) totalIntereses / cuotas else 0.0
            val fInicioSql = RepositorioOffline.fechaSql(fechaInicio) ?: ""
            var restante = adelantoNum
            val cuotasConPago = mutableListOf<Pair<Int, Double>>()
            for (i in 1..cuotas) {
                val fechaVenc = RepositorioOffline.fechaSql(sumarPeriodos(fechaInicio, i, freq)) ?: ""
                var estadoCuota = "pendiente"
                var fechaPago = ""
                var montoPagado = 0.0
                if (restante > 0) {
                    if (restante >= cuotaMonto) {
                        estadoCuota = "pagada"
                        montoPagado = cuotaMonto
                        restante -= cuotaMonto
                    } else {
                        estadoCuota = "parcial"
                        montoPagado = restante
                        restante = 0.0
                    }
                    fechaPago = fInicioSql
                }
                val cuotaId = RepositorioOffline.siguienteCuotaId()
                RepositorioOffline.guardarCuota(
                    RepositorioOffline.CuotaOffline(
                        id = cuotaId,
                        contratoId = nuevoId,
                        numero = i,
                        monto = cuotaMonto,
                        capital = capitalPorCuota,
                        interes = interesPorCuota,
                        mora = 0.0,
                        fechaVencimiento = fechaVenc,
                        fechaPago = fechaPago,
                        estado = estadoCuota
                    )
                )
                if (montoPagado > 0) cuotasConPago.add(cuotaId to montoPagado)
            }

            // Pago adelantado al crear el contrato (igual que la web).
            if (adelantoNum > 0 && cuotasConPago.isNotEmpty()) {
                val pagoId = RepositorioOffline.siguientePagoId()
                RepositorioOffline.guardarPago(
                    RepositorioOffline.PagoOffline(
                        id = pagoId,
                        contratoId = nuevoId,
                        monto = adelantoNum,
                        montoCapital = 0.0,
                        montoInteres = 0.0,
                        montoMora = 0.0,
                        fecha = fInicioSql,
                        notas = "Pago adelantado al crear el contrato"
                    )
                )
                for ((cuotaId, montoP) in cuotasConPago) {
                    RepositorioOffline.guardarPagoCuotaEnlace(pagoId, cuotaId, montoP)
                }
            }
        }
        onCreado(nuevoId)
    }

    LazyColumn(
        modifier = Modifier.fillMaxSize().background(t.fondoContenido),
        contentPadding = PaddingValues(bottom = 24.dp)
    ) {
        item {
            Row(
                modifier = Modifier.fillMaxWidth().padding(14.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Box(
                    modifier = Modifier.size(32.dp).background(t.fondoTerciario, RoundedCornerShape(8.dp)).clickable(onClick = onVolver),
                    contentAlignment = Alignment.Center
                ) { Icon(Icons.AutoMirrored.Outlined.ArrowBack, null, tint = t.textoSecundario, modifier = Modifier.size(18.dp)) }
                Spacer(Modifier.width(10.dp))
                Column {
                    Text(Traducciones.texto("nuevoPrestamo.titulo", idioma), fontSize = 20.sp, fontWeight = FontWeight.Bold, color = t.textoPrimario)
                    Text(Traducciones.texto("nuevoPrestamo.subtitulo", idioma), fontSize = 11.sp, color = t.textoSecundario)
                }
            }
        }

        item {
            Row(modifier = Modifier.fillMaxWidth().padding(horizontal = 14.dp, vertical = 6.dp)) {
                pasos.forEachIndexed { i, nombre ->
                    val num = i + 1
                    val activo = paso == num
                    val completado = paso > num
                    Column(Modifier.weight(1f), horizontalAlignment = Alignment.CenterHorizontally) {
                        Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                            if (i > 0) {
                                Box(
                                    Modifier
                                        .weight(1f)
                                        .height(3.dp)
                                        .background(if (completado) t.primario else t.bordeMedio, RoundedCornerShape(2.dp))
                                )
                            }
                            Box(
                                modifier = Modifier
                                    .size(28.dp)
                                    .background(
                                        when {
                                            completado -> t.primario
                                            activo -> t.primarioClaro
                                            else -> t.fondoTerciario
                                        },
                                        CircleShape
                                    )
                                    .border(1.dp, if (activo || completado) t.primario else t.bordeMedio, CircleShape),
                                contentAlignment = Alignment.Center
                            ) {
                                if (completado) Icon(Icons.Outlined.Check, null, tint = Color.White, modifier = Modifier.size(14.dp))
                                else Text("$num", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = if (activo) t.primario else t.textoSecundario)
                            }
                            if (i < pasos.lastIndex) {
                                Box(
                                    Modifier
                                        .weight(1f)
                                        .height(3.dp)
                                        .background(if (completado) t.primario else t.bordeMedio, RoundedCornerShape(2.dp))
                                )
                            }
                        }
                        Spacer(Modifier.height(4.dp))
                        Text(nombre, fontSize = 9.sp, fontWeight = if (activo) FontWeight.Bold else FontWeight.Normal, color = if (activo) t.primario else t.textoTerciario, maxLines = 1, overflow = TextOverflow.Ellipsis, textAlign = TextAlign.Center)
                    }
                }
            }
            Spacer(Modifier.height(10.dp))
        }

        when (paso) {
            1 -> item {
                PasoClienteNuevo(
                    clientesPagina, clientesFiltrados.size, buscarCliente, { buscarCliente = it; paginaCliente = 1 },
                    clienteSel, { clienteSel = it }, paginaActual, totalPaginas, { paginaCliente = it }, t, idioma
                )
            }
            2 -> item {
                PasoPlanNuevo(planSel, { planSel = it }, opcionSel, { opcionSel = it }, numeroMeses, { numeroMeses = it }, t, idioma)
            }
            3 -> item {
                PasoMontosNuevo(
                    montoTotal, { montoTotal = it }, montoAdelantado, { montoAdelantado = it },
                    numeroMeses, { numeroMeses = it }, fechaInicio, { fechaInicio = it }, notas, { notas = it },
                    planSel, opcionSel, cuotas, mf, tasa, totalPagar, totalIntereses, cuotaMonto, adelantoNum, saldoRestante, fechaFin, t, idioma
                )
            }
            4 -> item {
                PasoExtrasNuevo(tieneFiador, { tieneFiador = it }, fiador, { fiador = it }, tieneActivos, { tieneActivos = it }, activos, { activos = it }, t, idioma)
            }
            5 -> item {
                PasoResumenNuevo(clienteSel, planSel, cuotas, mf, tasa, totalPagar, totalIntereses, cuotaMonto, adelantoNum, saldoRestante, fechaInicio, fechaFin, tieneFiador, fiador, tieneActivos, activos, notas, t, idioma)
            }
        }

        item {
            Row(modifier = Modifier.fillMaxWidth().padding(horizontal = 14.dp, vertical = 16.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                if (paso > 1) {
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .background(t.fondoTerciario, RoundedCornerShape(8.dp))
                            .clickable { paso -= 1 }
                            .padding(vertical = 12.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.AutoMirrored.Outlined.ArrowBack, null, tint = t.textoSecundario, modifier = Modifier.size(16.dp))
                            Spacer(Modifier.width(4.dp))
                            Text(Traducciones.texto("nuevoPrestamo.anterior", idioma), color = t.textoSecundario, fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
                        }
                    }
                }
                if (paso < 5) {
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .background(t.primario, RoundedCornerShape(8.dp))
                            .clickable(enabled = puedeAvanzar()) { paso += 1 }
                            .padding(vertical = 12.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text(Traducciones.texto("nuevoPrestamo.siguiente", idioma), color = Color.White, fontSize = 13.sp, fontWeight = FontWeight.Bold)
                            Spacer(Modifier.width(4.dp))
                            Icon(Icons.AutoMirrored.Outlined.ArrowForward, null, tint = Color.White, modifier = Modifier.size(16.dp))
                        }
                    }
                } else {
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .background(t.exito, RoundedCornerShape(8.dp))
                            .clickable(onClick = ::crear)
                            .padding(vertical = 12.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Outlined.CheckCircle, null, tint = Color.White, modifier = Modifier.size(16.dp))
                            Spacer(Modifier.width(5.dp))
                            Text(Traducciones.texto("nuevoPrestamo.crear", idioma), color = Color.White, fontSize = 13.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun TituloSeccion(icono: androidx.compose.ui.graphics.vector.ImageVector, texto: String, t: TokensWeb) {
    Row(verticalAlignment = Alignment.CenterVertically) {
        Icon(icono, null, tint = t.primario, modifier = Modifier.size(18.dp))
        Spacer(Modifier.width(6.dp))
        Text(texto, fontSize = 16.sp, fontWeight = FontWeight.Bold, color = t.textoPrimario)
    }
    Spacer(Modifier.height(10.dp))
}

@Composable
private fun PasoClienteNuevo(
    clientes: List<ClienteFin>, totalClientes: Int, buscar: String, onBuscar: (String) -> Unit,
    sel: ClienteFin?, onSel: (ClienteFin?) -> Unit, pagina: Int, totalPaginas: Int, onPagina: (Int) -> Unit,
    t: TokensWeb, idioma: Idioma
) {
    Column(modifier = Modifier.padding(horizontal = 14.dp)) {
        TituloSeccion(Icons.Outlined.Person, Traducciones.texto("nuevoPrestamo.seleccionarCliente", idioma), t)

        if (sel != null) {
            Row(
                modifier = Modifier.fillMaxWidth().background(t.fondoPrincipal, RoundedCornerShape(10.dp)).border(1.dp, t.primario, RoundedCornerShape(10.dp)).padding(12.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Box(Modifier.size(40.dp).background(t.primarioClaro, CircleShape), contentAlignment = Alignment.Center) {
                    Text(sel.nombre.take(1), color = t.primario, fontSize = 18.sp, fontWeight = FontWeight.Bold)
                }
                Spacer(Modifier.width(10.dp))
                Column(Modifier.weight(1f)) {
                    Text("${sel.nombre} ${sel.apellidos}", fontSize = 14.sp, fontWeight = FontWeight.Bold, color = t.textoPrimario)
                    Text("${sel.documento} · ${sel.telefono}", fontSize = 11.sp, color = t.textoSecundario)
                }
                Box(Modifier.background(t.fondoTerciario, RoundedCornerShape(6.dp)).clickable { onSel(null) }.padding(6.dp)) {
                    Icon(Icons.Outlined.Close, null, tint = t.textoSecundario, modifier = Modifier.size(16.dp))
                }
            }
            Spacer(Modifier.height(10.dp))
        }

        Row(
            modifier = Modifier.fillMaxWidth().background(t.fondoPrincipal, RoundedCornerShape(8.dp)).border(1.dp, t.bordeMedio, RoundedCornerShape(8.dp)),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(Icons.Outlined.Search, null, tint = t.textoTerciario, modifier = Modifier.padding(start = 10.dp).size(16.dp))
            CampoWeb(valor = buscar, onValor = onBuscar, tokens = t, placeholder = Traducciones.texto("nuevoPrestamo.filtrarCliente", idioma), alto = 40)
            if (buscar.isNotEmpty()) Box(Modifier.padding(end = 6.dp).clickable { onBuscar("") }) { Icon(Icons.Outlined.Close, null, tint = t.textoTerciario, modifier = Modifier.size(16.dp)) }
        }
        Spacer(Modifier.height(10.dp))

        if (clientes.isEmpty()) {
            Text(Traducciones.texto("nuevoPrestamo.sinClientes", idioma), fontSize = 13.sp, color = t.textoSecundario, modifier = Modifier.fillMaxWidth().padding(20.dp), textAlign = TextAlign.Center)
        } else {
            Column(modifier = Modifier.fillMaxWidth().background(t.fondoPrincipal, RoundedCornerShape(10.dp)).border(1.dp, t.bordeClaro, RoundedCornerShape(10.dp))) {
                Row(Modifier.fillMaxWidth().background(t.fondoTerciario, RoundedCornerShape(10.dp)).padding(horizontal = 10.dp, vertical = 8.dp)) {
                    Text(Traducciones.texto("nuevoPrestamo.tablaCliente", idioma), fontSize = 11.sp, fontWeight = FontWeight.Bold, color = t.textoSecundario, modifier = Modifier.weight(1f))
                    Text(Traducciones.texto("nuevoPrestamo.tablaDoc", idioma), fontSize = 11.sp, fontWeight = FontWeight.Bold, color = t.textoSecundario, modifier = Modifier.width(84.dp))
                    Text(Traducciones.texto("nuevoPrestamo.tablaTel", idioma), fontSize = 11.sp, fontWeight = FontWeight.Bold, color = t.textoSecundario, modifier = Modifier.width(80.dp))
                }
                clientes.forEach { c ->
                    val activo = sel?.id == c.id
                    Row(
                        modifier = Modifier.fillMaxWidth().background(if (activo) t.primarioClaro else Color.Transparent).clickable { onSel(c) }.padding(horizontal = 10.dp, vertical = 10.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(Modifier.weight(1f), verticalAlignment = Alignment.CenterVertically) {
                            Box(Modifier.size(28.dp).background(t.fondoTerciario, CircleShape), contentAlignment = Alignment.Center) {
                                Text(c.nombre.take(1), fontSize = 12.sp, fontWeight = FontWeight.Bold, color = t.textoSecundario)
                            }
                            Spacer(Modifier.width(8.dp))
                            Column {
                                Text("${c.nombre} ${c.apellidos}".trim().ifBlank { "—" }, fontSize = 12.sp, fontWeight = FontWeight.SemiBold, color = t.textoPrimario, maxLines = 1, overflow = TextOverflow.Ellipsis)
                                Text(c.direccion.ifBlank { "—" }, fontSize = 9.sp, color = t.textoTerciario, maxLines = 1, overflow = TextOverflow.Ellipsis)
                            }
                        }
                        Text(c.documento.ifBlank { "—" }, fontSize = 10.sp, color = t.textoSecundario, modifier = Modifier.width(84.dp), maxLines = 1, overflow = TextOverflow.Ellipsis)
                        Text(c.telefono.ifBlank { "—" }, fontSize = 10.sp, color = t.textoSecundario, modifier = Modifier.width(80.dp), maxLines = 1, overflow = TextOverflow.Ellipsis)
                    }
                }
            }

            if (totalPaginas > 1) {
                Spacer(Modifier.height(10.dp))
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.Center, verticalAlignment = Alignment.CenterVertically) {
                    BotonPagina(Icons.Outlined.ChevronLeft, pagina == 1) { onPagina((pagina - 1).coerceAtLeast(1)) }
                    Spacer(Modifier.width(10.dp))
                    Text("${Traducciones.texto("nuevoPrestamo.pagina", idioma)} $pagina ${Traducciones.texto("nuevoPrestamo.de", idioma)} $totalPaginas · $totalClientes ${Traducciones.texto("nuevoPrestamo.clientes", idioma)}", fontSize = 12.sp, color = t.textoSecundario)
                    Spacer(Modifier.width(10.dp))
                    BotonPagina(Icons.Outlined.ChevronRight, pagina == totalPaginas) { onPagina((pagina + 1).coerceAtMost(totalPaginas)) }
                }
            } else {
                Spacer(Modifier.height(10.dp))
                Text("${Traducciones.texto("nuevoPrestamo.pagina", idioma)} 1 ${Traducciones.texto("nuevoPrestamo.de", idioma)} 1 · $totalClientes ${Traducciones.texto("nuevoPrestamo.clientes", idioma)}", fontSize = 12.sp, color = t.textoTerciario, textAlign = TextAlign.Center, modifier = Modifier.fillMaxWidth())
            }
        }
    }
}

@Composable
private fun BotonPagina(icono: androidx.compose.ui.graphics.vector.ImageVector, deshabilitado: Boolean, onClick: () -> Unit) {
    Box(
        modifier = Modifier
            .size(32.dp)
            .background(if (deshabilitado) t_terciario() else t_primario(), RoundedCornerShape(8.dp))
            .clickable(enabled = !deshabilitado, onClick = onClick),
        contentAlignment = Alignment.Center
    ) { Icon(icono, null, tint = if (deshabilitado) t_terciarioTexto() else Color.White, modifier = Modifier.size(16.dp)) }
}

@Composable
private fun PasoPlanNuevo(
    planSel: PlanFin?, onPlan: (PlanFin?) -> Unit, opcionSel: OpcionPlan?, onOpcion: (OpcionPlan?) -> Unit,
    numeroMeses: String, onNumeroMeses: (String) -> Unit, t: TokensWeb, idioma: Idioma
) {
    Column(modifier = Modifier.padding(horizontal = 14.dp)) {
        TituloSeccion(Icons.Outlined.Description, Traducciones.texto("nuevoPrestamo.seleccionarPlan", idioma), t)
        obtenerPlanesFinPantalla().forEach { plan ->
            val activo = planSel?.id == plan.id
            Column(
                modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp).background(if (activo) t.primarioClaro else t.fondoPrincipal, RoundedCornerShape(10.dp)).border(1.dp, if (activo) t.primario else t.bordeClaro, RoundedCornerShape(10.dp)).clickable {
                    onPlan(if (activo) null else plan); onOpcion(null); onNumeroMeses("")
                }.padding(12.dp)
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(Modifier.size(38.dp).background(if (activo) t.primario else t.fondoTerciario, RoundedCornerShape(8.dp)), contentAlignment = Alignment.Center) {
                        Icon(Icons.Outlined.CreditCard, null, tint = if (activo) Color.White else t.primario, modifier = Modifier.size(18.dp))
                    }
                    Spacer(Modifier.width(10.dp))
                    Column(Modifier.weight(1f)) {
                        Text(plan.nombre, fontSize = 14.sp, fontWeight = FontWeight.Bold, color = t.textoPrimario)
                        Text(plan.codigo, fontSize = 10.sp, color = t.textoTerciario)
                        Spacer(Modifier.height(4.dp))
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text("${plan.tasaInteres}% ${Traducciones.texto("nuevoPrestamo.interes", idioma)}", fontSize = 11.sp, color = t.textoSecundario)
                            Spacer(Modifier.width(10.dp))
                            Text(plan.frecuencia, fontSize = 11.sp, color = t.textoSecundario)
                            if (plan.moraPct > 0) {
                                Spacer(Modifier.width(10.dp))
                                Text("${plan.moraPct}% ${Traducciones.texto("nuevoPrestamo.mora", idioma)}", fontSize = 11.sp, color = t.textoSecundario)
                            }
                        }
                    }
                    if (activo) Icon(Icons.Outlined.CheckCircle, null, tint = t.primario, modifier = Modifier.size(22.dp))
                }
            }
        }

        if (planSel?.opciones?.isNotEmpty() == true) {
            Spacer(Modifier.height(12.dp))
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(Traducciones.texto("nuevoPrestamo.plazoSugerido", idioma), fontSize = 13.sp, fontWeight = FontWeight.SemiBold, color = t.textoPrimario)
                Spacer(Modifier.width(6.dp))
                Text(Traducciones.texto("nuevoPrestamo.opcional", idioma), fontSize = 10.sp, color = t.textoTerciario)
            }
            Spacer(Modifier.height(8.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                planSel.opciones.forEach { op ->
                    val selOp = opcionSel?.meses == op.meses
                    Column(
                        modifier = Modifier
                            .background(if (selOp) t.primario else t.fondoPrincipal, RoundedCornerShape(8.dp))
                            .border(1.dp, if (selOp) t.primario else t.bordeMedio, RoundedCornerShape(8.dp))
                            .clickable {
                                if (selOp) { onOpcion(null); onNumeroMeses("") }
                                else { onOpcion(op); onNumeroMeses("${op.meses}") }
                            }
                            .padding(horizontal = 18.dp, vertical = 10.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text("${op.meses}", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = if (selOp) Color.White else t.primario)
                        Text(Traducciones.texto("nuevoPrestamo.cuotasLower", idioma), fontSize = 10.sp, color = if (selOp) Color.White.copy(alpha = 0.9f) else t.textoSecundario)
                    }
                }
            }
            Spacer(Modifier.height(6.dp))
            Text(Traducciones.texto("nuevoPrestamo.plazoHint", idioma), fontSize = 10.sp, color = t.textoTerciario)
        }
    }
}

@Composable
private fun PasoMontosNuevo(
    montoTotal: String, onMonto: (String) -> Unit, montoAdelantado: String, onAdelanto: (String) -> Unit,
    numeroMeses: String, onMeses: (String) -> Unit, fechaInicio: String, onFecha: (String) -> Unit,
    notas: String, onNotas: (String) -> Unit, planSel: PlanFin?, opcionSel: OpcionPlan?, cuotas: Int,
    mf: Double, tasa: Double, totalPagar: Double, totalIntereses: Double, cuotaMonto: Double,
    adelantoNum: Double, saldoRestante: Double, fechaFin: String, t: TokensWeb, idioma: Idioma
) {
    Column(modifier = Modifier.padding(horizontal = 14.dp)) {
        TituloSeccion(Icons.Outlined.Payments, Traducciones.texto("nuevoPrestamo.montosTitulo", idioma), t)
        if (planSel != null) {
            Row(
                modifier = Modifier.fillMaxWidth().background(Color(0xFF3B82F6).copy(alpha = 0.1f), RoundedCornerShape(8.dp)).padding(10.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(Icons.Outlined.Info, null, tint = Color(0xFF3B82F6), modifier = Modifier.size(16.dp))
                Spacer(Modifier.width(8.dp))
                Text(
                    "${planSel.nombre} · ${tasa}% ${Traducciones.texto("nuevoPrestamo.interes", idioma)} · ${Traducciones.texto("nuevoPrestamo.frecuencia", idioma)}: ${planSel.frecuencia}",
                    fontSize = 11.sp, color = t.textoSecundario
                )
            }
            Spacer(Modifier.height(12.dp))
        }

        EtiquetaCampo(Traducciones.texto("nuevoPrestamo.montoTotal", idioma), t)
        CampoMoneda(valor = montoTotal, onValor = onMonto, tokens = t)
        Spacer(Modifier.height(12.dp))

        EtiquetaCampo(Traducciones.texto("nuevoPrestamo.pagoAdelantado", idioma), t)
        CampoMoneda(valor = montoAdelantado, onValor = onAdelanto, tokens = t)
        Text(Traducciones.texto("nuevoPrestamo.adelantoHint", idioma), fontSize = 10.sp, color = t.textoTerciario, modifier = Modifier.padding(top = 4.dp))
        if (totalPagar > 0 && adelantoNum >= totalPagar) {
            Text(Traducciones.texto("nuevoPrestamo.adelantoError", idioma) + " (${fmtMontoFin(totalPagar)})", fontSize = 10.sp, color = Color(0xFFEF4444), modifier = Modifier.padding(top = 4.dp))
        }
        Spacer(Modifier.height(12.dp))

        EtiquetaCampo(Traducciones.texto("nuevoPrestamo.numMeses", idioma), t)
        CampoWeb(valor = numeroMeses, onValor = onMeses, tokens = t, placeholder = "Ej: 12", alto = 42, tipoTexto = KeyboardType.Number)
        if (opcionSel?.meses != null && numeroMeses == opcionSel.meses.toString()) {
            Text("${Traducciones.texto("nuevoPrestamo.plazoElegido", idioma)}: ${opcionSel.meses}", fontSize = 10.sp, color = t.textoSecundario, modifier = Modifier.padding(top = 4.dp))
        }
        Spacer(Modifier.height(12.dp))

        EtiquetaCampo(Traducciones.texto("nuevoPrestamo.fechaInicio", idioma), t)
        CampoWeb(valor = fechaInicio, onValor = onFecha, tokens = t, placeholder = "15/08/2026", alto = 42)
        Spacer(Modifier.height(12.dp))

        EtiquetaCampo(Traducciones.texto("nuevoPrestamo.notas", idioma), t)
        CampoWeb(valor = notas, onValor = onNotas, tokens = t, placeholder = Traducciones.texto("nuevoPrestamo.notasPlaceholder", idioma), alto = 52)

        if (mf > 0 && cuotas > 0) {
            Spacer(Modifier.height(14.dp))
            Column(
                modifier = Modifier.fillMaxWidth().background(t.fondoPrincipal, RoundedCornerShape(10.dp)).border(1.dp, t.bordeClaro, RoundedCornerShape(10.dp)).padding(12.dp)
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Outlined.Calculate, null, tint = t.primario, modifier = Modifier.size(16.dp))
                    Spacer(Modifier.width(6.dp))
                    Text(Traducciones.texto("nuevoPrestamo.resumenCalculo", idioma), fontSize = 14.sp, fontWeight = FontWeight.Bold, color = t.textoPrimario)
                }
                Spacer(Modifier.height(8.dp))
                FilaResumen(Traducciones.texto("nuevoPrestamo.montoFinanciar", idioma), fmtMontoFin(mf), t)
                FilaResumen("${Traducciones.texto("nuevoPrestamo.interes", idioma)} (${tasa}%)", fmtMontoFin(totalIntereses), t)
                FilaResumen(Traducciones.texto("nuevoPrestamo.totalPagar", idioma), fmtMontoFin(totalPagar), t, resaltar = true)
                if (adelantoNum > 0) {
                    FilaResumen(Traducciones.texto("nuevoPrestamo.adelanto", idioma), "- ${fmtMontoFin(adelantoNum)}", t)
                    FilaResumen(Traducciones.texto("nuevoPrestamo.saldoRestante", idioma), fmtMontoFin(saldoRestante), t, resaltar = true)
                }
                FilaResumen("${Traducciones.texto("nuevoPrestamo.cuota", idioma)} (${planSel?.frecuencia ?: ""})", fmtMontoFin(cuotaMonto), t)
                FilaResumen(Traducciones.texto("nuevoPrestamo.numCuotasLb", idioma), "$cuotas", t)
                FilaResumen(Traducciones.texto("nuevoPrestamo.fechaFin", idioma), fechaFin, t)
            }
        }
    }
}

@Composable
private fun EtiquetaCampo(texto: String, t: TokensWeb) {
    Text(texto, fontSize = 12.sp, fontWeight = FontWeight.SemiBold, color = t.textoSecundario)
    Spacer(Modifier.height(5.dp))
}

@Composable
private fun FilaResumen(label: String, valor: String, t: TokensWeb, resaltar: Boolean = false) {
    Row(Modifier.fillMaxWidth().padding(vertical = 3.dp), verticalAlignment = Alignment.CenterVertically) {
        Text(label, fontSize = 11.sp, color = t.textoSecundario, modifier = Modifier.weight(1f))
        Text(valor, fontSize = 12.sp, fontWeight = if (resaltar) FontWeight.Bold else FontWeight.SemiBold, color = if (resaltar) t.primario else t.textoPrimario)
    }
}

@Composable
private fun PasoExtrasNuevo(
    tieneFiador: Boolean, onFiador: (Boolean) -> Unit, fiador: FiadorNuevo, onFiadorVal: (FiadorNuevo) -> Unit,
    tieneActivos: Boolean, onActivos: (Boolean) -> Unit, activos: List<ActivoNuevo>, onActivosVal: (List<ActivoNuevo>) -> Unit,
    t: TokensWeb, idioma: Idioma
) {
    Column(modifier = Modifier.padding(horizontal = 14.dp)) {
        TituloSeccion(Icons.Outlined.Shield, Traducciones.texto("nuevoPrestamo.fiadorActivos", idioma), t)

        Row(Modifier.fillMaxWidth().background(t.fondoPrincipal, RoundedCornerShape(10.dp)).border(1.dp, t.bordeClaro, RoundedCornerShape(10.dp)).padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
            Column(Modifier.weight(1f)) {
                Text(Traducciones.texto("nuevoPrestamo.tieneFiador", idioma), fontSize = 13.sp, fontWeight = FontWeight.SemiBold, color = t.textoPrimario)
                Text(Traducciones.texto("nuevoPrestamo.opcional", idioma), fontSize = 10.sp, color = t.textoTerciario)
            }
            ToggleNuevo(tieneFiador) { onFiador(!tieneFiador) }
        }

        if (tieneFiador) {
            Spacer(Modifier.height(10.dp))
            Column(modifier = Modifier.fillMaxWidth().background(t.fondoPrincipal, RoundedCornerShape(10.dp)).border(1.dp, t.bordeClaro, RoundedCornerShape(10.dp)).padding(12.dp)) {
                EtiquetaCampo(Traducciones.texto("nuevoPrestamo.nombreCompleto", idioma), t)
                CampoWeb(valor = fiador.nombre, onValor = { onFiadorVal(fiador.copy(nombre = it)) }, tokens = t, placeholder = Traducciones.texto("nuevoPrestamo.nombreFiadorPh", idioma), alto = 40)
                Spacer(Modifier.height(10.dp))
                EtiquetaCampo(Traducciones.texto("nuevoPrestamo.cedula", idioma), t)
                CampoWeb(valor = fiador.cedula, onValor = { onFiadorVal(fiador.copy(cedula = it)) }, tokens = t, placeholder = "000-0000000-0", alto = 40)
                Spacer(Modifier.height(10.dp))
                EtiquetaCampo(Traducciones.texto("nuevoPrestamo.telefono", idioma), t)
                CampoWeb(valor = fiador.telefono, onValor = { onFiadorVal(fiador.copy(telefono = it)) }, tokens = t, placeholder = "809-000-0000", alto = 40)
                Spacer(Modifier.height(10.dp))
                EtiquetaCampo("Email", t)
                CampoWeb(valor = fiador.email, onValor = { onFiadorVal(fiador.copy(email = it)) }, tokens = t, placeholder = "correo@ejemplo.com", alto = 40)
                Spacer(Modifier.height(10.dp))
                EtiquetaCampo(Traducciones.texto("nuevoPrestamo.direccion", idioma), t)
                CampoWeb(valor = fiador.direccion, onValor = { onFiadorVal(fiador.copy(direccion = it)) }, tokens = t, placeholder = Traducciones.texto("nuevoPrestamo.direccionFiadorPh", idioma), alto = 40)
            }
        }

        Spacer(Modifier.height(14.dp))

        Row(Modifier.fillMaxWidth().background(t.fondoPrincipal, RoundedCornerShape(10.dp)).border(1.dp, t.bordeClaro, RoundedCornerShape(10.dp)).padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
            Column(Modifier.weight(1f)) {
                Text(Traducciones.texto("nuevoPrestamo.tieneActivos", idioma), fontSize = 13.sp, fontWeight = FontWeight.SemiBold, color = t.textoPrimario)
                Text(Traducciones.texto("nuevoPrestamo.opcional", idioma), fontSize = 10.sp, color = t.textoTerciario)
            }
            ToggleNuevo(tieneActivos) { onActivos(!tieneActivos) }
        }

        if (tieneActivos) {
            Spacer(Modifier.height(10.dp))
            activos.forEachIndexed { i, a ->
                Column(modifier = Modifier.fillMaxWidth().background(t.fondoPrincipal, RoundedCornerShape(10.dp)).border(1.dp, t.bordeClaro, RoundedCornerShape(10.dp)).padding(12.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text("${Traducciones.texto("nuevoPrestamo.activo", idioma)} #${i + 1}", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = t.textoPrimario, modifier = Modifier.weight(1f))
                        if (activos.size > 1) Box(Modifier.clickable { onActivosVal(activos.filterIndexed { ix, _ -> ix != i }) }.padding(4.dp)) {
                            Icon(Icons.Outlined.Delete, null, tint = Color(0xFFEF4444), modifier = Modifier.size(16.dp))
                        }
                    }
                    Spacer(Modifier.height(8.dp))
                    EtiquetaCampo(Traducciones.texto("nuevoPrestamo.nombreActivo", idioma), t)
                    CampoWeb(valor = a.nombre, onValor = { v -> onActivosVal(activos.mapIndexed { ix, x -> if (ix == i) x.copy(nombre = v) else x }) }, tokens = t, placeholder = "Ej: TV 55 pulgadas", alto = 40)
                    Spacer(Modifier.height(8.dp))
                    EtiquetaCampo(Traducciones.texto("nuevoPrestamo.serial", idioma), t)
                    CampoWeb(valor = a.serial, onValor = { v -> onActivosVal(activos.mapIndexed { ix, x -> if (ix == i) x.copy(serial = v) else x }) }, tokens = t, placeholder = Traducciones.texto("nuevoPrestamo.serialPh", idioma), alto = 40)
                    Spacer(Modifier.height(8.dp))
                    EtiquetaCampo(Traducciones.texto("nuevoPrestamo.valor", idioma) + " (RD$)", t)
                    CampoWeb(valor = a.valor, onValor = { v -> onActivosVal(activos.mapIndexed { ix, x -> if (ix == i) x.copy(valor = v) else x }) }, tokens = t, placeholder = "0.00", alto = 40, tipoTexto = KeyboardType.Decimal)
                    Spacer(Modifier.height(8.dp))
                    EtiquetaCampo(Traducciones.texto("nuevoPrestamo.descripcion", idioma), t)
                    CampoWeb(valor = a.descripcion, onValor = { v -> onActivosVal(activos.mapIndexed { ix, x -> if (ix == i) x.copy(descripcion = v) else x }) }, tokens = t, placeholder = Traducciones.texto("nuevoPrestamo.descripcionPh", idioma), alto = 40)
                }
                Spacer(Modifier.height(8.dp))
            }
            Row(
                modifier = Modifier.fillMaxWidth().background(t.fondoTerciario, RoundedCornerShape(8.dp)).clickable { onActivosVal(activos + ActivoNuevo("", "", "", "")) }.padding(vertical = 10.dp),
                horizontalArrangement = Arrangement.Center,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(Icons.Outlined.Add, null, tint = t.primario, modifier = Modifier.size(16.dp))
                Spacer(Modifier.width(5.dp))
                Text(Traducciones.texto("nuevoPrestamo.agregarActivo", idioma), color = t.primario, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
            }
        }
    }
}

@Composable
private fun ToggleNuevo(activo: Boolean, onClick: () -> Unit) {
    Box(
        Modifier
            .width(44.dp)
            .height(24.dp)
            .background(if (activo) Color(0xFF10B981) else Color(0xFFCBD5E1), CircleShape)
            .clickable(onClick = onClick)
            .padding(2.dp),
        contentAlignment = if (activo) Alignment.CenterEnd else Alignment.CenterStart
    ) { Box(Modifier.size(20.dp).background(Color.White, CircleShape)) }
}

@Composable
private fun PasoResumenNuevo(
    clienteSel: ClienteFin?, planSel: PlanFin?, cuotas: Int, mf: Double, tasa: Double,
    totalPagar: Double, totalIntereses: Double, cuotaMonto: Double, adelantoNum: Double, saldoRestante: Double,
    fechaInicio: String, fechaFin: String, tieneFiador: Boolean, fiador: FiadorNuevo, tieneActivos: Boolean,
    activos: List<ActivoNuevo>, notas: String, t: TokensWeb, idioma: Idioma
) {
    Column(modifier = Modifier.padding(horizontal = 14.dp)) {
        TituloSeccion(Icons.Outlined.CheckCircle, Traducciones.texto("nuevoPrestamo.resumenFinal", idioma), t)
        CardResumen(Traducciones.texto("nuevoPrestamo.clienteRes", idioma), t) {
            Text("${clienteSel?.nombre ?: ""} ${clienteSel?.apellidos ?: ""}", fontSize = 13.sp, fontWeight = FontWeight.Bold, color = t.textoPrimario)
            Text(clienteSel?.documento ?: "", fontSize = 11.sp, color = t.textoSecundario)
            Text(clienteSel?.telefono ?: "", fontSize = 11.sp, color = t.textoSecundario)
        }
        CardResumen(Traducciones.texto("nuevoPrestamo.planRes", idioma), t) {
            Text(planSel?.nombre ?: "", fontSize = 13.sp, fontWeight = FontWeight.Bold, color = t.textoPrimario)
            Text("$cuotas ${Traducciones.texto("nuevoPrestamo.meses", idioma)}", fontSize = 11.sp, color = t.textoSecundario)
            Text("${Traducciones.texto("nuevoPrestamo.frecuencia", idioma)}: ${planSel?.frecuencia ?: ""}", fontSize = 11.sp, color = t.textoSecundario)
        }
        CardResumen(Traducciones.texto("nuevoPrestamo.montosRes", idioma), t) {
            FilaResumen(Traducciones.texto("nuevoPrestamo.total", idioma), fmtMontoFin(mf), t)
            FilaResumen("${Traducciones.texto("nuevoPrestamo.interes", idioma)} (${tasa}%)", fmtMontoFin(totalIntereses), t)
            FilaResumen(Traducciones.texto("nuevoPrestamo.totalPagar", idioma), fmtMontoFin(totalPagar), t, resaltar = true)
            if (adelantoNum > 0) {
                FilaResumen(Traducciones.texto("nuevoPrestamo.adelanto", idioma), fmtMontoFin(adelantoNum), t)
                FilaResumen(Traducciones.texto("nuevoPrestamo.saldoRestante", idioma), fmtMontoFin(saldoRestante), t, resaltar = true)
            }
        }
        CardResumen(Traducciones.texto("nuevoPrestamo.cuotasRes", idioma), t) {
            FilaResumen(Traducciones.texto("nuevoPrestamo.totalPagar", idioma), fmtMontoFin(totalPagar), t)
            FilaResumen(Traducciones.texto("nuevoPrestamo.cuotaBase", idioma), fmtMontoFin(cuotaMonto), t)
            FilaResumen(Traducciones.texto("nuevoPrestamo.cuota", idioma), fmtMontoFin(cuotaMonto), t)
            Text("$cuotas ${Traducciones.texto("nuevoPrestamo.cuotasLower", idioma)} · ${Traducciones.texto("nuevoPrestamo.desde", idioma)} $fechaInicio", fontSize = 11.sp, color = t.textoSecundario)
            Text("${Traducciones.texto("nuevoPrestamo.hasta", idioma)} $fechaFin", fontSize = 11.sp, color = t.textoSecundario)
        }
        if (tieneFiador) {
            CardResumen(Traducciones.texto("nuevoPrestamo.fiadorRes", idioma), t) {
                Text(fiador.nombre, fontSize = 13.sp, fontWeight = FontWeight.Bold, color = t.textoPrimario)
                Text(fiador.cedula, fontSize = 11.sp, color = t.textoSecundario)
                Text(fiador.telefono, fontSize = 11.sp, color = t.textoSecundario)
            }
        }
        if (tieneActivos) {
            CardResumen("${Traducciones.texto("nuevoPrestamo.activosRes", idioma)} (${activos.filter { it.nombre.isNotBlank() }.size})", t) {
                activos.filter { it.nombre.isNotBlank() }.forEach { Text("• ${it.nombre}", fontSize = 12.sp, color = t.textoSecundario) }
            }
        }
        if (notas.isNotBlank()) {
            CardResumen(Traducciones.texto("nuevoPrestamo.notas", idioma), t) { Text(notas, fontSize = 12.sp, color = t.textoSecundario) }
        }
    }
}

@Composable
private fun CardResumen(titulo: String, t: TokensWeb, contenido: @Composable () -> Unit) {
    Column(modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp).background(t.fondoPrincipal, RoundedCornerShape(10.dp)).border(1.dp, t.bordeClaro, RoundedCornerShape(10.dp)).padding(12.dp)) {
        Text(titulo, fontSize = 12.sp, fontWeight = FontWeight.Bold, color = t.primario)
        Spacer(Modifier.height(6.dp))
        contenido()
    }
}

@Composable
private fun t_primario(): Color = Color(0xFF2563EB)

/** Genera la preview de cuotas para el resumen final, distribuyendo el adelanto
 *  igual que la web: cuotas cubiertas → "pagada", cuota parcial → "parcial" con el
 *  restante a pagar, y el resto → "pendiente". */
private fun previewCuotas(
    adelanto: Double,
    cuotaMonto: Double,
    totalCuotas: Int,
    fechaInicio: String,
    frecuencia: String
): List<CuotaContrato> {
    val lista = mutableListOf<CuotaContrato>()
    var restante = adelanto
    for (i in 1..totalCuotas) {
        val fechaVenc = sumarPeriodos(fechaInicio, i, frecuencia)
        var estado = "pendiente"
        var montoMostrar = cuotaMonto
        var fechaPago: String? = null
        if (restante > 0) {
            if (restante >= cuotaMonto) {
                estado = "pagada"
                montoMostrar = cuotaMonto
                restante -= cuotaMonto
            } else {
                estado = "parcial"
                montoMostrar = cuotaMonto - restante
                restante = 0.0
            }
            fechaPago = fechaInicio
        }
        lista.add(
            CuotaContrato(
                numero = i,
                fechaVencimiento = fechaVenc,
                diasRetraso = 0,
                cuota = fmtMontoFin(montoMostrar),
                capital = "—",
                interes = "—",
                mora = "—",
                total = fmtMontoFin(montoMostrar),
                estado = estado,
                fechaPago = fechaPago
            )
        )
    }
    return lista
}

@Composable
private fun t_terciario(): Color = Color(0xFFF1F5F9)

@Composable
private fun t_terciarioTexto(): Color = Color(0xFF94A3B8)