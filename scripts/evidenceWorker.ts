import { Worker } from "bullmq";
import { generateEvidencePackForIncident } from "@/lib/evidencePack";

const connection = {
  host: process.env.REDIS_HOST ?? "127.0.0.1",
  port: Number(process.env.REDIS_PORT ?? 6379)
};

new Worker(
  "evidence-packs",
  async (job) => {
    const { incidentId, userId, ip } = job.data as {
      incidentId: string;
      userId: string;
      ip?: string;
    };
    await generateEvidencePackForIncident({ incidentId, userId, ip });
  },
  { connection }
);

console.log("Evidence pack worker running...");
