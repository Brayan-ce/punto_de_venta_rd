package com.isiweek.puntodeventa.header

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.ChevronRight
import androidx.compose.material.icons.outlined.DarkMode
import androidx.compose.material.icons.outlined.Logout
import androidx.compose.material.icons.outlined.Menu
import androidx.compose.material.icons.outlined.Notifications
import androidx.compose.material.icons.outlined.Person
import androidx.compose.material.icons.outlined.PersonOutline
import androidx.compose.material.icons.outlined.WbSunny
import androidx.compose.material3.Badge
import androidx.compose.material3.BadgedBox
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.isiweek.puntodeventa.R
import com.isiweek.puntodeventa.i18n.Idioma
import com.isiweek.puntodeventa.i18n.Traducciones

/**
 * HeaderTop: réplica del header responsive de la web en móvil.
 * En móvil la web oculta el navDesktop y muestra: hamburguesa, logo y acciones
 * (notificaciones, tema, idioma ES/EN y usuario con avatar + chevron).
 */
@Composable
fun HeaderTop(
    idioma: Idioma,
    oscuro: Boolean,
    totalNotificaciones: Int = 0,
    alAlternarTema: () -> Unit,
    alAlternarIdioma: () -> Unit,
    alAbrirMenu: () -> Unit
) {
    val colorFondo = if (oscuro) Color(0xFF1E293B) else Color(0xFFFFFFFF)       // .header.light/.dark
    val colorBorde = if (oscuro) Color(0xFF334155) else Color(0xFFE5E7EB)       // border-color
    val colorIcono = if (oscuro) Color(0xFFF1F5F9) else Color(0xFF0F172A)       // botonMenu / logoTexto
    val colorAccion = if (oscuro) Color(0xFF94A3B8) else Color(0xFF64748B)      // botonTema default

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .background(colorFondo)
            .statusBarsPadding()
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .height(52.dp)
                .padding(horizontal = 8.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            // Boton de menu (hamburguesa) → .botonMenu
            BotonChico(oscuro = oscuro, tint = colorIcono, onClick = alAbrirMenu) {
                Icon(
                    imageVector = Icons.Outlined.Menu,
                    contentDescription = Traducciones.texto("header.abrirMenu", idioma),
                    tint = colorIcono,
                    modifier = Modifier.size(22.dp)
                )
            }

            // Logo de la plataforma (imagen + texto) → .logo
            Row(
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier
                    .fillMaxWidth()
                    .weight(1f)
                    .padding(horizontal = 4.dp)
            ) {
                Icon(
                    painter = painterResource(R.drawable.logo),
                    contentDescription = null,
                    tint = Color(0xFF3B82F6),
                    modifier = Modifier.size(26.dp)
                )
                Spacer(Modifier.width(6.dp))
                Text(
                    text = Traducciones.texto("header.puntoDeVenta", idioma),
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Bold,
                    color = colorIcono,
                    maxLines = 1
                )
            }

            // Acciones → .acciones
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(4.dp)
            ) {
                // Notificaciones → .botonNotif
                BotonChico(oscuro = oscuro, tint = colorAccion, onClick = { }) {
                    BadgedBox(badge = {
                        if (totalNotificaciones > 0) {
                            Badge {
                                Text(
                                    text = if (totalNotificaciones > 99) "99+" else "$totalNotificaciones",
                                    fontSize = 9.sp,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                        }
                    }) {
                        Icon(
                            imageVector = Icons.Outlined.Notifications,
                            contentDescription = Traducciones.texto("header.notificaciones", idioma),
                            tint = colorAccion,
                            modifier = Modifier.size(18.dp)
                        )
                    }
                }

                // Toggle de tema → .botonTema (sol/luna)
                BotonChico(oscuro = oscuro, tint = colorAccion, onClick = alAlternarTema) {
                    Icon(
                        imageVector = if (oscuro) Icons.Outlined.WbSunny else Icons.Outlined.DarkMode,
                        contentDescription = null,
                        tint = colorAccion,
                        modifier = Modifier.size(18.dp)
                    )
                }

                // Idioma ES/EN → .botonIdioma
                BotonChico(oscuro = oscuro, tint = colorAccion, onClick = alAlternarIdioma) {
                    Text(
                        text = idioma.codigo.uppercase(),
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        color = colorAccion
                    )
                }

                // Usuario (avatar + chevron) → .usuario
                MenuUsuario(oscuro, idioma)
            }
        }
        HorizontalDivider(color = colorBorde)
    }
}

/** Botón cuadrado tipo .botonTema /.botonMenu /.botonIdioma (38x38, radius 10, fondo como la web) */
@Composable
private fun BotonChico(
    oscuro: Boolean,
    tint: Color,
    onClick: () -> Unit,
    contenido: @Composable () -> Unit
) {
    val colorFondo = if (oscuro) Color(0xFF334155) else Color(0xFFF1F5F9) // .botonTema background

    Box(
        modifier = Modifier
            .size(38.dp)
            .clip(RoundedCornerShape(10.dp))
            .background(colorFondo)
            .clickable(onClick = onClick),
        contentAlignment = Alignment.Center
    ) {
        contenido()
    }
}

/** Bloque usuario: avatar con persona + chevron, abre menú desplegable (perfil / salir) */
@Composable
private fun MenuUsuario(
    oscuro: Boolean,
    idioma: Idioma
) {
    var menuAbierto by remember { mutableStateOf(false) }

    val colorFondoAvatar = if (oscuro) Color(0xFF60A5FA).copy(alpha = 0.15f) else Color(0xFF0284C7).copy(alpha = 0.1f)
    val colorAvatar = if (oscuro) Color(0xFF60A5FA) else Color(0xFF0284C7)

    Box {
        Row(
            modifier = Modifier
                .clip(RoundedCornerShape(10.dp))
                .background(colorFondoAvatar)
                .clickable { menuAbierto = true }
                .padding(horizontal = 6.dp, vertical = 4.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(4.dp)
        ) {
            Icon(
                imageVector = Icons.Outlined.PersonOutline,
                contentDescription = Traducciones.texto("header.usuario", idioma),
                tint = colorAvatar,
                modifier = Modifier.size(20.dp)
            )
            Icon(
                imageVector = Icons.Outlined.ChevronRight,
                contentDescription = null,
                tint = colorAvatar,
                modifier = Modifier.size(14.dp)
            )
        }

        DropdownMenu(
            expanded = menuAbierto,
            onDismissRequest = { menuAbierto = false },
            containerColor = if (oscuro) Color(0xFF0F172A) else Color(0xFFFFFFFF)
        ) {
            DropdownMenuItem(
                text = { Text("Perfil") },
                onClick = { menuAbierto = false },
                leadingIcon = { Icon(Icons.Outlined.Person, contentDescription = null) }
            )
            HorizontalDivider(color = if (oscuro) Color(0xFF334155) else Color(0xFFE2E8F0))
            DropdownMenuItem(
                text = { Text(Traducciones.texto("header.salir", idioma), color = MaterialTheme.colorScheme.error) },
                onClick = { menuAbierto = false },
                leadingIcon = {
                    Icon(Icons.Outlined.Logout, contentDescription = null, tint = MaterialTheme.colorScheme.error)
                }
            )
        }
    }
}