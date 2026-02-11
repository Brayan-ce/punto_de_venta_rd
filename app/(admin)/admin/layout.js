// app/(admin)/admin/layout.js
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import ClienteWrapper from "@/_EXTRAS/LadoCliente/ClienteWraper"
import HeaderAdmin from "@/_Pages/admin/header/header"
import ModalTerminos from "@/components/ModalTerminos/ModalTerminos"

export default async function AdminLayout({ children }) {
    const cookieStore = await cookies()
    const userTipo = cookieStore.get('userTipo')?.value

    // ❌ Superadmin NO debe estar aquí
    if (userTipo === 'superadmin') {
        redirect('/superadmin')
    }

    // ❌ Solo admin o vendedor
    if (userTipo !== 'admin' && userTipo !== 'vendedor') {
        redirect('/login')
    }

    return (
        <>
            <ClienteWrapper>
                <HeaderAdmin />
                <ModalTerminos />
            </ClienteWrapper>
            <div className="admin-content-wrapper">
                {children}
            </div>
        </>
    )
}