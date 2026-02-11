// app/page.js
import ClienteWrapper from "@/_EXTRAS/LadoCliente/ClienteWraper";
import EquiposAdmin from "@/_Pages/admin/equipos/equipos";
export default function page() {
  return (
    <div>
      <ClienteWrapper>
        <EquiposAdmin></EquiposAdmin>
      </ClienteWrapper>
    </div>
  );
}

