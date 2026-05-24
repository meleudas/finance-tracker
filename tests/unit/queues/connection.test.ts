import { getQueueConnection } from "../../../src/queues/connection";
import { env } from "../../../src/config/env";

describe("getQueueConnection", () => {
  it("returns redis url and bullmq-compatible options", () => {
    const conn = getQueueConnection();
    expect(conn).toEqual({
      url: env.REDIS_URL,
      maxRetriesPerRequest: null,
    });
  });
});
