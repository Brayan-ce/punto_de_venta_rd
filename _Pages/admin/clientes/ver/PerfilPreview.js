"use client"

import estilos from "./modales.module.css"

export default function PerfilPreview({ cliente, tema, forwardedRef, className = "", empresa = null }) {
    const locale = empresa?.locale || "es-DO"
    const simboloMoneda = empresa?.simbolo_moneda || 'RD$'
    const formatearMoneda = (valor) => {
        const numero = new Intl.NumberFormat(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(valor || 0)
        return `${simboloMoneda} ${numero}`
    }

    return (
        <div
            ref={forwardedRef}
            className={`${estilos.perfilPreviewImpresion} ${estilos[tema]} ${className}`}
        >
            <div className={estilos.previewEncabezado}>
                <h2>{cliente.nombreCompleto}</h2>
                <p>{cliente.documento.tipoCodigo}: {cliente.documento.numero}</p>
            </div>

            <div className={estilos.dividerLinea}></div>

            <div className={estilos.seccionPreview}>
                <h4>📞 CONTACTO</h4>
                <p>Tel: {cliente.contacto?.telefono || 'N/A'}</p>
                <p>Email: {cliente.contacto?.email || 'N/A'}</p>
                <p>Dirección: {cliente.contacto?.direccion || 'N/A'}</p>
            </div>

            <div className={estilos.seccionPreview}>
                <h4>🛒 INFORMACIÓN COMERCIAL</h4>
                <p>Total Compras: {formatearMoneda(cliente.totalCompras)}</p>
                <p>Puntos: {cliente.puntosFidelidad || 0}</p>
                <p>Estado: {cliente.clienteActivo ? 'Activo' : 'Inactivo'}</p>
            </div>

            {cliente.credito?.tienePerfil && (
                <div className={estilos.seccionPreview}>
                    <h4>💳 PERFIL DE CRÉDITO</h4>
                    <p>Límite: {formatearMoneda(cliente.credito.limite)}</p>
                    <p>Utilizado: {formatearMoneda(cliente.credito.utilizado)}</p>
                    <p>Disponible: {formatearMoneda(cliente.credito.disponible)}</p>
                    <p>Uso: {Math.round((cliente.credito.utilizado / cliente.credito.limite) * 100)}%</p>
                </div>
            )}

            <div className={estilos.dividerLinea}></div>

            <div className={estilos.previewFooter}>
                <small>Generado: {new Date().toLocaleString(locale)}</small>
            </div>
        </div>
    )
}
