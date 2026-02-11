// app/page.js
import ClienteWrapper from "@/_EXTRAS/LadoCliente/ClienteWraper";
import ClientesAdmin from "@/_Pages/admin/clientes/cliente";
export default function page() {
  return (
    <div>
      <ClienteWrapper>
        <ClientesAdmin></ClientesAdmin>
      </ClienteWrapper>
    </div>
  );
}
