import { auth, signIn, signOut } from "@/lib/auth";
import { RepoVisibilitySettings } from "@/components/settings/RepoVisibilitySettings";
import { LogOut, Github, Building2, ExternalLink } from "lucide-react";

export default async function SettingsPage() {
  const session = await auth();

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold mb-2">Settings</h1>
        <p className="text-sm md:text-base text-gray-600">
          Manage your account and repository preferences
        </p>
      </div>

      {/* Account */}
      <section className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
        <div className="px-6 py-4">
          <h2 className="text-base font-semibold text-gray-900">Account</h2>
        </div>
        <div className="px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {session?.user?.image && (
              <img
                src={session.user.image}
                alt={session.user.name ?? "User"}
                className="w-10 h-10 rounded-full"
              />
            )}
            <div>
              <p className="text-sm font-medium text-gray-900">
                {session?.user?.name}
              </p>
              {session?.user?.email && (
                <p className="text-xs text-gray-500">{session.user.email}</p>
              )}
            </div>
          </div>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <button
              type="submit"
              className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </button>
          </form>
        </div>
      </section>

      {/* GitHub Organization Access */}
      <section className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
        <div className="px-6 py-4">
          <h2 className="text-base font-semibold text-gray-900">
            GitHub Organization Access
          </h2>
        </div>
        <div className="px-6 py-4 space-y-3">
          <p className="text-sm text-gray-600">
            Don&apos;t see repositories from an organization? You may need to
            grant Hlavi access. Re-authorizing with GitHub will show the
            organization access screen where you can approve additional orgs.
          </p>
          <div className="flex flex-wrap gap-3">
            <form
              action={async () => {
                "use server";
                await signIn("github", { redirectTo: "/settings" });
              }}
            >
              <button
                type="submit"
                className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                <Github className="w-4 h-4" />
                Re-authorize with GitHub
              </button>
            </form>
            <a
              href="https://github.com/settings/applications"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Building2 className="w-4 h-4" />
              Manage on GitHub
              <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
            </a>
          </div>
        </div>
      </section>

      {/* Repository Visibility */}
      <section className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
        <div className="px-6 py-4">
          <h2 className="text-base font-semibold text-gray-900">
            Repository Visibility
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Choose which repositories appear in the dashboard selector.
          </p>
        </div>
        <div className="px-6 py-4">
          <RepoVisibilitySettings />
        </div>
      </section>
    </div>
  );
}
