// app/(vendedor)/vendedor/clientes/nuevo/page.js
import ClienteWrapper from "@/_EXTRAS/LadoCliente/ClienteWraper";
import CrearClienteAdmin from "@/_Pages/admin/clientes/nuevo/nuevo";
export default function page() {
  return (
    <div>
      <ClienteWrapper>
        <CrearClienteAdmin returnPath="/vendedor/clientes" />
      </ClienteWrapper>
    </div>
  );
}
