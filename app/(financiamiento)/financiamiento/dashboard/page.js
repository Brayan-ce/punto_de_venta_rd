import ClienteWrapper from "@/_EXTRAS/LadoCliente/ClienteWraper";
import DashboardFinanciamiento from "@/_Pages/admin/financiamiento/financiamiento";
export default function page() {
  return <ClienteWrapper><DashboardFinanciamiento basePath="/financiamiento" /></ClienteWrapper>
}
