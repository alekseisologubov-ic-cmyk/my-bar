import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session";

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!token) return null;

  const session = await verifySessionToken(token);
  if (!session) return null;

  const user = await prisma.user.findFirst({
    where: {
      id: session.userId,
      venueId: session.venueId,
      isActive: true,
    },
    include: { venue: true },
  });

  return user;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireManager() {
  const user = await requireUser();
  if (!["ADMIN", "MANAGER"].includes(user.role)) redirect("/");
  return user;
}

export function canManage(role: string) {
  return role === "ADMIN" || role === "MANAGER";
}
