'use server'
const crypto = require('crypto-js');

var ciphertext = crypto.AES.encrypt(JSON.stringify(data), 'secret key 123').toString();

// Decrypt
var bytes  = crypto.AES.decrypt(ciphertext, 'secret key 123');
var decryptedData = JSON.parse(bytes.toString(crypto.enc.Utf8));