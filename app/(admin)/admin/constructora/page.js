import ConstructoraAdmin from "@/_Pages/admin/constructora/constructora";

export const metadata = {
  title: 'Control de Obras y Costos | Constructora',
  description: 'Dashboard ejecutivo para gestión de obras, servicios y personal en campo'
}

export default function Page() {
  return (
    <>
      <link rel="preload" href="/lustracion_reparaciones/Hammer_3D.svg" as="image" />
      <link rel="preconnect" href="https://cdn.isiweek.com" />
      <ConstructoraAdmin />
    </>
  );
}

