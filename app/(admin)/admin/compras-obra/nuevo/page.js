import ClienteWrapper from "@/_EXTRAS/LadoCliente/ClienteWraper";
import NuevaCompraObra from "@/_Pages/admin/compras-obra/nuevo/nuevo";

export default function Page() {
  return (
    <ClienteWrapper>
      <NuevaCompraObra />
    </ClienteWrapper>
  );
}

