// app/page.js
import ClienteWrapper from "@/_EXTRAS/LadoCliente/ClienteWraper";
import ActivosAdmin from "@/_Pages/admin/activos/activos";

export default function page() {
  return (
    <div>
      <ClienteWrapper>
        <ActivosAdmin></ActivosAdmin>
      </ClienteWrapper>
    </div>
  );
}

