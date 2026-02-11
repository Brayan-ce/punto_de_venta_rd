import ClienteWrapper from "@/_EXTRAS/LadoCliente/ClienteWraper";
import GestionAlertas from "@/_Pages/admin/credito/alertas/page";

export default function AlertasPage() {
  return (
    <div>
      <ClienteWrapper>
        <GestionAlertas />
      </ClienteWrapper>
    </div>
  );
}
