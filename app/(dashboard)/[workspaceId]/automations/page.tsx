import { redirect } from "next/navigation";

interface AutomationsRedirectPageProps {
  params: Promise<{
    workspaceId: string;
  }>;
}

export default async function AutomationsRedirectPage({
  params,
}: AutomationsRedirectPageProps) {
  const { workspaceId } = await params;
  redirect(`/${workspaceId}/automation`);
}
