// app/page.js
import ClienteWrapper from "@/_EXTRAS/LadoCliente/ClienteWraper";
import CrearSuperAdminInicial from "@/_EXTRAS/Crear/crear";
import Login from "@/_Pages/main/login/login";
export default function page() {
  return (
    <div>
      <CrearSuperAdminInicial></CrearSuperAdminInicial>
      <ClienteWrapper>
        <Login></Login>
      </ClienteWrapper>
    </div>
  );
}
