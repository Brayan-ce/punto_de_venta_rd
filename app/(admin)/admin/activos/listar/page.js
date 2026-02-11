import ClienteWrapper from "@/_EXTRAS/LadoCliente/ClienteWraper";
import ListarActivosAdmin from "@/_Pages/admin/activos/listar/listar";

export default function page() {
    return (
        <div>
            <ClienteWrapper>
                <ListarActivosAdmin />
            </ClienteWrapper>
        </div>
    );
}

