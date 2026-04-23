const jwt = require('jsonwebtoken');
const fs = require('fs');

const token = jwt.sign(
  { id: 1, name: 'Admin', email: 'admin@heritageatelier.com', role: 'admin' },
  'heritage_atelier_secret_key_2024',
  { expiresIn: '1h' }
);

fetch('http://localhost:3000/api/admin/vendors', {
  headers: {
    'Authorization': 'Bearer ' + token
  }
})
.then(res => res.text())
.then(data => {
  fs.writeFileSync('test_api_out.txt', data);
  console.log('Done writing response.');
})
.catch(err => {
  fs.writeFileSync('test_api_out.txt', 'Error: ' + String(err));
  console.log('Done writing error.');
});
