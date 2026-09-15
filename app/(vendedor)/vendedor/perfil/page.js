// app/page.js
import ClienteWrapper from "@/_EXTRAS/LadoCliente/ClienteWraper";
import PerfilAdmin from "@/_Pages/admin/perfil/perfil";
export default function page() {
  return (
    <div>
      <ClienteWrapper>
        <PerfilAdmin></PerfilAdmin>
      </ClienteWrapper>
    </div>
  );
}
