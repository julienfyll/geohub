export type MapStyleTheme = "dark" | "satellite" | "light";

export interface GameSettings {
  mapTheme: MapStyleTheme;
  showBorders: boolean;
  showAutocompleteDropdown: boolean;
  preferFrenchNames: boolean;
  showDirectionHints: boolean;
  autoAdvance: boolean;
}

export const DEFAULT_SETTINGS: GameSettings = {
  mapTheme: "dark",
  showBorders: true,
  showAutocompleteDropdown: true,
  preferFrenchNames: true,
  showDirectionHints: true,
  autoAdvance: false,
};
