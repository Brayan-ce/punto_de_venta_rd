// app/(vendedor)/vendedor/clientes/ver/[id]/page.js
import ClienteWrapper from "@/_EXTRAS/LadoCliente/ClienteWraper";
import VerClienteAdmin from "@/_Pages/admin/clientes/ver/ver";
export default function page() {
  return (
    <div>
      <ClienteWrapper>
        <VerClienteAdmin returnPath="/vendedor/clientes" basePath="/vendedor" />
      </ClienteWrapper>
    </div>
  );
}
