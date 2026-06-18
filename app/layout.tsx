import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Manrope } from "next/font/google";
import "./globals.css";
import { logout } from "@/app/actions";
import { MobileNav } from "@/components/mobile-nav";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"]
});

export const metadata: Metadata = {
  title: "Flowlog",
  description: "Personal watch/play/read backlog manager"
};

async function NavBar() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;

  return (
    <header className="sticky top-0 z-40 border-b border-border/75 bg-card/88 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href={user ? "/home" : "/"} className="inline-flex items-center gap-3">
          <Image src="/icon.svg" alt="Flowlog icon" width={46} height={46} className="h-[46px] w-[46px]" priority />
          <span className="text-base font-extrabold tracking-normal text-foreground/95">Flowlog</span>
        </Link>
        {user ? (
          <>
            <nav className="hidden items-center gap-1.5 rounded-full border border-border/70 bg-background/45 px-2 py-1 shadow-[0_10px_24px_-20px_hsl(220_30%_1%_/_0.9)] md:flex">
              <Button asChild variant="ghost" size="sm">
                <Link href="/home">ホーム</Link>
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link href="/add">追加</Link>
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link href="/library">ライブラリ</Link>
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link href="/manage">管理</Link>
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link href="/inspiration">インスピレーション</Link>
              </Button>
              <form action={logout}>
                <Button size="sm" variant="secondary" type="submit">
                  ログアウト
                </Button>
              </form>
            </nav>

            <MobileNav />
          </>
        ) : (
          <Button asChild size="sm" variant="secondary">
            <Link href="/login">ログイン</Link>
          </Button>
        )}
      </div>
    </header>
  );
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja" className="dark">
      <body className={manrope.className}>
        <NavBar />
        <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
