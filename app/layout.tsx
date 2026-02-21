import type { Metadata } from "next";
import Link from "next/link";
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
  description: "これから見る・やる作品の個人管理アプリ"
};

async function NavBar() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;

  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-card/92 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-lg font-extrabold tracking-tight text-foreground/95">
          Flowlog
        </Link>
        {user ? (
          <>
            <nav className="hidden items-center gap-2 rounded-full border border-border/70 bg-background/55 px-2 py-1 md:flex">
              <Button asChild variant="ghost" size="sm">
                <Link href="/">ホーム</Link>
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
              <form action={logout}>
                <Button size="sm" variant="secondary" type="submit">
                  ログアウト
                </Button>
              </form>
            </nav>

            <MobileNav />
          </>
        ) : null}
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
