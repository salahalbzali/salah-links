import type { Config } from "tailwindcss";
const config: Config = { content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"], theme: { extend: { colors: { ink: "#0F172A", gold: "#D4AF37" }, boxShadow: { soft: "0 12px 40px rgba(15,23,42,.08)" } } }, plugins: [] };
export default config;
