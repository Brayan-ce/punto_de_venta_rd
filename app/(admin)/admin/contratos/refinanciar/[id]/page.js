import ClienteWrapper from "@/_EXTRAS/LadoCliente/ClienteWraper";
import RefinanciarContrato from "@/_Pages/admin/contratos/refinanciar/refinanciar";

export default function Page({ params }) {
  return (
    <ClienteWrapper>
      <RefinanciarContrato />
    </ClienteWrapper>
  );
}

