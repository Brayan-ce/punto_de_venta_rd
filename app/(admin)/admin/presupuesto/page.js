import ClienteWrapper from "@/_EXTRAS/LadoCliente/ClienteWraper";
import PresupuestoAdmin from "@/_Pages/admin/presupuesto/presupuesto";

export default function Page() {
  return (
    <ClienteWrapper>
      <PresupuestoAdmin />
    </ClienteWrapper>
  );
}

