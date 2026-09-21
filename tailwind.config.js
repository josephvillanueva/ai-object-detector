/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,mdx}",
    // The folder is "component" (singular); the old "./components" glob
    // meant Tailwind never scanned it.
    "./component/**/*.{js,jsx}",
    "./utils/**/*.{js,jsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
