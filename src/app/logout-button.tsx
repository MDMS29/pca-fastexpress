"use client";

import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();

  const onLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/");
    router.refresh();
  };

  return (
    <button
      onClick={onLogout}
      className="flex h-10 items-center gap-2 rounded-xl border border-[#873B52]/15 bg-white px-3.5 text-sm font-semibold text-[#873B52] transition hover:border-[#873B52] hover:bg-[#873B52]/5"
    >
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current stroke-2">
        <path d="M10 17l5-5-5-5M15 12H3M13 4h5a2 2 0 012 2v12a2 2 0 01-2 2h-5" />
      </svg>
      Cerrar sesión
    </button>
  );
}
