import { redirect } from "react-router";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { getUserFromRequest } from "~/modules/authentication/authentication.server";
import { AuthService } from "~/modules/authentication/authentication.service";
import { useActionData } from "react-router";

export async function loader({ request }: LoaderFunctionArgs) {
  if (getUserFromRequest(request)) return redirect("/");
  return null;
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  try {
    await AuthService.forgotPassword(String(formData.get("email") ?? ""));
  } catch {}
  return { success: true, message: "Si ese email existe, recibirá un enlace de restablecimiento." };
}

export default function ForgotPasswordRoute() {
  const actionData = useActionData<typeof action>();
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0D1B2A]">
      <div className="w-full max-w-md px-6">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-8 h-8 bg-[#1B4F72] rounded flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <rect x="1" y="3" width="15" height="13" rx="1" />
                <path d="M16 8h4l3 3v5h-7V8z" />
                <circle cx="5.5" cy="18.5" r="2.5" />
                <circle cx="18.5" cy="18.5" r="2.5" />
              </svg>
            </div>
            <span className="text-white text-xl font-semibold tracking-tight">EterFleet TMS</span>
          </div>
        </div>
        <div className="bg-[#1a2d42] rounded-lg p-6 shadow-2xl">
          <h2 className="text-white text-lg font-semibold mb-2">Recuperar Contraseña</h2>
          <p className="text-[#BDC3C7] text-sm mb-6">Ingrese su email y le enviaremos un enlace de restablecimiento.</p>
          {actionData?.success && (
            <div className="mb-4 p-3 bg-green-900/30 border border-green-700 rounded text-green-400 text-sm">
              {actionData.message}
            </div>
          )}
          <form method="post" className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-[#BDC3C7] text-sm mb-2">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="w-full px-3 py-2 bg-[#0D1B2A] border border-[#2a4360] rounded text-white text-sm focus:outline-none focus:border-[#1B4F72] focus:ring-1 focus:ring-[#1B4F72]"
              />
            </div>
            <button type="submit" className="w-full py-2.5 bg-[#1B4F72] hover:bg-[#154060] text-white font-semibold rounded text-sm transition-colors">
              Enviar enlace
            </button>
          </form>
          <div className="mt-4 text-center">
            <a href="/auth/login" className="text-[#5D6D7E] text-xs hover:text-[#BDC3C7]">Volver al login</a>
          </div>
        </div>
      </div>
    </div>
  );
}
