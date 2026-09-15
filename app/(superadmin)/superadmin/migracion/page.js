// app/page.js
import ClienteWrapper from "@/_EXTRAS/LadoCliente/ClienteWraper";
import MigracionEmpresas from "@/_Pages/superadmin/migracion/migracion";
export default function page() {
  return (
    <div>
      <ClienteWrapper>
        <MigracionEmpresas></MigracionEmpresas>
      </ClienteWrapper>
    </div>
  );
}
