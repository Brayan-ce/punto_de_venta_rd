import ClienteWrapper from "@/_EXTRAS/LadoCliente/ClienteWraper";
import BitacoraAdmin from "@/_Pages/admin/bitacora/bitacora";

export default function Page() {
  return (
    <ClienteWrapper>
      <BitacoraAdmin />
    </ClienteWrapper>
  );
}

