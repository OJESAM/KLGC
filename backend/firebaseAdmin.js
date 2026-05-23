import admin from "firebase-admin";
{
  "type": "service_account",
  "project_id": "kairos-living-glory-church",
  "private_key_id": "3752748408715f7110a98662ec3c8bf64193adc4",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCu126gzpdAKDUL\n/vVqnW4MdL4CKjHrK1hjudBkq4nRkRDjgTv9eKJAIv3k4AI45CKBVvCBn35jkdZr\na6O/ABK83P3hJL9zdWt67ZSpy76qp+MZX9LuCoiRkw6vfYnsyg8LFhKaJ0+rpzy3\n81/JkgupihSJSKZEpyBB8+X5K8GLW4q69T/9emXwWPdLhSU+rt6sqtg3t/X6a/K8\nHK9k9Ko8J+gu72BeMT6wy/4NI7RhXYmtLpzDvYZ6w08mDMhg42r8MpHO2iSR5vKx\nyA+R9Q0Xc06ZY6r7jlbEQ4gFv2QLG3QufY/dnXnB5WiRri5270/fCn4fEr76ZYoz\nl4saUVk3AgMBAAECggEAD5Bp7rK1UCbEIh8+JZGCHGXADF1JOFARfD8sR+nlSNyL\nDlWQy42Tk/YJd/hg+kOEttLQchmKnL58we9BEl2lTV620vX8fQC04qqHk13pyTNM\nyhN3qW0SnzLiGckpIAUUtb3vRf2939/xTcbCfiUcGKmMDnSDKJVgD77wd+/nOMp1\nrT/Ktn64Mu71SbXeepBO5T851wvMcaRM26AcbZiJZvCuHRvkrWLXTreyTDEWlzr9\nNiX3pTqxcLm/BlRgMp+6nLRCyPyEr8BWjCovwzuMCzGviJ2CIISDn7Cmf13rDCzR\nMS5v7SOxpAofUiFJM6zKd9u83aJNrnT0ee9aftX+kQKBgQDakubLlv8aKFBe17ln\nKMBGiYcv4EfUCesW7PDA3qubf3+ydooCAl08gqi7p5navfT69ZgMDJPPmbByBiiQ\nblsDrlbukoiLE+sbeVp2dVXMZtO5C+/FqGR24NZpqRLE6qJQpbwk+0sufKRseLww\nHnDwvZN90vPBNWkxHU72ltmkSwKBgQDMx4rQcw5xAefDVpu6jmTVJqT4XjYlCSG0\nDn4pbOFHoRiseIFftO1XVAGwoT5A1Oyedts0KZbFvINMDTl/3izm4+RCuyofDZqs\n/DELwPET/KL5llvRDQOauTNzfWQczA17vAZC+KEoQ/KkUzE2CDE5Gf7/4tgFuO87\nCJmnHFOTRQKBgQDEbpVAjrlAts5UDievkC4MtnhqDHRBGZDPj61miDdNji4jIukw\nmRNV2E7wJtXcgi7yg1lcKsmEHyk1sFcwRh1Bl6LE0ago5YO7szobj6PGCPtqKFIa\nHxX6yGGpn6sgkYXCWNBXpAeTBa13VqI51IHHuXgd8kHid6/L1f0rG7MJNQKBgQCJ\nSyN7fBhrlc5wPcns+vkJm34xcuC0Vfn9wVW+qlwj7RMg1y5OH3yc9xqm9IRLbTYz\nTBbNUzDd4/TXcWpim2/ZYWMxhlDIPxO79N1hNvuq3c/arH9kmmgXPSIMxT3wvLIx\nii9ciVtrJpswpwIwaq+tzAsWPl19AK+MEckKrEgwTQKBgHneBDOwaXPuQedQzMKr\nX6pb8UnnSeDeEprnUKNv/PRkWME8XnhQkDkKALyGhg0gUpAibahOc+k4gv5tK5SE\nKvI6LMs1uPvlm4CBdtKm4bbijWEyX9bVCOnNN2WXSjHJkw4ScEnhtpfp92Q3GBqN\nBNlql5xjxVcEPR0oks08XjiC\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-fbsvc@kairos-living-glory-church.iam.gserviceaccount.com",
  "client_id": "100356419887106920035",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40kairos-living-glory-church.iam.gserviceaccount.com",
  "universe_domain": "googleapis.com"
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

export const db = admin.firestore();