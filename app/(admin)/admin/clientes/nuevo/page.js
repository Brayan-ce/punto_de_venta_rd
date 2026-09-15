import NuevoClienteAdmin from "@/_Pages/admin/clientes/nuevo/nuevo";

export const metadata = {
    title: 'Nuevo Cliente | Punto de Venta RD',
    description: 'Registrar un nuevo cliente con perfil de crédito y fotografía',
}

export default function Page() {
    return <NuevoClienteAdmin />;
}
