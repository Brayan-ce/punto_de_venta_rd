import ClienteWrapper from "@/_EXTRAS/LadoCliente/ClienteWraper";
import MetodosPago from "@/_Pages/admin/pagos/metodo/metodo";
export default function Page() {
  return (
    <ClienteWrapper>
      <MetodosPago></MetodosPago>
    </ClienteWrapper>
  );
}

