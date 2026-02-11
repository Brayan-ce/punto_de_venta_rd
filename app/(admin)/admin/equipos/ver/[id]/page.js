// app/page.js
import ClienteWrapper from "@/_EXTRAS/LadoCliente/ClienteWraper";
import VerEquipoAdmin from "@/_Pages/admin/equipos/ver/ver";
export default function page() {
  return (
    <div>
      <ClienteWrapper>
        <VerEquipoAdmin></VerEquipoAdmin>
      </ClienteWrapper>
    </div>
  );
}

