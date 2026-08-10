const TENANT_ROLES = new Set(["sekolah", "guru", "siswa"]);

export function getTenantSchoolId(context: any): number | null {
  const auth = context.data?.auth || {};
  if (!TENANT_ROLES.has(String(auth.role || ""))) return null;

  const rawSchoolId = auth.sekolahId ?? auth.sekolah_id;
  const schoolId = Number(rawSchoolId);
  return Number.isInteger(schoolId) && schoolId > 0 ? schoolId : 0;
}

export function tenantError() {
  return new Response(
    JSON.stringify({ success: false, error: "Tenant sekolah pada sesi tidak valid" }),
    {
      status: 403,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    },
  );
}

export function filterTenantState(
  data: any,
  schoolId: number,
  allowedLearningUsers?: Set<string>,
) {
  const next = { ...data };
  const tenantUsernames = new Set(
    [
      ...(Array.isArray(data?.users) ? data.users : []),
      ...(Array.isArray(data?.schoolUsers) ? data.schoolUsers : []),
    ]
      .filter((item: any) =>
        [item?.schoolId, item?.sekolahId, item?.sekolah_id].some(
          (value) => Number(value) === schoolId,
        ),
      )
      .map((item: any) => String(item?.username || ""))
      .filter(Boolean),
  );
  if (allowedLearningUsers) {
    allowedLearningUsers.forEach((username) => tenantUsernames.add(username));
  }
  const filterBySchool = (items: unknown) =>
    Array.isArray(items)
      ? items.filter((item: any) =>
          [item?.schoolId, item?.sekolahId, item?.sekolah_id].some(
            (value) => Number(value) === schoolId,
          ),
        )
      : items;

  for (const key of ["users", "sales", "payments", "subscriptions"]) {
    if (key in next) next[key] = filterBySchool(next[key]);
  }
  if (Array.isArray(next.allocations)) {
    next.allocations = next.allocations.filter(
      (item: any) =>
        [item?.schoolId, item?.sekolahId, item?.sekolah_id].some(
          (value) => Number(value) === schoolId,
        ) || tenantUsernames.has(String(item?.studentUsername || "")),
    );
  }
  if (Array.isArray(next.schools)) {
    next.schools = next.schools.filter((school: any) => Number(school?.id) === schoolId);
  }
  if (allowedLearningUsers && Array.isArray(next.learning)) {
    next.learning = next.learning.filter((item: any) =>
      allowedLearningUsers.has(String(item?.studentUsername || "")),
    );
  }

  return next;
}

export function mergeTenantState(
  existing: any,
  incoming: any,
  schoolId: number,
  allowedLearningUsers?: Set<string>,
) {
  const next = { ...existing };
  const tenantKeys = ["users", "sales", "payments", "subscriptions"];
  const tenantUsernames = new Set(
    [
      ...(Array.isArray(existing?.users) ? existing.users : []),
      ...(Array.isArray(existing?.schoolUsers) ? existing.schoolUsers : []),
      ...(Array.isArray(incoming?.users) ? incoming.users : []),
      ...(Array.isArray(incoming?.schoolUsers) ? incoming.schoolUsers : []),
    ]
      .filter((item: any) =>
        [item?.schoolId, item?.sekolahId, item?.sekolah_id].some(
          (value) => Number(value) === schoolId,
        ),
      )
      .map((item: any) => String(item?.username || ""))
      .filter(Boolean),
  );
  if (allowedLearningUsers) {
    allowedLearningUsers.forEach((username) => tenantUsernames.add(username));
  }
  const belongsToSchool = (item: any) =>
    [item?.schoolId, item?.sekolahId, item?.sekolah_id].some(
      (value) => Number(value) === schoolId,
    );

  for (const key of tenantKeys) {
    if (!Array.isArray(incoming?.[key])) continue;
    const otherTenants = Array.isArray(existing?.[key])
      ? existing[key].filter((item: any) => !belongsToSchool(item))
      : [];
    const ownTenant = incoming[key].filter(belongsToSchool);
    next[key] = [...otherTenants, ...ownTenant];
  }

  if (Array.isArray(incoming?.allocations)) {
    const allocationBelongsToSchool = (item: any) =>
      belongsToSchool(item) ||
      tenantUsernames.has(String(item?.studentUsername || ""));
    const otherTenants = Array.isArray(existing?.allocations)
      ? existing.allocations.filter(
          (item: any) => !allocationBelongsToSchool(item),
        )
      : [];
    const ownTenant = incoming.allocations.filter(allocationBelongsToSchool);
    next.allocations = [...otherTenants, ...ownTenant];
  }

  if (Array.isArray(incoming?.schools)) {
    const otherSchools = Array.isArray(existing?.schools)
      ? existing.schools.filter((school: any) => Number(school?.id) !== schoolId)
      : [];
    const ownSchool = incoming.schools.filter(
      (school: any) => Number(school?.id) === schoolId,
    );
    next.schools = [...otherSchools, ...ownSchool];
  }

  if (allowedLearningUsers && Array.isArray(incoming?.learning)) {
    const otherTenants = Array.isArray(existing?.learning)
      ? existing.learning.filter(
          (item: any) =>
            !allowedLearningUsers.has(String(item?.studentUsername || "")),
        )
      : [];
    const ownTenant = incoming.learning.filter((item: any) =>
      allowedLearningUsers.has(String(item?.studentUsername || "")),
    );
    next.learning = [...otherTenants, ...ownTenant];
  }

  return next;
}
