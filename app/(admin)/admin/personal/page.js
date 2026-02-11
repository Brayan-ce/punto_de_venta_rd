import ClienteWrapper from "@/_EXTRAS/LadoCliente/ClienteWraper";
import PersonalAdmin from "@/_Pages/admin/personal/personal";

export default function Page() {
  return (
    <ClienteWrapper>
      <PersonalAdmin />
    </ClienteWrapper>
  );
}

