const frontendUrl = process.argv[2];
const workerUrl = process.argv[3];
if (!frontendUrl || !workerUrl) throw new Error("Frontend and worker URLs are required");

async function check(name, run, attempts = 6) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      await run();
      console.log(`OK ${name}`);
      return;
    } catch (error) {
      lastError = error;
      if (attempt < attempts) await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }
  throw new Error(`${name} failed: ${lastError?.message || lastError}`);
}

await check("frontend landing page", async () => {
  const response = await fetch(frontendUrl, { redirect: "follow" });
  const html = await response.text();
  if (!response.ok || !html.includes("KontenMu")) throw new Error(`status ${response.status}`);
});

await check("public worker API", async () => {
  const response = await fetch(`${workerUrl}/api/stats`);
  if (!response.ok) throw new Error(`status ${response.status}`);
  const body = await response.json();
  if (!body.success) throw new Error("unexpected response");
});

await check("worker authentication guard", async () => {
  const response = await fetch(`${workerUrl}/api/users`);
  if (response.status !== 401) throw new Error(`expected 401, received ${response.status}`);
});

await check("pages authentication guard", async () => {
  const response = await fetch(`${frontendUrl}/api/users`);
  if (response.status !== 401) throw new Error(`expected 401, received ${response.status}`);
});
