import { getDb, appSettings } from "@codeaudit-ai/db";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/sidebar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const db = getDb();
  const setting = db.select().from(appSettings).where(eq(appSettings.key, "setup_complete")).get();
  if (!setting || setting.value !== "true") {
    redirect("/setup");
  }
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 min-w-0">
        {children}
      </main>
    </div>
  );
}
