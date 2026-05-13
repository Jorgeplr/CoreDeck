import { initCronJobs } from "./lib/cronJobs";

initCronJobs();

console.log("[CoreDesk] Cron worker started");

process.on("SIGINT", () => {
  console.log("[CoreDesk] Cron worker shutting down");
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("[CoreDesk] Cron worker shutting down");
  process.exit(0);
});
