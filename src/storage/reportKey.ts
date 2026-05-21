/** Object key for report PDFs: reports/{userId}/{jobId}.pdf */
export function buildReportStorageKey(userId: string, jobId: string): string {
  return `reports/${userId}/${jobId}.pdf`;
}
