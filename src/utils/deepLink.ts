/**
 * Tautan yang dikodekan ke dalam QR. Dibuka lewat kamera HP → halaman terkait,
 * kartu "Gabung"/"Hubungkan" otomatis terisi kodenya (lihat hooks/useCodeParam.ts).
 */
export const ROOM_CODE_PARAM = "gabung";
export const LINK_CODE_PARAM = "hubungkan";

const withCode = (path: string, param: string, code: string) =>
  `${window.location.origin}${path}?${param}=${encodeURIComponent(code)}`;

/** Santri: gabung ke room guru. */
export const roomJoinUrl = (code: string) => withCode("/learning", ROOM_CODE_PARAM, code);

/** Orang tua: hubungkan akun dengan anak. */
export const parentLinkUrl = (code: string) => withCode("/parent", LINK_CODE_PARAM, code);
