// app/page.js
import ClienteWrapper from "@/_EXTRAS/LadoCliente/ClienteWraper";
import Reportes from "@/_Pages/admin/Roles/Obras/Secciones_Simples/Reportes/reportes";
export default function page() {
  return (
    <div>
      <ClienteWrapper>
        <Reportes></Reportes>
      </ClienteWrapper>
    </div>
  );
}
