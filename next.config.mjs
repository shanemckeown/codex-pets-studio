/** Keep production verification separate from the running development server. */
const config = {
  distDir: process.env.NODE_ENV === 'production' ? '.next-production' : '.next',
  devIndicators: false,
};
export default config;
