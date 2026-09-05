// app/(admin)/admin/layout.js
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import ClienteWrapper from "@/_EXTRAS/LadoCliente/ClienteWraper"
import AdminProviders from "@/app/(admin)/providers"
import HeaderAdmin from "@/_Pages/admin/header/header"
import ModalTerminos from "@/components/ModalTerminos/ModalTerminos"
import ModalAnuncio from "@/components/ModalAnuncio/ModalAnuncio"

export default async function AdminLayout({ children }) {
    const cookieStore = await cookies()
    const userTipo = cookieStore.get('userTipo')?.value
    if (userTipo === 'superadmin') {
        redirect('/superadmin')
    }
    if (userTipo === 'financiamiento') {
        redirect('/financiamiento/dashboard')
    }
    if (userTipo !== 'admin' && userTipo !== 'vendedor' && userTipo !== 'sucursales') {
        redirect('/login')
    }
    return (
        <AdminProviders>
            <ClienteWrapper>
                <HeaderAdmin />
                <ModalTerminos />
                <ModalAnuncio />
            </ClienteWrapper>
            <div className="admin-content-wrapper">
                {children}
            </div>
        </AdminProviders>
    )
}