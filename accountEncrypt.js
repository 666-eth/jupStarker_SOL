const fs = require('fs');
const crypto = require('crypto');
const readlineSync = require('readline-sync');
const fastcsv = require('fast-csv');


const walletDataPath = '/Users/lishuai/Documents/crypto/bockchainbot/StkTestWalletData.csv';  // 未加密钱包路径
const outputDataPath = '/Users/lishuai/Documents/crypto/bockchainbot/StkTestWalletData的副本.csv'; // 加密后的钱包保存路径


const myPassword = readlineSync.question('Please enter your password: ', {
  hideEchoBack: true // 密码不回显
});
// 将CSV文件转换为Objects
const convertCSVToObjectSync = (filePath) => {
    const objects = [];
    const fileData = fs.readFileSync(filePath, 'utf-8');
    const lines = fileData.trim().split('\n');
    const header = lines[0].split(',');
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',');
      const obj = {};
      for (let j = 0; j < header.length; j++) {
        const trimmedKey = header[j].replace(/\s/g, '');
        if (trimmedKey === 'taskTag') {
            obj[trimmedKey] = values[j].trim(); // 移除换行符和其他空白字符
        } else {
            obj[trimmedKey] = values[j];
        }
      }
      objects.push(obj);
    }
    return objects;
  };

function getKeyFromPassword(password, salt) {
    const iterations = 100000; // 可以根据需要增加，目的是使密钥派生过程更耗时
    const keylen = 32; // AES-256 需要32字节的密钥
    const digest = 'sha512';

    return crypto.pbkdf2Sync(password, salt, iterations, keylen, digest);
};

function encryptUsingAESGCM(data, password) {
    const salt = crypto.randomBytes(16); // 随机盐值，用于PBKDF2
    const key = getKeyFromPassword(password, salt);

    const iv = crypto.randomBytes(12); // 对于GCM，建议使用12字节的IV
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

    const encryptedData = Buffer.concat([cipher.update(data, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();

    return {
        salt: salt.toString('hex'),
        iv: iv.toString('hex'),
        encryptedData: encryptedData.toString('hex'),
        authTag: authTag.toString('hex')
    };
};

const walletData = convertCSVToObjectSync(walletDataPath);
const cryptoWllets = [];
for (let wt of walletData) {
  const encryptedPrivateKey = encryptUsingAESGCM(wt.PrivateKey, myPassword);
  let accountEncrypt = {
    ...wt,
    s: encryptedPrivateKey.salt,
    i: encryptedPrivateKey.iv,
    e: encryptedPrivateKey.encryptedData,
    a: encryptedPrivateKey.authTag
  }
  delete accountEncrypt.PrivateKey
  cryptoWllets.push(accountEncrypt);
};

const ws = fs.createWriteStream(outputDataPath);
fastcsv.write(cryptoWllets, {headers: true}).pipe(ws);




