// app/(vendedor)/vendedor/layout.js
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import ClienteWrapper from "@/_EXTRAS/LadoCliente/ClienteWraper"
import VendedorProviders from "@/app/(vendedor)/providers"
import HeaderVendedor from "@/_Pages/vendedor/header/header"
import ModalTerminos from "@/components/ModalTerminos/ModalTerminos"
import ModalAnuncio from "@/components/ModalAnuncio/ModalAnuncio"

export default async function VendedorLayout({ children }) {
    const cookieStore = await cookies()
    const userTipo = cookieStore.get('userTipo')?.value
    
    if (userTipo !== 'vendedor' && userTipo !== 'admin') {
        redirect('/login')
    }

    return (
        <VendedorProviders>
            <ClienteWrapper>
                <HeaderVendedor />
                <ModalTerminos />
                <ModalAnuncio />
            </ClienteWrapper>
            {children}
        </VendedorProviders>
    )
}