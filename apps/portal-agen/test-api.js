const session = {
  username: 'superadmin',
  role: 'superadmin',
  displayName: 'Dikdasmen Pusat',
  initial: 'SA',
  loginAt: Date.now(),
  expiresAt: Date.now() + 1000000000
};
const cookieValue = encodeURIComponent(JSON.stringify(session));
const cookieString = `kontenmu_session_portal_agen=${cookieValue}`;
fetch('https://kontenmu.labmu.dev/api/contents', {
  headers: {
    'Cookie': cookieString
  }
}).then(res => res.text()).then(text => console.log('API RESPONSE:', text));
