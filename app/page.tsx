import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import Link from "next/link";

export default async function Index() {
  const cookeStore = cookies();
  const supabase = createServerComponentClient({ cookies: () => cookeStore });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="w-full flex flex-col items-center">
      <div className="flex flex-col gap-8 max-w-6xl px-4 py-12 lg:py-16 text-foreground">
        {/* Hero Section */}
        <div className="flex flex-col items-center mb-8 lg:mb-12">
          <h1 className="text-4xl lg:text-5xl font-bold text-primary mb-6 text-center">
            Hacemos agricultura regenerativa
          </h1>
          <p className="text-xl lg:text-2xl leading-relaxed mx-auto max-w-2xl text-center mb-10">
            Diseñamos, producimos y comercializamos productos únicos en el
            mercado, que potencian el desempeño y asimilación de los nutrientes
            en los cultivos.
          </p>
          {user ? (
            <div className="flex flex-row gap-4">
              <Link
                href="/files"
                className="bg-primary py-3 px-8 rounded-lg font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Subir Documentos
              </Link>
              <Link
                href="/chat"
                className="border border-primary py-3 px-8 rounded-lg font-medium text-primary hover:bg-primary/10 transition-colors"
              >
                Consultar
              </Link>
            </div>
          ) : (
            <div className="flex flex-row gap-4">
              <Link
                href="/login"
                className="bg-primary py-3 px-8 rounded-lg font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Iniciar Sesión
              </Link>
            </div>
          )}
        </div>

        {/* Features Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 my-12">
          <div className="flex flex-col items-center border border-primary/20 rounded-lg p-8 hover:shadow-md transition-shadow bg-card">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <svg
                className="w-8 h-8 fill-primary"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M12,2A10,10,0,1,0,22,12,10,10,0,0,0,12,2Zm5.676,7.237-6,5.5a1,1,0,0,1-1.383-.03l-3-3a1,1,0,0,1,1.414-1.414l2.323,2.323,5.294-4.853a1,1,0,1,1,1.352,1.474Z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-primary mb-2">
              Reducimos Costos
            </h3>
            <p className="text-center">en el proceso de fertilización</p>
          </div>
          <div className="flex flex-col items-center border border-primary/20 rounded-lg p-8 hover:shadow-md transition-shadow bg-card">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <svg
                className="w-8 h-8 fill-primary"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M15,3H9A7,7,0,0,0,2,10v4a7,7,0,0,0,7,7h6a7,7,0,0,0,7-7V10A7,7,0,0,0,15,3Zm5,11a5,5,0,0,1-5,5H9a5,5,0,0,1-5-5V10A5,5,0,0,1,9,5h6a5,5,0,0,1,5,5ZM8.29,9.29A1,1,0,0,0,7,10.58L8.42,12,7,13.41a1,1,0,0,0,0,1.42,1,1,0,0,0,1.42,0L10,13.25l1.29,1.29a1,1,0,0,0,1.42,0,1,1,0,0,0,0-1.42L11.59,12,13,10.71a1,1,0,0,0-1.42-1.42L10,10.75Z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-primary mb-2">
              Diseñamos productos
            </h3>
            <p className="text-center">que potencian el desempeño del campo</p>
          </div>
          <div className="flex flex-col items-center border border-primary/20 rounded-lg p-8 hover:shadow-md transition-shadow bg-card">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <svg
                className="w-8 h-8 fill-primary"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M12,2A10,10,0,1,0,22,12,10,10,0,0,0,12,2Zm0,18a8,8,0,1,1,8-8A8,8,0,0,1,12,20Zm0-16a7.92,7.92,0,0,0-4.06,1.12A1,1,0,0,0,7.4,6.6a1,1,0,0,0,1.46-.49A5.92,5.92,0,0,1,12,5a1,1,0,0,0,0-2ZM12,8a4,4,0,1,0,4,4A4,4,0,0,0,12,8Zm0,6a2,2,0,1,1,2-2A2,2,0,0,1,12,14Z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-primary mb-2">
              Innovamos constantemente
            </h3>
            <p className="text-center">a partir de insumos de origen mineral</p>
          </div>
        </div>

        {/* Call to Action */}
        <div className="w-full bg-primary/10 rounded-lg p-8 my-8 text-center">
          <h2 className="text-2xl font-semibold text-primary mb-4">
            El PSD corrige la acidez del suelo y restaura en forma natural la
            degradación
          </h2>
          <p className="text-lg mb-6 max-w-3xl mx-auto">
            Nuestra esencia como Empresa está basada en la constante innovación
            tecnológica a partir de insumos de origen mineral.
          </p>
          {!user && (
            <Link
              href="/login"
              className="bg-primary py-3 px-8 rounded-lg font-medium text-primary-foreground hover:bg-primary/90 transition-colors inline-block"
            >
              Comenzar Ahora
            </Link>
          )}
        </div>

        <div className="w-full p-[1px] bg-gradient-to-r from-transparent via-primary/20 to-transparent my-4" />
      </div>
    </div>
  );
}
