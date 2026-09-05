package com.isiweek.puntodeventa.recibo

import java.util.Locale

/**
 * Formateadores deterministas para el recibo. La lógica de formato NO vive dentro del renderer.
 */
object ReceiptFormatters {

    /** Ancho lógico del documento (equivalente a térmica 80mm), independiente de la pantalla. */
    const val RECEIPT_WIDTH = 576

    /** 101755 → "US$1,017.55" (usa el símbolo de la empresa si existe, ej. RD$ / US$). */
    fun formatMoney(money: Money): String {
        val simbolo = money.simbolo?.takeIf { it.isNotBlank() } ?: when (money.currency.uppercase()) {
            "DOP" -> "DOP"
            "USD" -> "USD"
            "EUR" -> "EUR"
            else -> money.currency
        }
        val units = money.amountInMinorUnits / 100
        val cents = Math.abs(money.amountInMinorUnits % 100)
        val neg = money.amountInMinorUnits < 0
        return if (neg) {
            "$simbolo -${String.format(Locale.US, "%,d.%02d", -units, cents)}"
        } else {
            "$simbolo${String.format(Locale.US, "%,d.%02d", units, cents)}"
        }
    }

    /** 2026-03-25 → "25 mar de 2026" (o formato corto dd/mm/yyyy según flag).
 *  Tolerante: si viene con hora (yyyy-MM-dd HH:mm:ss) solo usa la fecha. */
    fun formatDate(isoDate: String?, corto: Boolean = false): String {
        val s = isoDate ?: return "—"
        if (s.contains("/")) {
            if (corto) return s
            val partes = s.split("/")
            if (partes.size == 3) {
                return "${partes[0]} ${mesNombre(partes[1].toIntOrNull() ?: 1)} de ${partes[2]}"
            }
            return s
        }
        // Formato ISO (yyyy-MM-dd [HH:mm:ss]): tomar solo la parte de fecha
        val fecha = s.trim().take(10)
        val partes = fecha.split("-")
        if (partes.size != 3) return s
        val y = partes[0]; val m = partes[1]; val d = partes[2]
        if (corto) return "$d/$m/$y"
        val dInt = d.toIntOrNull() ?: return s
        return "$dInt ${mesNombre(m.toIntOrNull() ?: 1)} de $y"
    }

    private fun mesNombre(mes: Int): String = when (mes) {
        1 -> "ene"; 2 -> "feb"; 3 -> "mar"; 4 -> "abr"; 5 -> "may"; 6 -> "jun"
        7 -> "jul"; 8 -> "ago"; 9 -> "sep"; 10 -> "oct"; 11 -> "nov"; else -> "dic"
    }

    /** 8494324597 → "+1 849-432-4597" (solo agrupa si parece número). */
    fun formatPhone(phone: String?): String {
        val limpio = phone?.replace(Regex("\\D"), "") ?: return ""
        if (limpio.length == 10) {
            return "${limpio.substring(0, 3)}-${limpio.substring(3, 6)}-${limpio.substring(6)}"
        }
        if (limpio.length == 11 && limpio.startsWith("1")) {
            return "1 ${limpio.substring(1, 4)}-${limpio.substring(4, 7)}-${limpio.substring(7)}"
        }
        return phone.orEmpty()
    }

    fun formatIdentification(id: String?): String = id.orEmpty().trim()

    fun formatContractNumber(num: String): String = num.trim()

    fun simboloMoneda(currency: String): String = when (currency.uppercase()) {
        "DOP" -> "DOP"
        "USD" -> "USD"
        else -> currency
    }
}