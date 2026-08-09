const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
const apiToken = process.env.CLOUDFLARE_API_TOKEN;
const project = process.argv[2];
if (!accountId || !apiToken || !project) throw new Error("Cloudflare credentials and project are required");

const baseUrl = `https://api.cloudflare.com/client/v4/accounts/${accountId}/pages/projects/${project}`;
const headers = { Authorization: `Bearer ${apiToken}`, "Content-Type": "application/json" };
const listResponse = await fetch(`${baseUrl}/deployments?env=production`, { headers });
const listBody = await listResponse.json();
if (!listResponse.ok || !listBody.success) throw new Error("Unable to list Pages deployments");

const successful = listBody.result
  .filter((deployment) => deployment.latest_stage?.status === "success")
  .sort((a, b) => new Date(b.created_on).getTime() - new Date(a.created_on).getTime());
if (successful.length < 2) throw new Error("No previous successful Pages deployment is available");

const target = successful[1];
const rollbackResponse = await fetch(`${baseUrl}/deployments/${target.id}/rollback`, {
  method: "POST",
  headers,
});
const rollbackBody = await rollbackResponse.json();
if (!rollbackResponse.ok || !rollbackBody.success) throw new Error("Pages rollback failed");
console.log(`Rolled back ${project} to deployment ${target.id}`);
