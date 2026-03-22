import { getDb, appSettings } from "@codeaudit-ai/db";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const db = getDb();
  const setting = db.select().from(appSettings).where(eq(appSettings.key, "setup_complete")).get();
  if (!setting || setting.value !== "true") {
    redirect("/setup");
  }
  return <>{children}</>;
}
