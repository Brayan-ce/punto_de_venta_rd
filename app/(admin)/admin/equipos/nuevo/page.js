// app/page.js
import ClienteWrapper from "@/_EXTRAS/LadoCliente/ClienteWraper";
import NuevoEquipoAdmin from "@/_Pages/admin/equipos/nuevo/nuevo";
export default function page() {
  return (
    <div>
      <ClienteWrapper>
        <NuevoEquipoAdmin></NuevoEquipoAdmin>
      </ClienteWrapper>
    </div>
  );
}

