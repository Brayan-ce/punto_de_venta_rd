// app/page.js
import ClienteWrapper from "@/_EXTRAS/LadoCliente/ClienteWraper";
import EmpresasSuperAdmin from "@/_Pages/superadmin/empresas/empresas";
export default function page() {
  return (
    <div>
      <ClienteWrapper>
        <EmpresasSuperAdmin></EmpresasSuperAdmin>
      </ClienteWrapper>
    </div>
  );
}
