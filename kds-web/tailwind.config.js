/** @type {import('tailwindcss').Config} */
const hslVar = (name) => `hsl(var(${name}) / <alpha-value>)`;

export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  corePlugins: {
    // Keep preflight off until legacy element selectors in base.css/feature CSS are retired.
    preflight: false,
  },
  theme: {
    extend: {
      colors: {
        background: hslVar("--background"),
        foreground: hslVar("--foreground"),
        card: hslVar("--card"),
        "card-foreground": hslVar("--card-foreground"),
        popover: hslVar("--popover"),
        "popover-foreground": hslVar("--popover-foreground"),
        border: hslVar("--border"),
        input: hslVar("--input"),
        ring: hslVar("--ring"),
        muted: hslVar("--muted"),
        "muted-foreground": hslVar("--muted-foreground"),
        primary: hslVar("--primary"),
        "primary-foreground": hslVar("--primary-foreground"),
        secondary: hslVar("--secondary"),
        "secondary-foreground": hslVar("--secondary-foreground"),
        accent: hslVar("--accent"),
        "accent-foreground": hslVar("--accent-foreground"),
        destructive: hslVar("--destructive"),
        "destructive-foreground": hslVar("--destructive-foreground"),
        success: hslVar("--success"),
        "success-foreground": hslVar("--success-foreground"),
        warning: hslVar("--warning"),
        "warning-foreground": hslVar("--warning-foreground"),
        "chart-1": hslVar("--chart-1"),
        "chart-2": hslVar("--chart-2"),
        "chart-3": hslVar("--chart-3"),
        "chart-4": hslVar("--chart-4"),
        "chart-5": hslVar("--chart-5"),
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
        "status-ping": {
          "0%": { opacity: "0.75", transform: "scale(1)" },
          "100%": { opacity: "0", transform: "scale(2.2)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "status-ping": "status-ping 1s cubic-bezier(0.31, 0.1, 0.08, 0.96) infinite",
      },
    },
  },
};
