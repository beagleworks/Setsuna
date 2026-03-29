const config = {
  '*.{ts,tsx}': ['oxlint --fix', 'prettier --write'],
  '*.{json,md,css}': ['prettier --write'],
};

export default config;
