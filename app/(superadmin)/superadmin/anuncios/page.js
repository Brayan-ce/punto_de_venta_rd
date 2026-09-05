import ClienteWrapper from "@/_EXTRAS/LadoCliente/ClienteWraper"
import Anuncios from "@/_Pages/superadmin/anuncios/anuncios"

export default function page() {
    return (
        <div>
            <ClienteWrapper>
                <Anuncios />
            </ClienteWrapper>
        </div>
    )
}
