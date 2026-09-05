// app/(financiamiento)/layout.js
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import ClienteWrapper from "@/_EXTRAS/LadoCliente/ClienteWraper"
import FinanciamientoProviders from "@/app/(financiamiento)/providers"
import HeaderFinanciamiento from "@/_Pages/financiamiento/header/header"
import ModalAnuncio from "@/components/ModalAnuncio/ModalAnuncio"

export default async function FinanciamientoLayout({ children }) {
    const cookieStore = await cookies()
    const userTipo = cookieStore.get('userTipo')?.value

    if (userTipo !== 'financiamiento' && userTipo !== 'admin') {
        redirect('/login')
    }

    return (
        <FinanciamientoProviders>
            <ClienteWrapper>
                <HeaderFinanciamiento />
                <ModalAnuncio />
            </ClienteWrapper>
            {children}
        </FinanciamientoProviders>
    )
}
