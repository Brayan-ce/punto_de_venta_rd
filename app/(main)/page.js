// app/page.js
import ClienteWrapper from "@/_EXTRAS/LadoCliente/ClienteWraper";
import Login from "@/_Pages/main/login/login";
export default function page() {
  return (
    <div>
      <ClienteWrapper>
        <Login></Login>
      </ClienteWrapper>
    </div>
  );
}
