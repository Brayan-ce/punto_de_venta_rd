// app/page.js
import ClienteWrapper from "@/_EXTRAS/LadoCliente/ClienteWraper";
import DashboardAdmin from "@/_Pages/admin/dashboard/dashboard";
export default function page() {
  return (
    <div>
      <ClienteWrapper>
        <DashboardAdmin></DashboardAdmin>
      </ClienteWrapper>
    </div>
  );
}
