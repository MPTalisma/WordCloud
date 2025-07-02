const QRCode = require('qrcode');

const baseURL = 'https://your-app-name.onrender.com/form'; // Replace after deploying

QRCode.toFile('qrcode.png', baseURL, {
  color: { dark: '#000000', light: '#FFFFFF' },
}, (err) => {
  if (err) throw err;
  console.log('✅ QR code saved as qrcode.png');
});