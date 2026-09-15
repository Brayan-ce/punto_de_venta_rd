import ClienteWrapper from "@/_EXTRAS/LadoCliente/ClienteWraper";
import PlanesFinanciamiento from "@/_Pages/admin/financiamiento/planes/planes";
export default function page() {
  return <ClienteWrapper><PlanesFinanciamiento basePath="/financiamiento" /></ClienteWrapper>
}
