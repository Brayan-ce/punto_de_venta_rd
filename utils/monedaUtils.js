/**
 * Utilidades de formato monetario.
 */

export function formatCurrency(valor, options = {}) {
    const {
        currency = 'DOP',
        locale = 'es-DO',
        symbol
    } = options

    const numero = Number(valor) || 0

    if (symbol) {
        const formatoNumero = new Intl.NumberFormat(locale, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(numero)
        return `${symbol} ${formatoNumero}`
    }

    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(numero)
}

