// app/page.js
import ClienteWrapper from "@/_EXTRAS/LadoCliente/ClienteWraper";
import ConfiguracionSuperAdmin from "@/_Pages/superadmin/configuracion/configuracion";
export default function page() {
  return (
    <div>
      <ClienteWrapper>
        <ConfiguracionSuperAdmin></ConfiguracionSuperAdmin>
      </ClienteWrapper>
    </div>
  );
}
