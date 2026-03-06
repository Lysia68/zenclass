/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: { sans: ["Inter", "-apple-system", "sans-serif"] },
      colors: {
        bg:         "#F4EFE8",
        surface:    "#FFFFFF",
        warm:       "#FBF8F4",
        border:     "#DDD5C8",
        accent:     "#B07848",
        "accent-dk":"#8C5E38",
        "accent-bg":"#F5EBE0",
        ink:        "#2A1F14",
        "ink-mid":  "#5C4A38",
        "ink-soft": "#8C7B6C",
        "ink-muted":"#B0A090",
        ok:         "#4E8A58",
        warn:       "#A85030",
        info:       "#3A6E90",
      },
    },
  },
  plugins: [],
}
