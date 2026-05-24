/**
 * Uploads minimal PDF objects for seed COMPLETED PDF report jobs (MinIO/S3).
 * Keys must match buildReportStorageKey: reports/{userId}/{jobId}.pdf
 */
import * as Minio from "minio";

const DEMO_USER_ID = "clseed0000000000000000000";
const COMPLETED_PDF_JOB_INDICES = [9, 11, 13, 15, 17];

/** Smallest valid PDF for Swagger / download smoke tests */
const MINIMAL_PDF = Buffer.from(
  "%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n" +
    "2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n" +
    "3 0 obj<</Type/Page/MediaBox[0 0 3 3]/Parent 2 0 R>>endobj\n" +
    "xref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000052 00000 n \n0000000101 00000 n \n" +
    "trailer<</Size 4/Root 1 0 R>>\nstartxref\n149\n%%EOF\n",
  "utf8",
);

function jobIdForIndex(i) {
  return `clseed${String(188 + i).padStart(19, "0")}`;
}

function storageKey(userId, jobId) {
  return `reports/${userId}/${jobId}.pdf`;
}

function parseEndpoint(endpoint) {
  const url = new URL(endpoint);
  const useSSL = url.protocol === "https:";
  const port = url.port ? Number.parseInt(url.port, 10) : useSSL ? 443 : 9000;
  return { endPoint: url.hostname, port, useSSL };
}

async function main() {
  const endpoint = process.env.S3_ENDPOINT;
  const bucket = process.env.S3_BUCKET ?? "finance-tracker";
  const accessKey = process.env.S3_ACCESS_KEY_ID ?? "minioadmin";
  const secretKey = process.env.S3_SECRET_ACCESS_KEY ?? "minioadmin";
  const region = process.env.S3_REGION ?? "us-east-1";

  if (!endpoint) {
    console.log("S3_ENDPOINT not set — skipping report PDF upload.");
    return;
  }

  const { endPoint, port, useSSL } = parseEndpoint(endpoint);
  const client = new Minio.Client({
    endPoint,
    port,
    useSSL,
    accessKey,
    secretKey,
    region,
  });

  const exists = await client.bucketExists(bucket);
  if (!exists) {
    await client.makeBucket(bucket, region);
  }

  for (const i of COMPLETED_PDF_JOB_INDICES) {
    const jobId = jobIdForIndex(i);
    const key = storageKey(DEMO_USER_ID, jobId);
    await client.putObject(bucket, key, MINIMAL_PDF, MINIMAL_PDF.length, {
      "Content-Type": "application/pdf",
    });
    console.log(`  uploaded ${key}`);
  }

  console.log(`Uploaded ${COMPLETED_PDF_JOB_INDICES.length} seed report PDF(s) to ${bucket}.`);
}

main().catch((err) => {
  console.error("Failed to upload seed report PDFs:", err);
  process.exit(1);
});
