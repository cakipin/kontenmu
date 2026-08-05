const fs = require('fs');

let fileContent = fs.readFileSync('apps/portal-agen/functions/api/users.ts', 'utf-8');

fileContent = fileContent.replace('export const onRequestGet', `import { drizzle } from 'drizzle-orm/d1';
import { desc, sql } from 'drizzle-orm';
import { users } from '../../src/db/schema';

export const onRequestGet`);

fileContent = fileContent.replace(/const result = await context\.env\.DB\.prepare\([\s\S]*?\}\);/, `const ormDb = drizzle(context.env.DB);
    const result = await ormDb.select({
      id: users.id,
      username: users.username,
      nama: users.nama,
      role: users.roleSlug,
      wilayah: users.wilayah,
      status: users.status,
      initial: users.initial,
      color: users.color,
      terakhirLogin: users.terakhirLogin,
      kelas: users.kelas,
      nis: users.nis,
      newUserSource: users.newUserSource,
      ssoId: users.ssoId,
      email: users.email,
      requestedRole: users.requestedRole,
      suratTugas: users.suratTugas,
      masaAktif: users.masaAktif,
      sekolahId: users.sekolahId
    }).from(users).orderBy(desc(users.updatedAt), desc(users.createdAt));

    return new Response(JSON.stringify({ users: result }), { headers: jsonHeaders });`);

fileContent = fileContent.replace(/await context\.env\.DB\.prepare\([\s\S]*?\.run\(\);/, `const ormDb = drizzle(context.env.DB);
    const insertData = {
      id: user.id,
      username: user.username,
      nama: user.nama || user.username,
      roleSlug: user.role || 'pending',
      wilayah: user.wilayah || 'SSO Login',
      status: user.status || 'Aktif',
      initial: user.initial || '',
      color: user.color || '#64748b',
      terakhirLogin: user.terakhirLogin || '',
      kelas: user.kelas ?? null,
      nis: user.nis ?? null,
      newUserSource: user.newUserSource !== undefined ? user.newUserSource : 'sso',
      sekolahId: user.sekolahId ?? null,
      requestedRole: user.requestedRole ?? null,
      suratTugas: user.suratTugas ?? null,
      masaAktif: user.masaAktif ?? null,
      updatedAt: sql\`CURRENT_TIMESTAMP\`,
      password: '', // Dummy since it was omitted in raw SQL
    };
    await ormDb.insert(users).values(insertData).onConflictDoUpdate({
      target: users.username,
      set: {
        id: insertData.id,
        nama: insertData.nama,
        roleSlug: insertData.roleSlug,
        wilayah: insertData.wilayah,
        status: insertData.status,
        initial: insertData.initial,
        color: insertData.color,
        terakhirLogin: insertData.terakhirLogin,
        kelas: insertData.kelas,
        nis: insertData.nis,
        newUserSource: insertData.newUserSource,
        sekolahId: insertData.sekolahId,
        requestedRole: insertData.requestedRole,
        suratTugas: insertData.suratTugas,
        masaAktif: insertData.masaAktif,
        updatedAt: insertData.updatedAt
      }
    });`);

fs.writeFileSync('apps/portal-agen/functions/api/users.ts', fileContent);
console.log('patched users.ts');
