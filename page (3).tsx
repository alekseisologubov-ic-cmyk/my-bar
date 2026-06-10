import { loginAction } from "@/app/actions/auth";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <section className="card w-full max-w-md p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-black">VenueOps</h1>
          <p className="mt-2 text-slate-500">Sign in to your bar POS dashboard.</p>
        </div>

        {params.error ? (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">
            Login failed. Check email and password.
          </div>
        ) : null}

        <form action={loginAction} className="space-y-4">
          <div>
            <label className="label" htmlFor="email">
              Email
            </label>
            <input
              className="field"
              id="email"
              name="email"
              type="email"
              defaultValue="owner@demo.com"
              autoComplete="email"
              required
            />
          </div>

          <div>
            <label className="label" htmlFor="password">
              Password
            </label>
            <input
              className="field"
              id="password"
              name="password"
              type="password"
              defaultValue="owner123"
              autoComplete="current-password"
              required
            />
          </div>

          <button className="btn w-full" type="submit">
            Sign in
          </button>
        </form>

        <p className="mt-6 rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
          Demo login after seeding: <strong>owner@demo.com</strong> / <strong>owner123</strong>
        </p>
      </section>
    </main>
  );
}
