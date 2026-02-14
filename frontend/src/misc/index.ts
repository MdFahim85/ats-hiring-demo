export function getPageRange(
  currentPage: number,
  totalPages: number,
  siblingCount = 1,
): (number | "...")[] {
  const range: (number | "...")[] = [];
  const start = Math.max(2, currentPage - siblingCount);
  const end = Math.min(totalPages - 1, currentPage + siblingCount);

  range.push(1);

  if (start > 2) range.push("...");

  for (let i = start; i <= end; i++) {
    range.push(i);
  }

  if (end < totalPages - 1) range.push("...");

  if (totalPages > 1) range.push(totalPages);

  return range;
}
