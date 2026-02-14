// app/page.js
import ClienteWrapper from "@/_EXTRAS/LadoCliente/ClienteWraper";
import Trabajadores from "@/_Pages/admin/Roles/Obras/Secciones_Simples/trabajadores/trabajadores";
export default function page() {
  return (
    <div>
      <ClienteWrapper>
        <Trabajadores></Trabajadores>
      </ClienteWrapper>
    </div>
  );
}
