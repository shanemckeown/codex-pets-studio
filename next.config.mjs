/** Keep production verification separate from the running development server. */
const config = {
  distDir: process.env.NODE_ENV === 'production' ? '.next-production' : '.next',
  devIndicators: false,
  // An explicit LAN hostname enables phone HMR without allowing arbitrary origins.
  allowedDevOrigins: process.env.CODEX_PETS_LAN_HOST
    ? ['127.0.0.1', process.env.CODEX_PETS_LAN_HOST]
    : undefined,
};
export default config;
