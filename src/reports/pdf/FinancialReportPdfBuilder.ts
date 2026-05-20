import PDFDocument from "pdfkit";
import type { FinancialReportDto } from "../../dtos/report/FinancialReport.dto";

const fmt = (value: number): string => String(value);

export function buildFinancialReportPdf(report: FinancialReportDto): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: "A4" });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => {
      chunks.push(chunk);
    });
    doc.on("end", () => {
      resolve(Buffer.concat(chunks));
    });
    doc.on("error", (err: Error) => {
      reject(err);
    });

    doc.fontSize(18).text("Financial Report", { underline: true });
    doc.moveDown();
    doc.fontSize(11).text(`Period: ${report.period.from} — ${report.period.to}`);
    if (report.filters.accountId) {
      doc.text(`Account filter: ${report.filters.accountId}`);
    }
    doc.moveDown();

    for (const block of report.currencies) {
      doc.fontSize(14).text(`Currency: ${block.currencyCode}`, { underline: true });
      doc.fontSize(11);
      doc.text(
        `Income: ${fmt(block.summary.totalIncome)} | Expense: ${fmt(block.summary.totalExpense)} | Net: ${fmt(block.summary.net)}`,
      );
      doc.moveDown(0.5);

      if (block.byCategory.length > 0) {
        doc.text("By category:");
        for (const row of block.byCategory) {
          doc.text(
            `  - ${row.categoryName} (${row.kind}): ${fmt(row.amount)} (${fmt(row.transactionCount)} tx)`,
          );
        }
      }

      if (block.byAccount.length > 0) {
        doc.text("By account:");
        for (const row of block.byAccount) {
          doc.text(
            `  - ${row.accountName}: in ${fmt(row.income)}, out ${fmt(row.expense)}, transfers net ${fmt(row.netTransfer)}`,
          );
        }
      }

      doc.text(`Transfers: ${fmt(block.transfers.count)} (${fmt(block.transfers.totalAmount)})`);
      doc.moveDown();
    }

    if (report.recurring) {
      doc.fontSize(14).text("Recurring rules", { underline: true });
      doc.fontSize(11);
      doc.text(
        `Active rules: ${fmt(report.recurring.activeRulesCount)} | Materialized: ${fmt(report.recurring.materializedAmount)} | Projected: ${fmt(report.recurring.projectedAmount)}`,
      );
      for (const rule of report.recurring.byRule) {
        doc.text(
          `  - ${rule.name} (${rule.frequencyLabel}): ${fmt(rule.materializedCount)}/${fmt(rule.runsInPeriod)} runs, total ${fmt(rule.materializedTotal)}`,
        );
      }
      doc.moveDown();
    }

    doc.end();
  });
}
