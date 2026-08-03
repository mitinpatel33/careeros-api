exports.slugFromSubdomain = (req, res, next) => {
  const host = req.headers.host;
  const parts = host.split('.');
  // Domain pattern: *.resume.dev
  if (
    parts.length >= 2 &&
    parts[parts.length - 2] === 'resume' &&
    parts[parts.length - 1] === 'dev'
  ) {
    req.slug = parts[0];
  } else {
    req.slug = null;
  }
  next();
};
