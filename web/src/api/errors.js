export function errorMessage(err, fallback = 'Terjadi kesalahan') {
  return err.response?.data?.error?.message || fallback;
}
