import ClienteWrapper from "@/_EXTRAS/LadoCliente/ClienteWraper";
import ListarEquiposAdmin from "@/_Pages/admin/equipos/listar/listar";

export default function page() {
    return (
        <div>
            <ClienteWrapper>
                <ListarEquiposAdmin />
            </ClienteWrapper>
        </div>
    );
}

