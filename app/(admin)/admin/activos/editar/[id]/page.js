// app/page.js
import ClienteWrapper from "@/_EXTRAS/LadoCliente/ClienteWraper";
import EditarActivoAdmin from "@/_Pages/admin/activos/editar/editar";

export default function page() {
  return (
    <div>
      <ClienteWrapper>
        <EditarActivoAdmin></EditarActivoAdmin>
      </ClienteWrapper>
    </div>
  );
}

