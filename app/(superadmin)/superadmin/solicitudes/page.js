// app/page.js
import ClienteWrapper from "@/_EXTRAS/LadoCliente/ClienteWraper";
import SolicitudesSuperAdmin from "@/_Pages/superadmin/solicitudes/solicitudes";
export default function page() {
  return (
    <div>
      <ClienteWrapper>
        <SolicitudesSuperAdmin></SolicitudesSuperAdmin>
      </ClienteWrapper>
    </div>
  );
}
