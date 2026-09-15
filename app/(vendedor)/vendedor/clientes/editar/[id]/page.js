// app/(vendedor)/vendedor/clientes/editar/[id]/page.js
import ClienteWrapper from "@/_EXTRAS/LadoCliente/ClienteWraper";
import EditarClienteAdmin from "@/_Pages/admin/clientes/editar/editar";
export default function page() {
  return (
    <div>
      <ClienteWrapper>
        <EditarClienteAdmin returnPath="/vendedor/clientes" />
      </ClienteWrapper>
    </div>
  );
}
