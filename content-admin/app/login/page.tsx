import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/login-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { hasAdminSession, isAdminAuthConfigured } from "@/lib/admin-auth";
import { getHomeHeroImageAdminUrl } from "@/lib/site-hero";
import { vivaciLogoDarkAdminUrl } from "@/lib/site-image-url";

export default async function LoginPage() {
  if (await hasAdminSession()) redirect("/treatment-pages");

  const heroImageSrc = getHomeHeroImageAdminUrl();

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <Link
            href="/treatment-pages"
            className="flex items-center gap-2 font-medium text-foreground"
            aria-label="Vivaci innehållsadmin"
          >
            <Image
              src={vivaciLogoDarkAdminUrl()}
              alt=""
              width={384}
              height={145}
              className="h-7 w-auto"
              priority
            />
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <Card>
              <CardHeader>
                <CardTitle>Logga in</CardTitle>
                <CardDescription>
                  Ange adminkontots lösenord för att hantera Vivacis innehåll.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <LoginForm configured={isAdminAuthConfigured()} />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <div className="relative hidden bg-muted lg:block">
        <Image
          src={heroImageSrc}
          alt=""
          fill
          sizes="50vw"
          className="object-cover dark:brightness-[0.2] dark:grayscale"
          priority
        />
      </div>
    </div>
  );
}
