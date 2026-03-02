import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: "#1A264A",
                "primary-foreground": "#ffffff",

                success: "#28A745",
                "success-foreground": "#ffffff",

                warning: "#FFC107",
                "warning-foreground": "#000000",

                error: "#DC3545",
                "error-foreground": "#ffffff",

                neutral: "#6C757D",
                "neutral-dark": "#343A40",

                background: "#F8F9FA",
                foreground: "#1A264A",
            },
            fontFamily: {
                sans: ["var(--font-outfit)", "ui-sans-serif", "system-ui"],
                heading: ["var(--font-outfit)", "ui-sans-serif", "system-ui"],
            },
        },
    },
    plugins: [],
};
export default config;
