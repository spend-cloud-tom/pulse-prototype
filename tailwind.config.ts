import type { Config } from "tailwindcss";

/* ═══════════════════════════════════════════════════════════════════════════
   PULSE TAILWIND CONFIG — Refactoring UI + Regelarm Typography System
   ═══════════════════════════════════════════════════════════════════════════ */

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    /* ─── Strict Type Scale (rem mapped to px) ─── */
    fontSize: {
      'xs': ['0.75rem', { lineHeight: '1.5' }],      // 12px
      'sm': ['0.875rem', { lineHeight: '1.5' }],     // 14px
      'base': ['1rem', { lineHeight: '1.5' }],       // 16px
      'lg': ['1.125rem', { lineHeight: '1.5' }],     // 18px
      'xl': ['1.25rem', { lineHeight: '1.4' }],      // 20px
      '2xl': ['1.5rem', { lineHeight: '1.15', letterSpacing: '-0.02em' }],    // 24px
      '3xl': ['1.875rem', { lineHeight: '1.15', letterSpacing: '-0.02em' }],  // 30px
      '4xl': ['2.25rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }],    // 36px
    },
    /* ─── Font Weights ─── */
    fontWeight: {
      'thin': '100',
      'extralight': '200',
      'light': '300',
      'normal': '400',
      'medium': '500',
      'semibold': '600',
      'bold': '700',
      'extrabold': '800',
      'black': '900',
    },
    extend: {
      fontFamily: {
        /* Display/Friendly: Nunito for headings, buttons, conversational UI */
        display: ['Nunito', 'Quicksand', 'Varela Round', 'system-ui', 'sans-serif'],
        /* UI/Data: System stack for tables, forms, dense data */
        sans: ['-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
        ui: ['-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
      },
      /* ─── Letter Spacing ─── */
      letterSpacing: {
        'tighter': '-0.02em',   // For large headings
        'tight': '-0.01em',     // For medium headings
        'normal': '0',
        'wide': '0.05em',       // For all-caps/overlines
      },
      /* ─── Line Height ─── */
      lineHeight: {
        'tight': '1.15',        // Large headings
        'snug': '1.25',         // Medium headings
        'normal': '1.5',        // Body text
        'relaxed': '1.625',
      },
      colors: {
        /* Text Color Hierarchy (3-tier system) */
        'text-hierarchy': {
          'primary': 'hsl(212, 20%, 15%)',
          'secondary': 'hsl(212, 15%, 45%)',
          'tertiary': 'hsl(212, 10%, 65%)',
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        signal: {
          green: "hsl(var(--signal-green))",
          amber: "hsl(var(--signal-amber))",
          red: "hsl(var(--signal-red))",
          "green-bg": "hsl(var(--signal-green-bg))",
          "amber-bg": "hsl(var(--signal-amber-bg))",
          "red-bg": "hsl(var(--signal-red-bg))",
        },
        /* Action-State Color System */
        state: {
          decision: "hsl(var(--state-decision))",
          "decision-bg": "hsl(var(--state-decision-bg))",
          blocked: "hsl(var(--state-blocked))",
          "blocked-bg": "hsl(var(--state-blocked-bg))",
          risk: "hsl(var(--state-risk))",
          "risk-bg": "hsl(var(--state-risk-bg))",
          resolved: "hsl(var(--state-resolved))",
          "resolved-bg": "hsl(var(--state-resolved-bg))",
        },
        hero: {
          teal: "hsl(var(--hero-teal))",
          purple: "hsl(var(--hero-purple))",
          coral: "hsl(var(--hero-coral))",
          "teal-soft": "hsl(var(--hero-teal-soft))",
          "purple-soft": "hsl(var(--hero-purple-soft))",
        },
        banner: {
          DEFAULT: "hsl(var(--banner-bg))",
          foreground: "hsl(var(--banner-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
