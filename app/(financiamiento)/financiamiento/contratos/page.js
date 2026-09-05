import ClienteWrapper from "@/_EXTRAS/LadoCliente/ClienteWraper";
import ContratosFinanciamiento from "@/_Pages/admin/financiamiento/contratos/contratos";
export default function page() {
  return <ClienteWrapper><ContratosFinanciamiento returnPath="/financiamiento/dashboard" basePath="/financiamiento" /></ClienteWrapper>
}
