import next from "eslint-config-next/core-web-vitals";

const config = [
  ...next,
  { ignores: [".next/**", "out/**", "build/**"] },
  // Official imperative animation sources; app adapters retain all normal rules.
  {
    files: ["app/components/public/effects/*.jsx"],
    rules: {
      "react-hooks/refs": "off",
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/exhaustive-deps": "off",
      "@next/next/no-img-element": "off",
    },
  },
];

export default config;
