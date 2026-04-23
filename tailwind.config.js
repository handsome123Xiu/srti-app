/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'rice-paper': '#f5f5f0', // 宣纸底色
        'ink-black': '#1a1a1a',  // 浓墨
        'ink-gray': '#4a4a4a',   // 淡墨
        'cinnabar': '#c23531',   // 朱砂红（用于强调和十日终焉的压迫感）
      },
      fontFamily: {
        'serif': ['"Noto Serif SC"', '"Songti SC"', 'serif'], // 强制使用衬线宋体，增强文学感
      }
    },
  },
  plugins: [],
}