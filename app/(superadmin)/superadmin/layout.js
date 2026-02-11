// app/(superadmin)/superadmin/layout.js
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import ClienteWrapper from "@/_EXTRAS/LadoCliente/ClienteWraper"
import HeaderSuperAdmin from "@/_Pages/superadmin/header/header"
import ModalTerminos from "@/components/ModalTerminos/ModalTerminos"

export default async function SuperAdminLayout({ children }) {
    const cookieStore = await cookies()
    const userTipo = cookieStore.get('userTipo')?.value

    if (userTipo !== 'superadmin') {
        redirect('/login')
    }

    return (
        <>
            <ClienteWrapper>
                <HeaderSuperAdmin />
                <ModalTerminos />
            </ClienteWrapper>
            {children}
        </>
    )
}