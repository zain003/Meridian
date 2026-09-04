import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";

interface BoardsRedirectPageProps {
  params: Promise<{
    workspaceId: string;
  }>;
}

export default async function BoardsRedirectPage({
  params,
}: BoardsRedirectPageProps) {
  const { workspaceId } = await params;
  const session = await getAuthSession();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const firstProject = await prisma.project.findFirst({
    where: { workspaceId },
    select: { id: true },
    orderBy: { createdAt: "asc" },
  });

  if (firstProject) {
    redirect(`/${workspaceId}/projects/${firstProject.id}`);
  } else {
    redirect(`/${workspaceId}`);
  }
}
