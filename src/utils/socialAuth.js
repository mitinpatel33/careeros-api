const { appError } = require("./appError");

const verifyGoogle = async (accessToken) => {
  const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw appError("Invalid Google token.", 401);

  const p = await res.json();
  if (!p.email || !p.email_verified) {
    throw appError("Google account email is not verified.", 400);
  }
  return {
    providerId: p.sub,
    email: p.email.toLowerCase(),
    firstName: p.given_name || p.name || "User",
    lastName: p.family_name || "",
    avatar: p.picture,
  };
};

const verifyFacebook = async (accessToken) => {
  const { FACEBOOK_APP_ID, FACEBOOK_APP_SECRET } = process.env;

  // Make sure the token was issued for OUR app
  const debugRes = await fetch(
    `https://graph.facebook.com/debug_token?input_token=${accessToken}&access_token=${FACEBOOK_APP_ID}|${FACEBOOK_APP_SECRET}`,
  );
  const debug = await debugRes.json();
  if (!debug.data?.is_valid || debug.data.app_id !== FACEBOOK_APP_ID) {
    throw appError("Invalid Facebook token.", 401);
  }

  const res = await fetch(
    `https://graph.facebook.com/me?fields=id,first_name,last_name,email,picture.type(large)&access_token=${accessToken}`,
  );
  const p = await res.json();
  if (!res.ok || p.error) throw appError("Invalid Facebook token.", 401);
  if (!p.email) {
    throw appError(
      "Facebook did not return an email. Please use another login method.",
      400,
    );
  }
  return {
    providerId: p.id,
    email: p.email.toLowerCase(),
    firstName: p.first_name || "User",
    lastName: p.last_name || "",
    avatar: p.picture?.data?.url,
  };
};

module.exports = { verifyGoogle, verifyFacebook };
