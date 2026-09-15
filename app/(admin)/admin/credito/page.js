import ClienteWrapper from "@/_EXTRAS/LadoCliente/ClienteWraper";
import DashboardCredito from "@/_Pages/admin/credito/page";

export default function CreditoPage() {
  return (
    <div>
      <ClienteWrapper>
        <DashboardCredito />
      </ClienteWrapper>
    </div>
  );
}
