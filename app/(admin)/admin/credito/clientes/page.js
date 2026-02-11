import ClienteWrapper from "@/_EXTRAS/LadoCliente/ClienteWraper";
import ListaClientesCredito from "@/_Pages/admin/credito/clientes/page";

export default function ClientesCreditoPage() {
  return (
    <div>
      <ClienteWrapper>
        <ListaClientesCredito />
      </ClienteWrapper>
    </div>
  );
}
