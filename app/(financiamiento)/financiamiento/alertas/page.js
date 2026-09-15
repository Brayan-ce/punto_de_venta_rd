import ClienteWrapper from "@/_EXTRAS/LadoCliente/ClienteWraper";
import AlertasFinanciamiento from "@/_Pages/admin/financiamiento/alertas/alertas";
export default function page() {
  return <ClienteWrapper><AlertasFinanciamiento returnPath="/financiamiento/dashboard" basePath="/financiamiento" /></ClienteWrapper>
}
