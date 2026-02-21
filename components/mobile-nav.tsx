"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { logout } from "@/app/actions";
import { Button } from "@/components/ui/button";

export function MobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <div className="relative md:hidden">
      <button
        type="button"
        aria-label={open ? "メニューを閉じる" : "メニューを開く"}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-border/80 bg-muted/60 text-foreground"
        onClick={() => setOpen((prev) => !prev)}
      >
        {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
      </button>

      {open ? (
        <div className="absolute right-0 z-50 mt-2 w-44 rounded-xl border border-border/80 bg-card p-2 shadow-[0_18px_30px_-18px_hsl(220_30%_1%_/_0.95)]">
          <div className="flex flex-col gap-1">
            <Button asChild variant="ghost" size="sm" className="justify-start">
              <Link href="/" onClick={() => setOpen(false)}>
                ホーム
              </Link>
            </Button>
            <Button asChild variant="ghost" size="sm" className="justify-start">
              <Link href="/add" onClick={() => setOpen(false)}>
                追加
              </Link>
            </Button>
            <Button asChild variant="ghost" size="sm" className="justify-start">
              <Link href="/library" onClick={() => setOpen(false)}>
                ライブラリ
              </Link>
            </Button>
            <Button asChild variant="ghost" size="sm" className="justify-start">
              <Link href="/manage" onClick={() => setOpen(false)}>
                管理
              </Link>
            </Button>
            <form action={logout} className="pt-1" onSubmit={() => setOpen(false)}>
              <Button size="sm" variant="secondary" type="submit" className="w-full justify-start">
                ログアウト
              </Button>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
