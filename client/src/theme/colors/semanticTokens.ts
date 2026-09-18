import { darkColors } from './dark';
import { solarizedLightColors } from './solarizedLight';
import { ThemeColors } from '../types';

type ColorTokenMap = {
    [K in keyof ThemeColors]: {
        value: {
            _light: string;
            _dark: string;
        };
    };
};

const createColorTokens = (): ColorTokenMap => {
    const keys = Object.keys(darkColors) as (keyof ThemeColors)[];
    const tokens = {} as ColorTokenMap;

    for (const key of keys) {
        tokens[key] = {
            value: {
                _light: solarizedLightColors[key],
                _dark: darkColors[key],
            },
        };
    }

    return tokens;
};

export const semanticColorTokens = {
    ...createColorTokens(),
    border: {
        DEFAULT: { value: "{colors.border_primary}" },
        muted: { value: "{colors.border_primary}" },
        subtle: { value: "{colors.border_primary}" },
    },
    bg: {
        DEFAULT: { value: "{colors.background_main}" },
        subtle: { value: "{colors.background_secondary}" },
        muted: { value: "{colors.background_primary}" },
        panel: { value: "{colors.background_primary}" },
    },
    fg: {
        DEFAULT: { value: "{colors.text_primary}" },
        muted: { value: "{colors.text_secondary}" },
        subtle: { value: "{colors.text_secondary}" },
    },
};
