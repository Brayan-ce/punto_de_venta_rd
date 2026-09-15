import ClienteWrapper from "@/_EXTRAS/LadoCliente/ClienteWraper";
import ListarContratos from "@/_Pages/admin/contratos/listar/listar";
export default function Page() {
  return (
    <ClienteWrapper>
      <ListarContratos />
    </ClienteWrapper>
  );
}

