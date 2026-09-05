import ClienteWrapper from "@/_EXTRAS/LadoCliente/ClienteWraper";
import NuevoContratoAdmin from "@/_Pages/admin/contratos/nuevo/nuevo";
export default function page() {
  return <ClienteWrapper><NuevoContratoAdmin returnPath="/financiamiento/contratos" /></ClienteWrapper>
}
