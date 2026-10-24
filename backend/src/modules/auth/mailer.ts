import nodemailer, { type Transporter } from "nodemailer";
import { env } from "@/config/env";
import { logger } from "@/shared/logger";

let transport: Transporter | null | undefined;

function getTransport(): Transporter | null {
  if (transport !== undefined) return transport;
  const e = env();
  transport = e.SMTP_HOST
    ? nodemailer.createTransport({
        host: e.SMTP_HOST,
        port: e.SMTP_PORT,
        secure: e.SMTP_PORT === 465,
        auth: e.SMTP_USER ? { user: e.SMTP_USER, pass: e.SMTP_PASS ?? "" } : undefined,
      })
    : null;
  return transport;
}

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export interface PasswordResetMail {
  to: string;
  name: string;
  link: string;
  ttlMin: number;
}

/**
 * Kirim email reset password. Tanpa SMTP_HOST (development): tautan dicetak ke log,
 * kecuali NODE_ENV=production — di sana tautan tidak pernah ditulis ke log.
 */
export async function sendPasswordResetEmail(m: PasswordResetMail): Promise<void> {
  const t = getTransport();
  if (!t) {
    if (env().NODE_ENV !== "production") logger.warn("mail_not_configured_dev_reset_link", { to: m.to, link: m.link });
    else logger.error("mail_not_configured", { reason: "SMTP_HOST belum diisi; email reset tidak terkirim" });
    return;
  }
  const text = [
    `Halo ${m.name},`,
    "",
    "Kami menerima permintaan untuk mengatur ulang password akun Deen kamu.",
    `Buka tautan berikut (berlaku ${m.ttlMin} menit, hanya bisa dipakai sekali):`,
    m.link,
    "",
    "Kalau kamu tidak memintanya, abaikan saja email ini — password kamu tidak berubah.",
  ].join("\n");
  const html = `<p>Halo ${esc(m.name)},</p>
<p>Kami menerima permintaan untuk mengatur ulang password akun Deen kamu.</p>
<p><a href="${esc(m.link)}" style="display:inline-block;padding:12px 20px;background:#8231f2;color:#fff;border-radius:12px;text-decoration:none;font-weight:bold">Atur ulang password</a></p>
<p>Tautan berlaku ${m.ttlMin} menit dan hanya bisa dipakai sekali. Kalau tombol tidak berfungsi, salin alamat ini ke browser:<br>${esc(m.link)}</p>
<p>Kalau kamu tidak memintanya, abaikan saja email ini — password kamu tidak berubah.</p>`;
  await t.sendMail({ from: env().MAIL_FROM, to: m.to, subject: "Atur ulang password Deen", text, html });
}
