import CryptoJS from 'crypto-js'

const key = CryptoJS.enc.Utf8.parse('SQLBot1234567890')

export const encrypted = (str: string) => {
  return CryptoJS.AES.encrypt(str, key, {
    mode: CryptoJS.mode.ECB,
    padding: CryptoJS.pad.Pkcs7,
  }).toString()
}

export const decrypted = (str: string) => {
  const bytes = CryptoJS.AES.decrypt(str, key, {
    mode: CryptoJS.mode.ECB,
    padding: CryptoJS.pad.Pkcs7,
  })
  return bytes.toString(CryptoJS.enc.Utf8)
}
