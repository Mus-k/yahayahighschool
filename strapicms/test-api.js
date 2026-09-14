const axios = require('axios');
axios.get('http://localhost:1339/api/career-positions?locale=en&populate=*').catch(e => console.log(JSON.stringify(e.response.data, null, 2)));
