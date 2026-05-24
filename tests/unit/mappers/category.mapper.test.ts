import type { Category } from "../../../src/generated/prisma/client";
import {
  toCategoryResponse,
  toCategoryTreeNode,
  toCategoryTreeResponse,
} from "../../../src/mappers/category.mapper";

const baseCategory: Category = {
  id: "clk7v9x1k0000qzq8x8x8x8xb",
  userId: "clg7v9x1k0000qzq8x8x8x8x8",
  name: "Food",
  kind: "EXPENSE",
  parentId: null,
  createdAt: new Date("2026-05-01T00:00:00.000Z"),
  updatedAt: new Date("2026-05-01T00:00:00.000Z"),
  deletedAt: null,
  isDeleted: false,
};

describe("category.mapper", () => {
  it("toCategoryResponse мапить deletedAt", () => {
    const withDeleted = toCategoryResponse({
      ...baseCategory,
      deletedAt: new Date("2026-05-02T00:00:00.000Z"),
      isDeleted: true,
    });
    expect(withDeleted.deletedAt).toBe("2026-05-02T00:00:00.000Z");
    expect(withDeleted.isDeleted).toBe(true);
  });

  it("toCategoryTreeNode рекурсивно мапить children", () => {
    const node = toCategoryTreeNode({
      ...baseCategory,
      children: [
        {
          ...baseCategory,
          id: "cln7v9x1k0000qzq8x8x8x8x2",
          parentId: baseCategory.id,
          children: [],
        },
      ],
    });
    expect(node.children).toHaveLength(1);
    expect(toCategoryTreeResponse([{ ...baseCategory, children: [] }])).toHaveLength(1);
  });
});
