// app/page.js
import ClienteWrapper from "@/_EXTRAS/LadoCliente/ClienteWraper";
import RecuperarPassword from "@/_Pages/main/recuperar/recuperar";
export default function page() {
  return (
    <div>
      <ClienteWrapper>
        <RecuperarPassword></RecuperarPassword>
      </ClienteWrapper>
    </div>
  );
}
