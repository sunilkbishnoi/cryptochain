# 🔐 Blockchain PDF Encryption & Decryption Platform

## 📖 About the Project
This web application lets you **securely encrypt and decrypt PDF files** using advanced **AES-256 + RSA encryption** with **blockchain-backed key storage**.

### 🛡 Key Features
- **PDF Encryption** → Upload a PDF, encrypt it with AES-256, and store the encryption key securely on a blockchain.
- **Blockchain Security** → Metadata (hash, encrypted key, timestamp) is stored immutably for verification and retrieval.
- **Encrypted File Download** → Save the encrypted file locally in `.enc` format.
- **Cross-Device Decryption** → Decrypt on another device by uploading the encrypted file and your private RSA key.
- **Integrity Verification** → SHA-256 hash checks ensure the file hasn’t been tampered with.
- **Multi-Factor Authentication** → Extra security before decryption.

### 🎯 Why Use This?
- Protect sensitive PDFs with **military-grade encryption**.
- Ensure **tamper-proof verification** via blockchain.
- Enable **secure file sharing** without exposing encryption keys.

---

## 🖥 Tech Overview
- **Frontend:** React + Tailwind CSS + shadcn-ui
- **Backend:** Node.js / Python (Encryption & Blockchain logic)
- **Blockchain:** Private/Permissioned network (e.g., Hyperledger/Ethereum)
- **Security:** AES-256, RSA-4096, SHA-256, MFA

---
