import { signIn, auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Github } from "lucide-react";

export default async function LoginPage() {
  const session = await auth();

  // If already logged in, redirect to dashboard
  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4">
            <span className="text-white font-bold text-3xl">H</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome to Hlavi
          </h1>
          <p className="text-gray-600">
            Visualize and manage your project tasks
          </p>
        </div>

        <form
          action={async () => {
            "use server";
            await signIn("github", { redirectTo: "/dashboard" });
          }}
        >
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-3 bg-gray-900 text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors font-medium"
          >
            <Github className="w-5 h-5" />
            Sign in with GitHub
          </button>
        </form>

        <p className="text-xs text-gray-500 text-center mt-6">
          By signing in, you agree to access your GitHub repositories to view
          hlavi tasks
        </p>
      </div>
    </div>
  );
}
