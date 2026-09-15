import ClienteWrapper from "@/_EXTRAS/LadoCliente/ClienteWraper";
import NuevoPlan from "@/_Pages/admin/planes/nuevo/nuevo";
export default function page() {
  return <ClienteWrapper><NuevoPlan returnPath="/financiamiento/planes" /></ClienteWrapper>
}
