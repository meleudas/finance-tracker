import {
  toReportJobResponse,
  parseReportJobResultJson,
} from "../../../src/mappers/report-job.mapper";

const baseJob = {
  id: "clk7v9x1k0000qzq8x8x8x8xb",
  userId: "clg7v9x1k0000qzq8x8x8x8x8",
  status: "COMPLETED" as const,
  format: "JSON" as const,
  from: new Date("2026-01-01T00:00:00.000Z"),
  to: new Date("2026-01-31T23:59:59.999Z"),
  accountId: null,
  includeRecurring: true,
  errorMessage: null,
  createdAt: new Date("2026-01-02T00:00:00.000Z"),
  completedAt: new Date("2026-01-02T01:00:00.000Z"),
  resultJson: null,
};

describe("report-job.mapper", () => {
  describe("toReportJobResponse", () => {
    it("мапить job у DTO", () => {
      const dto = toReportJobResponse(baseJob as never);

      expect(dto.id).toBe(baseJob.id);
      expect(dto.from).toBe(baseJob.from.toISOString());
      expect(dto.completedAt).toBe(baseJob.completedAt?.toISOString());
    });

    it("додає downloadUrl, якщо передано", () => {
      const dto = toReportJobResponse(baseJob as never, {
        downloadUrl: "https://example.com/file.pdf",
      });

      expect(dto.downloadUrl).toBe("https://example.com/file.pdf");
    });
  });

  describe("parseReportJobResultJson", () => {
    it("повертає undefined для не-JSON формату", () => {
      expect(parseReportJobResultJson({ ...baseJob, format: "PDF" } as never)).toBeUndefined();
    });

    it("повертає undefined, якщо resultJson null", () => {
      expect(parseReportJobResultJson(baseJob as never)).toBeUndefined();
    });

    it("повертає дані для валідного JSON", () => {
      const resultJson = {
        period: { from: "2026-01-01T00:00:00.000Z", to: "2026-01-31T23:59:59.999Z" },
        filters: {},
        currencies: [],
      };

      expect(parseReportJobResultJson({ ...baseJob, resultJson } as never)).toEqual(resultJson);
    });

    it("повертає undefined для невалідного resultJson", () => {
      expect(
        parseReportJobResultJson({ ...baseJob, resultJson: { invalid: true } } as never),
      ).toBeUndefined();
    });
  });
});
