/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        agent: {
          coordinator: "#6366f1",
          worker: "#3b82f6",
          reviewer: "#f59e0b",
          security: "#ef4444",
          performance: "#10b981",
          architecture: "#8b5cf6",
          testing: "#06b6d4",
          devops: "#f97316",
          custom: "#64748b",
        },
      },
    },
  },
  plugins: [],
};
