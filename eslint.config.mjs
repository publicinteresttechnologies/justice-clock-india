import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";

const eslintConfig = [
  {
    ignores: [".next/**", ".pnpm-local/**", "node_modules/**"],
  },
  ...nextVitals,
  ...nextTypeScript,
];

export default eslintConfig;
