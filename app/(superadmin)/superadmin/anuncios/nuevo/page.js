import ClienteWrapper from "@/_EXTRAS/LadoCliente/ClienteWraper"
import NuevoAnuncio from "@/_Pages/superadmin/anuncios/nuevo/nuevo"

export default function page() {
    return (
        <div>
            <ClienteWrapper>
                <NuevoAnuncio />
            </ClienteWrapper>
        </div>
    )
}
