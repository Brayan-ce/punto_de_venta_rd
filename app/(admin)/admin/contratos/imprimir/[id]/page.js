// app/page.js
import ClienteWrapper from "@/_EXTRAS/LadoCliente/ClienteWraper";
import ImprimirContrato from "@/_Pages/admin/contratos/extras/imprimir/imprimir";
export default function page() {
  return (
    <div>
      <ClienteWrapper>
        <ImprimirContrato></ImprimirContrato>
      </ClienteWrapper>
    </div>
  );
}
