// app/page.js
import ClienteWrapper from "@/_EXTRAS/LadoCliente/ClienteWraper";
import UsuariosSuperAdmin from "@/_Pages/superadmin/usuarios/usuarios";
export default function page() {
  return (
    <div>
      <ClienteWrapper>
        <UsuariosSuperAdmin></UsuariosSuperAdmin>
      </ClienteWrapper>
    </div>
  );
}
