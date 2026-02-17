declare global {
  interface ImportMetaEnv {
    VITE_BACKEND_ROOT: string;
  }

  type KeyOfObjectOfType<T, TCondition> = {
    [K in keyof T]: T[K] extends TCondition ? K : never;
  }[keyof T];
}
