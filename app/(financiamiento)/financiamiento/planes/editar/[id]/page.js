import ClienteWrapper from "@/_EXTRAS/LadoCliente/ClienteWraper";
import EditarPlan from "@/_Pages/admin/planes/editar/editar";
export default function page() {
  return <ClienteWrapper><EditarPlan returnPath="/financiamiento/planes" /></ClienteWrapper>
}
