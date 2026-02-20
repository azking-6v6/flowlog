"use client";

import { useEffect } from "react";

export default function GlobalError({
  error
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="ja">
      <body className="bg-neutral-950 px-4 py-16 text-neutral-100">
        <div className="mx-auto max-w-lg space-y-4">
          <h2 className="text-xl font-bold">致命的なエラーが発生しました</h2>
          <p className="text-sm text-neutral-400">ページを再読み込みしてください。問題が続く場合は管理者に連絡してください。</p>
          {error.digest ? <p className="text-xs text-neutral-500">Digest: {error.digest}</p> : null}
        </div>
      </body>
    </html>
  );
}
