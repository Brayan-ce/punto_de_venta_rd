// app/page.js
import ClienteWrapper from "@/_EXTRAS/LadoCliente/ClienteWraper";
import Asistencia from "@/_Pages/admin/Roles/Obras/Secciones_Simples/Asistencia/asistencia";
export default function page() {
  return (
    <div>
      <ClienteWrapper>
        <Asistencia></Asistencia>
      </ClienteWrapper>
    </div>
  );
}
