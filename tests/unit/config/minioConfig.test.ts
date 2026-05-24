const clientInstances: unknown[] = [];

jest.mock("minio", () => ({
  Client: jest.fn().mockImplementation((opts: unknown) => {
    clientInstances.push(opts);
    return {};
  }),
}));

describe("minioConfig", () => {
  const originalEndpoint = process.env.S3_ENDPOINT;

  afterEach(() => {
    process.env.S3_ENDPOINT = originalEndpoint;
    clientInstances.length = 0;
    jest.resetModules();
  });

  it("парсить http endpoint без порту", async () => {
    process.env.S3_ENDPOINT = "http://minio.local";
    jest.resetModules();
    const { attachmentsBucket } = await import("../../../src/config/minioConfig");
    expect(clientInstances[0]).toEqual(
      expect.objectContaining({
        endPoint: "minio.local",
        port: 9000,
        useSSL: false,
        pathStyle: true,
      }),
    );
    expect(attachmentsBucket).toBe(process.env.S3_BUCKET);
  });

  it("парсить https endpoint з явним портом", async () => {
    process.env.S3_ENDPOINT = "https://s3.example.com:443";
    jest.resetModules();
    await import("../../../src/config/minioConfig");
    expect(clientInstances[0]).toEqual(
      expect.objectContaining({
        endPoint: "s3.example.com",
        port: 443,
        useSSL: true,
      }),
    );
  });
});
