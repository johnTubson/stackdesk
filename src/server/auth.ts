import { redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";

import { loginInputSchema } from "#/lib/validators";

export const fetchSession = createServerFn({ method: "GET" }).handler(
  async () => {
    const { readAppSession } = await import("#/server/session.server");
    return readAppSession();
  }
);

export const login = createServerFn({ method: "POST" })
  .validator(loginInputSchema)
  .handler(async ({ data }) => {
    const { loginUser } = await import("#/server/auth.server");
    await loginUser(data);
    throw redirect({ to: "/dashboard" });
  });

export const logout = createServerFn({ method: "POST" }).handler(async () => {
  const { logoutUser } = await import("#/server/auth.server");
  await logoutUser();
  return { success: true as const };
});
