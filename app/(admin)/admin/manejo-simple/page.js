// app/page.js
import ClienteWrapper from "@/_EXTRAS/LadoCliente/ClienteWraper";
import ManejoSimple from "@/_Pages/admin/Roles/Obras/Secciones_Simples/dashboard/dashboard";
export default function page() {
  return (
    <div>
      <ClienteWrapper>
        <ManejoSimple></ManejoSimple>
      </ClienteWrapper>
    </div>
  );
}
