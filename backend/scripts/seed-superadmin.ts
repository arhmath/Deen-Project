import { pathToFileURL } from "node:url";
import { db, ts } from "../src/lib/firebase";
import { C } from "../src/shared/collections";
import { hashPassword } from "../src/shared/security";
import { uniqueRef } from "../src/shared/unique";

export type SuperadminSeedConfig = {
  id: string;
  name: string;
  username: string;
  password: string;
  email: string | null;
  role: "SUPERADMIN";
};

export type SuperadminSeedEnv = Record<string, string | undefined>;

/**
 * Password wajib diberikan lewat environment; tidak ada kredensial default
 * yang aman untuk disimpan di repository.
 */
export function getSuperadminSeedConfig(
  source: SuperadminSeedEnv = process.env as SuperadminSeedEnv
): SuperadminSeedConfig {
  const password = source.SUPERADMIN_SEED_PASSWORD ?? "";
  const username = (source.SUPERADMIN_SEED_USERNAME ?? "superadmin").trim();
  const email = (source.SUPERADMIN_SEED_EMAIL ?? "").trim().toLowerCase() || null;
  const name = (source.SUPERADMIN_SEED_NAME ?? "Superadmin Deen").trim();

  if (password.length < 16 || password.length > 128) {
    throw new Error("SUPERADMIN_SEED_PASSWORD wajib diisi dengan panjang 16–128 karakter.");
  }
  if (!/^[a-zA-Z0-9_.]{3,50}$/.test(username)) {
    throw new Error("SUPERADMIN_SEED_USERNAME harus 3–50 karakter (huruf, angka, titik, underscore).");
  }
  if (name.length < 2 || name.length > 100) {
    throw new Error("SUPERADMIN_SEED_NAME harus 2–100 karakter.");
  }
  if (email && (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 255)) {
    throw new Error("SUPERADMIN_SEED_EMAIL tidak valid.");
  }

  return { id: "superadmin", name, username, password, email, role: "SUPERADMIN" };
}

/**
 * Idempoten secara aman: membuat akun hanya jika ID, username, dan email
 * belum dipakai. Tidak pernah mengubah akun yang sudah ada atau mereset password.
 */
export async function seedSuperadmin() {
  const superadmin = getSuperadminSeedConfig();
  const userRef = db().collection(C.users).doc(superadmin.id);
  const usernameRef = uniqueRef("username", superadmin.username);
  const emailRef = superadmin.email ? uniqueRef("email", superadmin.email) : null;
  const passwordHash = await hashPassword(superadmin.password);
  const now = ts();

  const created = await db().runTransaction(async (tx) => {
    const [userSnap, usernameSnap, emailSnap] = await Promise.all([
      tx.get(userRef),
      tx.get(usernameRef),
      emailRef ? tx.get(emailRef) : Promise.resolve(null),
    ]);

    if (userSnap.exists) {
      if ((userSnap.data() as { role?: string }).role !== "SUPERADMIN") {
        throw new Error("Dokumen users/superadmin sudah dipakai oleh role lain. Tidak ada perubahan yang dilakukan.");
      }
      return false; // akun sudah ada: sukses tanpa mengubah password atau profil
    }
    if (usernameSnap.exists) {
      throw new Error("Username Superadmin sudah digunakan. Pilih SUPERADMIN_SEED_USERNAME lain.");
    }
    if (emailSnap?.exists) {
      throw new Error("Email Superadmin sudah digunakan. Pilih SUPERADMIN_SEED_EMAIL lain.");
    }

    tx.create(userRef, {
      name: superadmin.name,
      username: superadmin.username,
      usernameLower: superadmin.username.toLowerCase(),
      email: superadmin.email,
      emailLower: superadmin.email,
      passwordHash,
      role: superadmin.role,
      avatarUrl: null,
      linkCode: null,
      isActive: true,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    });
    tx.create(usernameRef, {
      userId: superadmin.id,
      type: "username",
      createdAt: now,
    });
    if (emailRef && superadmin.email) {
      tx.create(emailRef, {
        userId: superadmin.id,
        type: "email",
        createdAt: now,
      });
    }
    return true;
  });

  // Jangan pernah mencetak password atau hash ke log.
  return { id: superadmin.id, username: superadmin.username, role: superadmin.role, created };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  seedSuperadmin()
    .then((account) => {
      console.log(account.created
        ? `Akun Superadmin berhasil dibuat: ${account.username}`
        : `Akun Superadmin sudah ada; tidak ada perubahan: ${account.username}`);
    })
    .catch((error: unknown) => {
      console.error(error instanceof Error ? error.message : "Seed Superadmin gagal.");
      process.exitCode = 1;
    });
}
