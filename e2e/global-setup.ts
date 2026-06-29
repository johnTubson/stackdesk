import { execSync } from "node:child_process";

export default function globalSetup() {
  execSync("rm -f e2e.db e2e.db-wal e2e.db-shm", { stdio: "inherit" });
  execSync("pnpm db:migrate", {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: "file:./e2e.db" },
  });
  execSync("pnpm db:seed", {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: "file:./e2e.db" },
  });
}
