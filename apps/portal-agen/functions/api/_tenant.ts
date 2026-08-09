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

export function filterTenantState(data: any, schoolId: number) {
  const next = { ...data };
  const filterBySchool = (items: unknown) =>
    Array.isArray(items)
      ? items.filter((item: any) =>
          [item?.schoolId, item?.sekolahId, item?.sekolah_id].some(
            (value) => Number(value) === schoolId,
          ),
        )
      : items;

  for (const key of [
    "users",
    "sales",
    "payments",
    "allocations",
    "subscriptions",
  ]) {
    if (key in next) next[key] = filterBySchool(next[key]);
  }
  if (Array.isArray(next.schools)) {
    next.schools = next.schools.filter((school: any) => Number(school?.id) === schoolId);
  }

  return next;
}

export function mergeTenantState(existing: any, incoming: any, schoolId: number) {
  const next = { ...existing };
  const tenantKeys = ["users", "sales", "payments", "allocations", "subscriptions"];
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

  if (Array.isArray(incoming?.schools)) {
    const otherSchools = Array.isArray(existing?.schools)
      ? existing.schools.filter((school: any) => Number(school?.id) !== schoolId)
      : [];
    const ownSchool = incoming.schools.filter(
      (school: any) => Number(school?.id) === schoolId,
    );
    next.schools = [...otherSchools, ...ownSchool];
  }

  return next;
}
