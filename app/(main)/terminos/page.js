import ClienteWrapper from "@/_EXTRAS/LadoCliente/ClienteWraper";
import TerminosCondiciones from "@/_Pages/main/terminos/terminos.js";

export default function Page() {
    return (
        <div>
            <ClienteWrapper>
                <TerminosCondiciones />
            </ClienteWrapper>
        </div>
    );
}