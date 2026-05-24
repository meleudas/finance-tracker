import { withSoftDeleteExtension } from "../../../src/config/prismaSoftDeleteExtension";

describe("withSoftDeleteExtension", () => {
  const models = [
    "user",
    "currency",
    "account",
    "category",
    "transaction",
    "budget",
    "recurringRule",
    "recurringFrequency",
    "attachment",
    "transfer",
  ] as const;

  it("перевизначає delete/deleteMany для всіх моделей", async () => {
    const delegates = Object.fromEntries(
      models.map((model) => [
        model,
        {
          update: jest.fn().mockResolvedValue({}),
          updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        },
      ]),
    ) as Record<string, { update: jest.Mock; updateMany: jest.Mock }>;

    interface ExtensionConfig {
      query: Record<
        string,
        {
          delete: (ctx: { args: { where: unknown } }) => Promise<unknown>;
          deleteMany: (ctx: { args: { where: unknown } }) => Promise<unknown>;
        }
      >;
    }

    let extensionConfig!: ExtensionConfig;

    const base = {
      ...delegates,
      $extends: jest.fn((config: ExtensionConfig) => {
        extensionConfig = config;
        return {};
      }),
    };

    withSoftDeleteExtension(base as never);

    for (const model of models) {
      const delegate = delegates[model];
      const handlers = extensionConfig.query[model];
      if (delegate === undefined || handlers === undefined) {
        throw new Error(`missing soft-delete handlers for ${model}`);
      }
      await handlers.delete({ args: { where: { id: `${model}-id` } } });
      expect(delegate.update).toHaveBeenCalledWith({
        where: { id: `${model}-id` },
        data: expect.objectContaining({ isDeleted: true, deletedAt: expect.any(Date) }),
      });
    }

    for (const model of models) {
      jest.clearAllMocks();
      const delegate = delegates[model];
      const handlers = extensionConfig.query[model];
      if (delegate === undefined || handlers === undefined) {
        throw new Error(`missing soft-delete handlers for ${model}`);
      }
      await handlers.deleteMany({ args: { where: { userId: "u1" } } });
      expect(delegate.updateMany).toHaveBeenCalledWith({
        where: { userId: "u1" },
        data: expect.objectContaining({ isDeleted: true, deletedAt: expect.any(Date) }),
      });
    }
  });
});
