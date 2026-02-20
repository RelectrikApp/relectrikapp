import Link from "next/link";
import { RightElectrikLogo } from "@/components/ui/RightElectrikLogo";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center p-4">
      <div className="text-center space-y-6">
        <div className="flex justify-center mb-4">
          <RightElectrikLogo width={200} height={84} />
        </div>
        <h1 className="text-3xl font-bold text-white">Relectrikapp</h1>
        <p className="text-slate-300">Your AI Business Assistant</p>
        <div className="flex flex-wrap gap-4 justify-center">
          <Link
            href="/tech/login"
            className="px-6 py-3 rounded-lg bg-relectrik-orange text-black font-medium hover:opacity-90"
          >
            Log in
          </Link>
          <Link
            href="/tech/register"
            className="px-6 py-3 rounded-lg border border-slate-500 text-slate-300 hover:bg-slate-800"
          >
            Create account
          </Link>
        </div>
      </div>
    </main>
  );
}
