import { redirect } from "react-router";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { getUserFromRequest, signJwt, buildAuthCookie } from "~/modules/authentication/authentication.server";
import { AuthService } from "~/modules/authentication/authentication.service";
import { useConfigurables } from "~/modules/configurables";

export async function loader({ request }: LoaderFunctionArgs) {
  if (getUserFromRequest(request)) return redirect("/");
  return null;
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  try {
    const user = await AuthService.login({
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
    });
    const token = signJwt({ sub: user.id, role: user.role, username: user.username, email: user.email, email_verified: user.email_verified });
    return redirect("/", { headers: { "Set-Cookie": buildAuthCookie(token, new URL(request.url).hostname) } });
  } catch (error: any) {
    return { error: error.message ?? "Credenciales inválidas" };
  }
}

export default function LoginRoute() {
  const { config } = useConfigurables();
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0D1B2A]">
      <div className="w-full max-w-md px-6">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          {config?.logoUrl && config.logoUrl !== "FILL_LOGO_URL_HERE" ? (
            <img src={config.logoUrl} alt={config.appName} className="h-12 mx-auto mb-4" />
          ) : (
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="w-8 h-8 bg-[#1B4F72] rounded flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                  <rect x="1" y="3" width="15" height="13" rx="1" />
                  <path d="M16 8h4l3 3v5h-7V8z" />
                  <circle cx="5.5" cy="18.5" r="2.5" />
                  <circle cx="18.5" cy="18.5" r="2.5" />
                </svg>
              </div>
              <span className="text-white text-xl font-semibold tracking-tight">{config?.appName ?? "EterFleet TMS"}</span>
            </div>
          )}
          <p className="text-[#BDC3C7] text-sm">{config?.loginWelcomeMessage ?? "Bienvenido a EterFleet TMS"}</p>
        </div>

        {/* Login Form */}
        <LoginForm />
      </div>
    </div>
  );
}

function LoginForm() {
  return (
    <form method="post" className="bg-[#1a2d42] rounded-lg p-6 shadow-2xl">
      <h2 className="text-white text-lg font-semibold mb-6">Iniciar Sesión</h2>
      <div className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-[#BDC3C7] text-sm mb-2">
            Email <span className="text-red-400">*</span>
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            placeholder="usuario@empresa.com"
            className="w-full px-3 py-2 bg-[#0D1B2A] border border-[#2a4360] rounded text-white placeholder-[#5D6D7E] text-sm focus:outline-none focus:border-[#1B4F72] focus:ring-1 focus:ring-[#1B4F72]"
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-[#BDC3C7] text-sm mb-2">
            Contraseña <span className="text-red-400">*</span>
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            placeholder="••••••••"
            className="w-full px-3 py-2 bg-[#0D1B2A] border border-[#2a4360] rounded text-white placeholder-[#5D6D7E] text-sm focus:outline-none focus:border-[#1B4F72] focus:ring-1 focus:ring-[#1B4F72]"
          />
        </div>
        <button
          type="submit"
          className="w-full py-2.5 bg-[#1B4F72] hover:bg-[#154060] text-white font-semibold rounded text-sm transition-colors"
        >
          Ingresar
        </button>
      </div>
      <div className="mt-4 text-center">
        <a href="/auth/forgot-password" className="text-[#5D6D7E] text-xs hover:text-[#BDC3C7]">
          ¿Olvidó su contraseña?
        </a>
      </div>
    </form>
  );
}
