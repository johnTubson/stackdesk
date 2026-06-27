import { createServerFn } from "@tanstack/react-start";

import { onboardingStepSchema, submitOnboardingSchema } from "#/lib/validators";

export const saveOnboardingStep = createServerFn({ method: "POST" })
  .validator(onboardingStepSchema)
  .handler(async ({ data }) => {
    const { saveOnboardingStepImpl } = await import(
      "#/server/onboarding.server"
    );
    return saveOnboardingStepImpl(data);
  });

export const submitOnboarding = createServerFn({ method: "POST" })
  .validator(submitOnboardingSchema)
  .handler(async ({ data }) => {
    const { submitOnboardingImpl } = await import("#/server/onboarding.server");
    return submitOnboardingImpl(data);
  });

export const getOnboardingDraft = createServerFn({ method: "GET" })
  .validator(submitOnboardingSchema)
  .handler(async ({ data }) => {
    const { getOnboardingDraftImpl } = await import(
      "#/server/onboarding.server"
    );
    return getOnboardingDraftImpl(data);
  });
