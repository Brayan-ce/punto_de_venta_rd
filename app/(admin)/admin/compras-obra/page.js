import ClienteWrapper from "@/_EXTRAS/LadoCliente/ClienteWraper";
import ComprasObraAdmin from "@/_Pages/admin/compras-obra/compras-obra";

export default function Page() {
  return (
    <ClienteWrapper>
      <ComprasObraAdmin />
    </ClienteWrapper>
  );
}

