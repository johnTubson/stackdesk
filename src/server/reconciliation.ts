import { createServerFn } from "@tanstack/react-start";

import {
  batchIdSchema,
  batchListSearchSchema,
  resolveDiscrepancySchema,
} from "#/lib/validators";

export const listBatches = createServerFn({ method: "GET" })
  .validator(batchListSearchSchema)
  .handler(async ({ data }) => {
    const { listBatchesImpl } = await import("#/server/reconciliation.server");
    return listBatchesImpl(data);
  });

export const getBatch = createServerFn({ method: "GET" })
  .validator(batchIdSchema)
  .handler(async ({ data }) => {
    const { getBatchImpl } = await import("#/server/reconciliation.server");
    return getBatchImpl(data);
  });

export const resolveDiscrepancy = createServerFn({ method: "POST" })
  .validator(resolveDiscrepancySchema)
  .handler(async ({ data }) => {
    const { resolveDiscrepancyImpl } = await import(
      "#/server/reconciliation.server"
    );
    return resolveDiscrepancyImpl(data);
  });
