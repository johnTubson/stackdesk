import { createServerFn } from "@tanstack/react-start";

import { auditListSearchSchema } from "#/lib/validators";

export const listAuditLogs = createServerFn({ method: "GET" })
  .validator(auditListSearchSchema)
  .handler(async ({ data }) => {
    const { listAuditLogsImpl } = await import("#/server/audit.server");
    return listAuditLogsImpl(data);
  });
