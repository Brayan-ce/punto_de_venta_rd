// app/page.js
import ClienteWrapper from "@/_EXTRAS/LadoCliente/ClienteWraper";
import VerActivoAdmin from "@/_Pages/admin/activos/ver/ver";

export default function page() {
  return (
    <div>
      <ClienteWrapper>
        <VerActivoAdmin></VerActivoAdmin>
      </ClienteWrapper>
    </div>
  );
}

