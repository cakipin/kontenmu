const apiUsers = [
  { username: "joko", role: "siswa", wilayah: "SMP MUHAMMADIYAH 1 GRESIK" },
  { username: "ahmad", role: "guru", wilayah: "SMP MUHAMMADIYAH 1 GRESIK" },
  { username: "yudi", role: "siswa", wilayah: "SMP MUHAMMADIYAH 1 GRESIK" },
  { username: "spemutu", role: "sekolah", wilayah: "SMP MUHAMMADIYAH 1 GRESIK" },
  { username: "luna", role: "siswa", wilayah: "" }
];
const schoolId = 1;
const currentSchool = null;
const sessionWilayah = "SMP MUHAMMADIYAH 1 GRESIK";
const staff = [{ username: "ahmad", role: "guru" }]; // mock data
const allUsers = apiUsers;

const realUsers = allUsers.filter((u) => {
  if (u.sekolah_id === schoolId || u.sekolahId === schoolId) return true;
  if (currentSchool && u.wilayah?.toLowerCase() === currentSchool.nama?.toLowerCase()) return true;
  if (sessionWilayah && u.wilayah?.toLowerCase() === sessionWilayah.toLowerCase()) return true;
  return false;
});

realUsers.forEach((u) => {
  if (!staff.find(s => s.username === u.username) && (u.role === 'guru' || u.role === 'siswa' || u.role === 'sekolah')) {
    staff.push({ username: u.username, role: u.role });
  }
});

console.log(staff);
