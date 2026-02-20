import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GoogleLoginButton } from "@/components/auth/google-login-button";
import { createClient } from "@/lib/supabase/server";

export default async function LoginPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (data.user) redirect("/");

  return (
    <div className="mx-auto mt-20 max-w-md">
      <Card>
        <CardHeader>
          <CardTitle>Flowlog にログイン</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">Googleログインで PC とスマホの同期を有効化できます。</p>
          <GoogleLoginButton />
        </CardContent>
      </Card>
    </div>
  );
}
