// app/page.js
import ClienteWrapper from "@/_EXTRAS/LadoCliente/ClienteWraper";
import EditarEquipoAdmin from "@/_Pages/admin/equipos/editar/editar";
export default function page() {
  return (
    <div>
      <ClienteWrapper>
        <EditarEquipoAdmin></EditarEquipoAdmin>
      </ClienteWrapper>
    </div>
  );
}

