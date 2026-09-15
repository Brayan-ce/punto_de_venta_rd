import ClienteWrapper from "@/_EXTRAS/LadoCliente/ClienteWraper";
import ConfiguracionCredito from "@/_Pages/admin/credito/configuracion/page";

export default function ConfiguracionPage() {
  return (
    <div>
      <ClienteWrapper>
        <ConfiguracionCredito />
      </ClienteWrapper>
    </div>
  );
}
