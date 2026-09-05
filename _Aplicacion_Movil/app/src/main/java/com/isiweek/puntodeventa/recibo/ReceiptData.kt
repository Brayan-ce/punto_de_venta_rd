package com.isiweek.puntodeventa.recibo

/**
 * Dinero seguro: se almacena en unidades menores (centavos para monedas con 2 decimales).
 * Nunca usar Double/Float para cálculos monetarios importantes.
 */
data class Money(
    val amountInMinorUnits: Long,
    val currency: String,
    val simbolo: String? = null
) {
    companion object {
        fun of(amount: Double, currency: String = "DOP", simbolo: String? = null): Money {
            val cents = Math.round(amount * 100.0)
            return Money(cents, currency, simbolo)
        }

        fun zero(currency: String = "DOP"): Money = Money(0L, currency)
    }

    fun plus(other: Money): Money {
        check(currency == other.currency) { "Monedas distintas: $currency vs ${other.currency}" }
        return Money(amountInMinorUnits + other.amountInMinorUnits, currency)
    }

    fun minus(other: Money): Money {
        check(currency == other.currency) { "Monedas distintas: $currency vs ${other.currency}" }
        return Money(amountInMinorUnits - other.amountInMinorUnits, currency)
    }

    fun isZero(): Boolean = amountInMinorUnits == 0L
}

/** Fila de la tabla de cuotas aplicadas (o productos en modo venta). */
data class ReceiptInstallment(
    val number: Int,
    val dueDate: String,
    val lateFee: Money,
    val applied: Money,
    val unitPrice: Money? = null,
    val esExtra: Boolean = false
)

/**
 * Qué secciones mostrar en el recibo. Réplica de los switches
 * "Mostrar en Recibo" de la web (imprimir.js / opcionesImpresionPago).
 */
data class ReceiptOptions(
    val showEmpresa: Boolean = true,
    val showCliente: Boolean = true,
    val showCuotas: Boolean = true,
    val showMetodo: Boolean = true,
    val showSaldo: Boolean = true,
    val showNotas: Boolean = true,
    val showMensaje: Boolean = true
) {
    companion object {
        val ALL = ReceiptOptions()
    }
}

/** Datos estructurados del recibo de pago. */
data class ReceiptData(
    val businessName: String,
    val razonSocial: String? = null,
    val rnc: String?,
    val address: String?,
    val phone: String?,

    val receiptNumber: String,
    val contractNumber: String,

    val date: String,

    val clientName: String,
    val identification: String?,
    val clientPhone: String?,
    val clientAddress: String?,
    val receivedBy: String?,

    val installments: List<ReceiptInstallment>,

    val capital: Money,
    val interest: Money,
    val lateFeeTotal: Money?,
    val totalPaid: Money,

    val paymentMethod: String,
    val reference: String?,

    val remainingBalance: Money,
    val pendingInstallments: Int,

    val issueDate: String,

    val notes: String? = null,
    val mensajeFactura: String? = null,
    val options: ReceiptOptions = ReceiptOptions.ALL,
    val esVenta: Boolean = false,
    val titulo: String? = null,
    val impuestoPorcentaje: Double? = null,
    val efectivoRecibido: Money? = null,
    val cambio: Money? = null
)