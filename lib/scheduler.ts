import { discoveryTick } from "./discovery";

const globalForScheduler = globalThis as unknown as { __tcScheduler?: boolean };

export function startScheduler() {
  if (globalForScheduler.__tcScheduler) return;
  globalForScheduler.__tcScheduler = true;
  setInterval(() => {
    void discoveryTick().catch((error) => console.error("Discovery scheduler", error));
  }, 60_000);
}
