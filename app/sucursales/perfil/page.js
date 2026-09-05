import ClienteWrapper from "@/_EXTRAS/LadoCliente/ClienteWraper";
import PerfilAdmin from "@/_Pages/admin/perfil/perfil";

export default function Page() {
  return (
    <div>
      <ClienteWrapper>
        <PerfilAdmin />
      </ClienteWrapper>
    </div>
  );
}
