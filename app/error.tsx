"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-lg space-y-4 py-16">
      <h2 className="text-xl font-bold">エラーが発生しました</h2>
      <p className="text-sm text-muted-foreground">読み込み中に問題が発生しました。再試行してください。</p>
      {error.digest ? <p className="text-xs text-muted-foreground">Digest: {error.digest}</p> : null}
      <Button onClick={reset}>再試行</Button>
    </div>
  );
}
