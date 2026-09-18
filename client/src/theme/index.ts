import { createSystem, defaultConfig } from "@chakra-ui/react";
import { semanticColorTokens } from "./colors/semanticTokens";
import { recipes, slotRecipes } from "./recipes";

export const appTheme = createSystem(defaultConfig, {
    theme: {
        semanticTokens: {
            colors: semanticColorTokens,
        },
        recipes,
        slotRecipes,
    },
});

// Alias for backwards compatibility
export const darkTheme = appTheme;

export * from "./types";
export * from "./colors/dark";
export * from "./colors/solarizedLight";
