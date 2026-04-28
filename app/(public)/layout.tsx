import { TopNav } from "@/components/top-nav";
import { getProfile } from "@/lib/auth/dal";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getProfile();
  return (
    <>
      <TopNav profile={profile} />
      <main className="flex-1">{children}</main>
    </>
  );
}
