import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Clock3, Library, ListChecks, NotebookPen, Sparkles, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

type Feature = {
  title: string;
  description: string;
  icon: LucideIcon;
};

const features: Feature[] = [
  {
    title: "見たいものを一箇所に",
    description: "映画、アニメ、漫画、ゲーム、書籍など、後で触れたい作品をまとめて管理できます。",
    icon: Library
  },
  {
    title: "優先度がすぐ分かる",
    description: "ステータスと並び替えで、次に見るもの、進めるもの、保留するものを選びやすくします。",
    icon: ListChecks
  },
  {
    title: "気持ちごと残せる",
    description: "気になった理由、メモ、レビューを保存して、あとから選ぶときの判断材料にできます。",
    icon: NotebookPen
  }
];

const savedItems = ["作品タイトル", "種別・シリーズ", "進行ステータス", "評価・レビュー", "気になった理由", "タグ・期限メモ"];

const benefits: Feature[] = [
  {
    title: "迷う時間を減らす",
    description: "候補が散らばらず、今の優先度から次の作品を選べます。",
    icon: Clock3
  },
  {
    title: "記憶を補助する",
    description: "なぜ気になったのか、どこまで進めたのかを後から確認できます。",
    icon: Sparkles
  },
  {
    title: "履歴を振り返れる",
    description: "完了ログとレビューが残るので、楽しんだ作品の履歴が自然に育ちます。",
    icon: CheckCircle2
  }
];

const sampleItems = [
  { type: "映画", title: "週末に見たい作品", status: "planned" },
  { type: "漫画", title: "途中まで読んだシリーズ", status: "in progress" },
  { type: "ゲーム", title: "セールで気になったタイトル", status: "memo" }
];

export default function LandingPage() {
  return (
    <div className="relative left-1/2 -mt-6 w-screen -translate-x-1/2 overflow-hidden">
      <section className="relative border-b border-border/70">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,hsl(191_72%_62%/0.18),transparent_36%),linear-gradient(45deg,hsl(164_55%_46%/0.12),transparent_42%),linear-gradient(180deg,hsl(222_16%_12%/0.96),hsl(222_20%_6%/0))]" />
        <div className="relative mx-auto grid max-w-6xl gap-10 px-4 pb-12 pt-12 sm:pb-14 sm:pt-14 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div className="max-w-2xl space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/75 bg-card/75 px-3 py-1 text-xs font-semibold text-muted-foreground">
              <Image src="/icon.svg" alt="" width={22} height={22} className="h-5 w-5" />
              積み作品と興味を整理する
            </div>
            <div className="space-y-4">
              <h1 className="text-4xl font-extrabold leading-tight tracking-normal text-foreground sm:text-5xl lg:text-6xl">Flowlog</h1>
              <p className="max-w-xl text-lg leading-8 text-muted-foreground">
                見たい・読みたい・遊びたい作品をまとめて、次に何を楽しむかを決めやすくする個人用ログ管理サービスです。
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/login">
                  使い始める
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="#features">特徴を見る</Link>
              </Button>
            </div>
          </div>

          <div className="rounded-xl border border-border/80 bg-card/88 p-4 shadow-[0_28px_70px_-44px_hsl(191_72%_62%/0.8)] ring-1 ring-white/5">
            <div className="mb-4 flex items-center justify-between border-b border-border/70 pb-3">
              <div>
                <p className="text-xs font-semibold uppercase text-muted-foreground">Today&apos;s flow</p>
                <p className="text-lg font-bold">次に楽しむ候補</p>
              </div>
              <div className="rounded-lg bg-primary/95 px-3 py-1 text-sm font-bold text-primary-foreground">3件</div>
            </div>
            <div className="space-y-3">
              {sampleItems.map((item) => (
                <div key={item.title} className="grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-xl border border-border/70 bg-background/42 p-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-sm font-bold">{item.type}</div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{item.title}</p>
                    <p className="truncate text-xs text-muted-foreground">理由、期限、レビューを一緒に保存</p>
                  </div>
                  <span className="rounded-full border border-border/70 px-2 py-1 text-xs text-muted-foreground">{item.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="mx-auto grid max-w-6xl gap-4 px-4 py-10 md:grid-cols-3">
        {features.map(({ title, description, icon: Icon }) => (
          <article key={title} className="rounded-xl border border-border/80 bg-card/82 p-5">
            <Icon className="mb-4 h-6 w-6 text-primary" />
            <h2 className="text-lg font-bold">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
          </article>
        ))}
      </section>

      <section className="mx-auto grid max-w-6xl gap-8 px-4 py-10 lg:grid-cols-2 lg:items-start">
        <div className="space-y-4">
          <p className="text-sm font-bold text-primary">利用イメージ</p>
          <h2 className="text-3xl font-extrabold tracking-normal">作品を追加して、状況を更新して、選びやすくする。</h2>
          <p className="text-base leading-7 text-muted-foreground">
            気になった作品を登録し、視聴中・保留・完了などの状態に分けて管理します。評価やレビュー、気になった理由も残せるので、未来の自分が選びやすいログになります。
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {savedItems.map((item) => (
            <div key={item} className="flex items-center gap-3 rounded-xl border border-border/75 bg-muted/45 p-4 text-sm font-semibold">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
              {item}
            </div>
          ))}
        </div>
      </section>

      <section id="benefits" className="mx-auto grid max-w-6xl gap-4 px-4 pb-14 pt-4 md:grid-cols-3">
        {benefits.map(({ title, description, icon: Icon }) => (
          <article key={title} className="rounded-xl border border-border/80 bg-card/82 p-5">
            <Icon className="mb-4 h-6 w-6 text-primary" />
            <h2 className="text-lg font-bold">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
