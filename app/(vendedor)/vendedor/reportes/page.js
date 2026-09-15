// app/page.js
import ClienteWrapper from "@/_EXTRAS/LadoCliente/ClienteWraper";
import ReportesAdmin from "@/_Pages/admin/reportes/reportes";
export default function page() {
  return (
    <div>
      <ClienteWrapper>
        <ReportesAdmin></ReportesAdmin>
      </ClienteWrapper>
    </div>
  );
}
