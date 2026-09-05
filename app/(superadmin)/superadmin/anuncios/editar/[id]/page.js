import ClienteWrapper from "@/_EXTRAS/LadoCliente/ClienteWraper"
import EditarAnuncio from "@/_Pages/superadmin/anuncios/editar/editar"

export default function page() {
    return (
        <div>
            <ClienteWrapper>
                <EditarAnuncio />
            </ClienteWrapper>
        </div>
    )
}
