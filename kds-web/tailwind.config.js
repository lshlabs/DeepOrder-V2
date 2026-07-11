/** @type {import('tailwindcss').Config} */
const hslVar = (name) => `hsl(var(${name}) / <alpha-value>)`;

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  corePlugins: {
    // Keep preflight off until legacy element selectors in base.css/feature CSS are retired.
    preflight: false,
  },
  theme: {
    extend: {
      colors: {
        background: hslVar("--kds-ui-background"),
        foreground: hslVar("--kds-ui-foreground"),
        card: hslVar("--kds-ui-card"),
        "card-foreground": hslVar("--kds-ui-card-foreground"),
        popover: hslVar("--kds-ui-popover"),
        "popover-foreground": hslVar("--kds-ui-popover-foreground"),
        border: hslVar("--kds-ui-border"),
        input: hslVar("--kds-ui-input"),
        ring: hslVar("--kds-ui-ring"),
        muted: hslVar("--kds-ui-muted"),
        "muted-foreground": hslVar("--kds-ui-muted-foreground"),
        primary: hslVar("--kds-ui-primary"),
        "primary-foreground": hslVar("--kds-ui-primary-foreground"),
        secondary: hslVar("--kds-ui-secondary"),
        "secondary-foreground": hslVar("--kds-ui-secondary-foreground"),
        accent: hslVar("--kds-ui-accent"),
        "accent-foreground": hslVar("--kds-ui-accent-foreground"),
        destructive: hslVar("--kds-ui-destructive"),
        "destructive-foreground": hslVar("--kds-ui-destructive-foreground"),
      },
      borderRadius: {
        lg: "var(--kds-ui-radius)",
        md: "calc(var(--kds-ui-radius) - 2px)",
        sm: "calc(var(--kds-ui-radius) - 4px)",
      },
    },
  },
};
