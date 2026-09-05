import ClienteWrapper from "@/_EXTRAS/LadoCliente/ClienteWraper";
import ClientesAdmin from "@/_Pages/admin/clientes/cliente";

export const metadata = {
  title: 'Gestión de Clientes | Punto de Venta RD',
  description: 'Administración de cartera de clientes, estados crediticios y fidelización.',
}

export default function Page() {
  return (
    <ClienteWrapper>
      <ClientesAdmin />
    </ClienteWrapper>
  );
}
