const fs = require('fs');
const crypto = require('crypto');
const readlineSync = require('readline-sync');
const fastcsv = require('fast-csv');




const walletDataPath = '/Users/lishuai/Documents/crypto/bockchainbot/StkTestWalletData的副本.csv'; // 加密后的钱包保存路径


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
}

function decryptUsingAESGCM(a, e, i, s, password) {
    const key = getKeyFromPassword(password, Buffer.from(s, 'hex'));
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(i, 'hex'));

    decipher.setAuthTag(Buffer.from(a, 'hex'));

    const decryptedData = Buffer.concat([decipher.update(Buffer.from(e, 'hex')), decipher.final()]);
    return decryptedData.toString('utf8');
}

const myPassword = readlineSync.question('Please enter your password: ', {
    hideEchoBack: true // 密码不回显
});
const wtdata = convertCSVToObjectSync(walletDataPath);
for (let wt of wtdata) {
  const decryptedPrivateKey = decryptUsingAESGCM(wt.a, wt.e, wt.i, wt.s, myPassword);
  console.log('walletName:', wt.Wallet, 'walletAddress:', wt.Address, 'privateKey:', decryptedPrivateKey)
};