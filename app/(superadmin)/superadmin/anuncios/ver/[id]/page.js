import ClienteWrapper from "@/_EXTRAS/LadoCliente/ClienteWraper"
import VerAnuncio from "@/_Pages/superadmin/anuncios/ver/ver"

export default function page() {
    return (
        <div>
            <ClienteWrapper>
                <VerAnuncio />
            </ClienteWrapper>
        </div>
    )
}
