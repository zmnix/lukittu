export const verifyTurnstileToken = async (token: string): Promise<boolean> => {
  try {
    const res = await fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        method: 'POST',
        body: `secret=${encodeURIComponent(process.env.TURNSTILE_SECRET!)}&response=${encodeURIComponent(token)}`,
        headers: {
          'content-type': 'application/x-www-form-urlencoded',
        },
      },
    );

    const data = await res.json();

    return data.success;
  } catch (error) {
    return false;
  }
};
