import ClienteWrapper from "@/_EXTRAS/LadoCliente/ClienteWraper";
import VerContratoFinanciamiento from "@/_Pages/admin/financiamiento/contratos/ver/[id]/ver";
export default function page() {
  return <ClienteWrapper><VerContratoFinanciamiento returnPath="/financiamiento/contratos" basePath="/financiamiento" /></ClienteWrapper>
}
