import { API_V1_PREFIX } from "../constants";
import {
  appendCsrfParameters,
  errorResponses,
  mutationErrorResponses,
  protectedMutationSecurity,
  protectedSecurity,
} from "../helpers";
import { openApiRegistry } from "../registry";
import {
  FinancialReportEnvelopeSchema,
  ReportQuerySchemaRef,
  CreateReportJobBodySchema,
  ReportJobResponseEnvelopeSchema,
  IdParamsSchema,
} from "../schemas/components";

const tag = "Reports";
const basePath = `${API_V1_PREFIX}/reports`;

openApiRegistry.registerPath({
  method: "get",
  path: basePath,
  tags: [tag],
  summary: "Financial report for a period",
  description:
    "Returns aggregated income, expense, category and account breakdowns, transfers summary, and budget progress grouped by currency. Optional accountId scopes the report to one account.",
  security: protectedSecurity,
  request: {
    query: ReportQuerySchemaRef,
  },
  responses: {
    200: {
      description: "Financial report",
      content: { "application/json": { schema: FinancialReportEnvelopeSchema } },
    },
    ...errorResponses,
  },
});

openApiRegistry.registerPath({
  method: "post",
  path: `${basePath}/jobs`,
  tags: [tag],
  summary: "Enqueue financial report job",
  description:
    "Queues report generation (JSON or PDF). Poll GET /reports/jobs/{id} until status is COMPLETED.",
  security: protectedMutationSecurity,
  parameters: appendCsrfParameters(),
  request: {
    body: { content: { "application/json": { schema: CreateReportJobBodySchema } } },
  },
  responses: {
    202: {
      description: "Job accepted",
      content: { "application/json": { schema: ReportJobResponseEnvelopeSchema } },
    },
    ...mutationErrorResponses,
  },
});

openApiRegistry.registerPath({
  method: "get",
  path: `${basePath}/jobs/{id}`,
  tags: [tag],
  summary: "Get report job status and result",
  security: protectedSecurity,
  request: { params: IdParamsSchema },
  responses: {
    200: {
      description: "Job status (includes data or downloadUrl when completed)",
      content: { "application/json": { schema: ReportJobResponseEnvelopeSchema } },
    },
    ...errorResponses,
  },
});

openApiRegistry.registerPath({
  method: "get",
  path: `${basePath}/jobs/{id}/download`,
  tags: [tag],
  summary: "Download report PDF",
  description:
    "Returns the PDF file when the job status is COMPLETED and format is PDF. " +
    "For seed data use id `clseed0000000000000000197` (not PENDING jobs like `...0191`). " +
    "New jobs: poll GET /jobs/{id} until COMPLETED and ensure the report worker is running.",
  security: protectedSecurity,
  request: { params: IdParamsSchema },
  responses: {
    200: {
      description: "PDF file",
      content: {
        "application/pdf": {
          schema: { type: "string", format: "binary" },
        },
      },
    },
    ...errorResponses,
  },
});
