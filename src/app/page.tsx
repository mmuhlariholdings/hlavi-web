import { GitHubLogo } from "@/components/landing/GitHubLogo";
import { ArrowRight, GitBranch, Shield, Zap, Calendar, Kanban, BarChart3 } from "lucide-react";
import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-50">
      {/* Navigation */}
      <nav className="border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">H</span>
              </div>
              <span className="text-xl font-bold text-gray-900">Hlavi</span>
            </div>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium"
            >
              <GitHubLogo className="w-4 h-4" />
              Sign in with GitHub
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-20 pb-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-8">
            <GitBranch className="w-4 h-4" />
            Git-based task management
          </div>

          <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight">
            Your tasks, in <span className="text-blue-600">your repo</span>
          </h1>

          <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
            A beautiful task manager that lives in your GitHub repository.
            <br className="hidden md:block" />
            No databases. No vendor lock-in. Just pure git.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-lg font-semibold shadow-lg hover:shadow-xl"
            >
              <GitHubLogo className="w-5 h-5" />
              Get Started Free
              <ArrowRight className="w-5 h-5" />
            </Link>
            <a
              href="#features"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-lg font-semibold border border-gray-300"
            >
              Learn More
            </a>
          </div>

          <p className="text-sm text-gray-500 mt-8">
            No credit card required • Free forever • Open source friendly
          </p>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Why Hlavi?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Task management that respects your workflow and keeps you in control
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="p-8 rounded-2xl border border-gray-200 hover:border-blue-300 transition-colors bg-gradient-to-br from-white to-gray-50">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Your Data, Your Control
              </h3>
              <p className="text-gray-600">
                Tasks stored as JSON in <code className="text-sm bg-gray-100 px-1 py-0.5 rounded">.hlavi/</code> directory.
                No databases, no external storage. It's all in your repo.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-8 rounded-2xl border border-gray-200 hover:border-blue-300 transition-colors bg-gradient-to-br from-white to-gray-50">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <GitBranch className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Git-Native Workflow
              </h3>
              <p className="text-gray-600">
                Every change creates a git commit. Full audit trail, branch workflows, and PR reviews for task management.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-8 rounded-2xl border border-gray-200 hover:border-blue-300 transition-colors bg-gradient-to-br from-white to-gray-50">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Beautiful Visualizations
              </h3>
              <p className="text-gray-600">
                Interactive timeline, kanban board, and agenda views. Powerful task management without the complexity.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Views Showcase */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Multiple perspectives, one source of truth
            </h2>
            <p className="text-xl text-gray-600">
              View and manage your tasks the way you want
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Timeline View */}
            <div className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white p-6 hover:border-blue-300 transition-all hover:shadow-xl">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                <BarChart3 className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Timeline View</h3>
              <p className="text-gray-600">
                Gantt chart visualization with drag-and-drop. See your project timeline at a glance.
              </p>
            </div>

            {/* Kanban Board */}
            <div className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white p-6 hover:border-blue-300 transition-all hover:shadow-xl">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Kanban className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Kanban Board</h3>
              <p className="text-gray-600">
                Organize tasks by status. Track progress through customizable workflow stages.
              </p>
            </div>

            {/* Agenda View */}
            <div className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white p-6 hover:border-blue-300 transition-all hover:shadow-xl">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <Calendar className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Agenda View</h3>
              <p className="text-gray-600">
                Daily, weekly, and monthly views. See what's due today and plan ahead.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              How it works
            </h2>
            <p className="text-xl text-gray-400">
              Get started in seconds
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="text-xl font-bold mb-2">Connect GitHub</h3>
              <p className="text-gray-400">
                Sign in with your GitHub account. We use OAuth for secure access.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="text-xl font-bold mb-2">Select Repository</h3>
              <p className="text-gray-400">
                Choose a repo with a <code className="text-sm bg-gray-800 px-1 py-0.5 rounded">.hlavi/</code> directory, or let us create one.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="text-xl font-bold mb-2">Start Managing</h3>
              <p className="text-gray-400">
                Create, edit, and organize tasks. Every change syncs directly to your repository.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Ready to take control of your tasks?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Join developers who trust git for their code and their tasks
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-lg font-semibold shadow-lg hover:shadow-xl"
          >
            <GitHubLogo className="w-5 h-5" />
            Get Started Free
            <ArrowRight className="w-5 h-5" />
          </Link>
          <p className="text-sm text-gray-500 mt-6">
            No credit card • No setup fees • Cancel anytime (not that you can, it's free!)
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-12 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">H</span>
              </div>
              <span className="text-xl font-bold text-gray-900">Hlavi</span>
            </div>
            <p className="text-gray-600 text-sm">
              Built with ❤️ for developers who value simplicity and control
            </p>
            <div className="flex items-center gap-6">
              <a href="https://github.com" className="text-gray-600 hover:text-gray-900 transition-colors">
                <GitHubLogo className="w-5 h-5" />
              </a>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-200 text-center text-sm text-gray-500">
            <p>© 2026 Hlavi. Your data stays in your repository, always.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
