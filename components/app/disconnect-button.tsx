"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "@/lib/auth-client";

export function DisconnectButton(): React.ReactElement {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleDisconnect(): void {
    startTransition(async () => {
      await signOut();
      router.push("/");
    });
  }

  return (
    <button
      type="button"
      onClick={handleDisconnect}
      disabled={pending}
      className="inline-flex h-8 items-center rounded-[8px] border border-transparent bg-transparent px-[11px] text-[13px] font-medium text-[#8a8a8a] hover:bg-black/5 hover:text-[#262626] disabled:opacity-70 disabled:cursor-default"
    >
      Disconnect
    </button>
  );
}
