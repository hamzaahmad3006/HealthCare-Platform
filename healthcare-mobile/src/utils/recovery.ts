export function recoveryPhone(value: string): string {
  const digits = value.replace(/[\s()+-]/g, '');
  const local = digits.startsWith('92')
    ? digits.slice(2)
    : digits.replace(/^0/, '');
  if (!/^3\d{9}$/.test(local))
    throw new Error('Enter a valid Pakistani mobile number.');
  return `+92${local}`;
}

export function resetPayload(
  phone: string,
  otp: string,
  password: string,
  confirm: string,
) {
  if (!/^\d{6}$/.test(otp)) throw new Error('Enter the 6-digit reset code.');
  if (password.length < 8)
    throw new Error('Password must be at least 8 characters.');
  if (password !== confirm) throw new Error('Passwords do not match.');
  return { phone: recoveryPhone(phone), otp, newPassword: password };
}
