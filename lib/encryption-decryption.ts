import CryptoJS from "crypto-js";

const secretKey = process.env.NEXT_PUBLIC_SECRET_KEY as string;
console.log(secretKey);

interface ICryptoJSEncryption {
    type: string;
    password: string;
};

interface ICryptoJSDcryption {
    auth: string;
};

export const encryptData = ({type, password}: ICryptoJSEncryption) => {
    const data = JSON.stringify({ type, password });

    return CryptoJS.AES.encrypt(data, secretKey).toString(); 
}


export const decryptData = (data: ICryptoJSDcryption) => {  
  const decryptData = CryptoJS.AES.decrypt(data.auth, secretKey).toString(CryptoJS.enc.Utf8);
  try {
    return JSON.parse(decryptData) as ICryptoJSEncryption;
  } catch {
    return null;
  }
}