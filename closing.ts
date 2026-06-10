"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { requireManager } from "@/lib/auth";
import { decimalString } from "@/lib/money";

export async function createCategoryAction(formData: FormData) {
  const user = await requireManager();
  const name = String(formData.get("name") ?? "").trim();

  if (!name) redirect("/menu?error=category-name");

  const category = await prisma.menuCategory.create({
    data: {
      venueId: user.venueId,
      name,
      sortOrder: Number(formData.get("sortOrder") ?? 0),
    },
  });

  await prisma.auditLog.create({
    data: {
      venueId: user.venueId,
      userId: user.id,
      action: "CREATE_MENU_CATEGORY",
      entityType: "MenuCategory",
      entityId: category.id,
      newValue: { name },
    },
  });

  revalidatePath("/menu");
  redirect("/menu");
}

export async function createMenuItemAction(formData: FormData) {
  const user = await requireManager();

  const categoryId = String(formData.get("categoryId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const price = decimalString(formData.get("price"));
  const taxRate = decimalString(formData.get("taxRate"), "20.00");

  if (!categoryId || !name) redirect("/menu?error=item-fields");

  const category = await prisma.menuCategory.findFirst({
    where: { id: categoryId, venueId: user.venueId },
  });

  if (!category) redirect("/menu?error=category-not-found");

  const item = await prisma.menuItem.create({
    data: {
      venueId: user.venueId,
      categoryId,
      name,
      description: description || null,
      price,
      taxRate,
    },
  });

  await prisma.auditLog.create({
    data: {
      venueId: user.venueId,
      userId: user.id,
      action: "CREATE_MENU_ITEM",
      entityType: "MenuItem",
      entityId: item.id,
      newValue: { name, price, taxRate },
    },
  });

  revalidatePath("/menu");
  revalidatePath("/pos");
  redirect("/menu");
}
