// app/page.js
import ClienteWrapper from "@/_EXTRAS/LadoCliente/ClienteWraper";
import NuevoActivoAdmin from "@/_Pages/admin/activos/nuevo/nuevo";

export default function page() {
  return (
    <div>
      <ClienteWrapper>
        <NuevoActivoAdmin></NuevoActivoAdmin>
      </ClienteWrapper>
    </div>
  );
}

