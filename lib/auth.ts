import { auth } from "@/auth";
import type { SessionUser } from "@/types";

export async function getAuthSession(): Promise<{ user: SessionUser } | null> {
  const session = await auth();
  if (!session?.user?.id || !session?.user?.email) {
    return null;
  }

  return {
    user: {
      id: session.user.id,
      name: session.user.name ?? null,
      email: session.user.email,
      image: session.user.image ?? null,
    },
  };
}
