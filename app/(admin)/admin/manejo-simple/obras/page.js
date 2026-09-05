// app/page.js
import ClienteWrapper from "@/_EXTRAS/LadoCliente/ClienteWraper";
import Obras from "@/_Pages/admin/Roles/Obras/Secciones_Simples/obras/Obras";
export default function page() {
  return (
    <div>
      <ClienteWrapper>
        <Obras></Obras>
      </ClienteWrapper>
    </div>
  );
}
