// app/page.js
import ClienteWrapper from "@/_EXTRAS/LadoCliente/ClienteWraper";
import DashboardSuperAdmin from "@/_Pages/superadmin/dashboard/dashboard";
export default function page() {
  return (
    <div>
      <ClienteWrapper>
        <DashboardSuperAdmin></DashboardSuperAdmin>
      </ClienteWrapper>
    </div>
  );
}
