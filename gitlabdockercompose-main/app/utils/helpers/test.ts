const isTestEnv: () => boolean = () => {
  return process.env.NODE_ENV === 'test';
};

export { isTestEnv };
