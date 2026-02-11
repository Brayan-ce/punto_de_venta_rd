import ClienteWrapper from "@/_EXTRAS/LadoCliente/ClienteWraper"
import VerPedido from "@/_Pages/superadmin/tienda-b2b/pedidos/ver/[id]/ver"

/**
 * Página: Ver detalle de pedido B2B (SuperAdmin)
 * Ruta: /superadmin/tienda-b2b/pedidos/ver/[id]
 */
export default function VerPedidoPage() {
    return (
        <ClienteWrapper>
            <VerPedido/>
        </ClienteWrapper>
    )
}
