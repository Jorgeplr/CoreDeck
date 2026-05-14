-- Añade keypair X25519 al modelo User para vault sharing con sealed-box.
-- publicKey: base64 (32 bytes raw = 44 chars b64). VarChar(100) deja margen.
-- encryptedPrivateKey: base64 de AES-GCM(32 bytes priv) con masterKey del vault.
-- privateKeyIv: base64 del IV (12 bytes = 16 chars b64).
ALTER TABLE `users`
  ADD COLUMN `publicKey` VARCHAR(100) NULL,
  ADD COLUMN `encryptedPrivateKey` VARCHAR(500) NULL,
  ADD COLUMN `privateKeyIv` VARCHAR(50) NULL;
