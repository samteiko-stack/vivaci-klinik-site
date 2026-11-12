"use server";

import { redirect } from "next/navigation";
import {
  createAdminSession,
  deleteAdminSession,
  isAdminAuthConfigured,
  validateAdminPassword,
} from "@/lib/admin-auth";

export type LoginState = { error?: string };

export async function loginAction(
  _state: LoginState,
  formData: FormData
): Promise<LoginState> {
  if (!isAdminAuthConfigured()) {
    return { error: "Inloggningen är inte konfigurerad ännu." };
  }

  const password = String(formData.get("password") ?? "");
  if (!password) {
    return { error: "Ange lösenord." };
  }
  if (!validateAdminPassword(password)) {
    return { error: "Fel lösenord." };
  }

  await createAdminSession();
  redirect("/admin/treatment-pages");
}

export async function logoutAction() {
  await deleteAdminSession();
  redirect("/login");
}
