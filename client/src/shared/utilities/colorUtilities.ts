/**
 * Utility functions for color parsing and accessible tag/badge styling
 * across Light and Dark themes.
 */

export interface RgbColor {
    r: number;
    g: number;
    b: number;
}

export interface HslColor {
    h: number;
    s: number;
    l: number;
}

export function parseHexToRgb(hex: string): RgbColor | null {
    if (!hex) return null;
    let clean = hex.replace('#', '').trim();
    if (clean.length === 3) {
        clean = clean.split('').map(c => c + c).join('');
    }
    if (clean.length >= 6) {
        const r = parseInt(clean.substring(0, 2), 16);
        const g = parseInt(clean.substring(2, 4), 16);
        const b = parseInt(clean.substring(4, 6), 16);
        if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
            return { r, g, b };
        }
    }
    return null;
}

export function rgbToHsl(r: number, g: number, b: number): HslColor {
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r:
                h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
                break;
            case g:
                h = ((b - r) / d + 2) / 6;
                break;
            case b:
                h = ((r - g) / d + 4) / 6;
                break;
        }
    }
    return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

export function hslToHex(h: number, s: number, l: number): string {
    s /= 100;
    l /= 100;
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = l - c / 2;
    let r = 0, g = 0, b = 0;

    if (0 <= h && h < 60) {
        r = c; g = x; b = 0;
    } else if (60 <= h && h < 120) {
        r = x; g = c; b = 0;
    } else if (120 <= h && h < 180) {
        r = 0; g = c; b = x;
    } else if (180 <= h && h < 240) {
        r = 0; g = x; b = c;
    } else if (240 <= h && h < 300) {
        r = x; g = 0; b = c;
    } else if (300 <= h && h <= 360) {
        r = c; g = 0; b = x;
    }

    const toHex = (n: number) => {
        const hex = Math.round((n + m) * 255).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    };

    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export interface TagVisualStyles {
    bg: string;
    color: string;
    border: string;
    outline: string;
    dotColor: string;
}

export function getAccessibleTagStyles(
    colorHex: string | undefined,
    theme: 'light' | 'dark',
    isSelected?: boolean
): TagVisualStyles {
    if (!colorHex) {
        return {
            bg: isSelected ? 'var(--chakra-colors-action_primary)' : 'transparent',
            color: isSelected ? '#ffffff' : 'var(--chakra-colors-text_primary)',
            border: isSelected
                ? '1px solid var(--chakra-colors-action_primary)'
                : '1px solid var(--chakra-colors-border_primary)',
            outline: isSelected ? '1px solid var(--chakra-colors-action_primary)' : 'none',
            dotColor: 'var(--chakra-colors-action_primary)',
        };
    }

    const rgb = parseHexToRgb(colorHex);
    if (!rgb) {
        return {
            bg: `${colorHex}25`,
            color: colorHex,
            border: `1px solid ${colorHex}50`,
            outline: isSelected ? `2px solid ${colorHex}` : 'none',
            dotColor: colorHex,
        };
    }

    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);

    if (theme === 'light') {
        // Light Theme: Ensure text is dark and contrasty
        // Yellows and Greens need extra low lightness (<= 24%) because human eyes perceive them as brighter
        const maxLightness = (hsl.h >= 35 && hsl.h <= 165) ? 22 : 30;
        const textLightness = Math.min(hsl.l, maxLightness);
        const textSaturation = Math.max(hsl.s, 45);
        const textColor = hslToHex(hsl.h, textSaturation, textLightness);

        // Visible background tint & border
        const bgOpacity = isSelected ? '0.24' : '0.12';
        const bg = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${bgOpacity})`;

        const borderOpacity = isSelected ? '0.7' : '0.35';
        const border = `1px solid rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${borderOpacity})`;
        const outline = isSelected ? `2px solid ${textColor}` : 'none';

        return {
            bg,
            color: textColor,
            border,
            outline,
            dotColor: colorHex,
        };
    } else {
        // Dark Theme: Ensure text is bright enough on dark background
        const minLightness = 65;
        const textLightness = Math.max(hsl.l, minLightness);
        const textColor = hslToHex(hsl.h, hsl.s, textLightness);

        const bgOpacity = isSelected ? '0.32' : '0.16';
        const bg = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${bgOpacity})`;

        const borderOpacity = isSelected ? '0.8' : '0.4';
        const border = `1px solid rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${borderOpacity})`;
        const outline = isSelected ? `2px solid ${textColor}` : 'none';

        return {
            bg,
            color: textColor,
            border,
            outline,
            dotColor: colorHex,
        };
    }
}
