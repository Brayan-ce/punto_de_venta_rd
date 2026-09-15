import ClienteWrapper from "@/_EXTRAS/LadoCliente/ClienteWraper";
import ServiciosAdmin from "@/_Pages/admin/servicios/servicios";

export default function Page() {
  return (
    <ClienteWrapper>
      <ServiciosAdmin />
    </ClienteWrapper>
  );
}

