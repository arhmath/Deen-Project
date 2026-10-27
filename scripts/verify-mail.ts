import { env } from "../src/config/env";
import { verifyMailConfiguration } from "../src/modules/auth/mailer";

async function main() {
  const e = env();
  console.log(`Memeriksa SMTP host=${e.SMTP_HOST || "(kosong)"} port=${e.SMTP_PORT} from=${e.MAIL_FROM}`);
  await verifyMailConfiguration();
  console.log("SMTP siap: koneksi dan autentikasi berhasil. Ini belum membuktikan email pasti masuk Inbox.");
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Verifikasi SMTP gagal: ${message}`);
  process.exitCode = 1;
});
