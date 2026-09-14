const axios = require('axios');

async function test() {
  try {
    console.log('Logging in...');
    try {
      const loginRes = await axios.post('http://localhost:1339/api/auth/local', {
        identifier: 'ahmetteacher@gmail.com',
        password: '123456'
      });
      console.log('Token:', loginRes.data.jwt);
    } catch (loginErr) {
      console.error('Login failed details:', loginErr.message, loginErr.code, loginErr.response?.status, loginErr.response?.data);
      return;
    }
  } catch (err) {
    console.error('Outer error:', err.message);
  }
}

test();
