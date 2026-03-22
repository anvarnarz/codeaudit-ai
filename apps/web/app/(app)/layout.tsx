import { Sidebar } from "@/components/nav/sidebar";
import { getDb, appSettings } from "@codeaudit-ai/db";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const db = getDb();
  const setting = db.select().from(appSettings).where(eq(appSettings.key, "setup_complete")).get();
  if (!setting || setting.value !== "true") {
    redirect("/setup");
  }
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
