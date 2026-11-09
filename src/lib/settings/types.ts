export interface GameSettings {
  showBorders: boolean;
  showAutocompleteDropdown: boolean;
  preferFrenchNames: boolean;
  showDirectionHints: boolean;
  autoAdvance: boolean;
}

export const DEFAULT_SETTINGS: GameSettings = {
  showBorders: true,
  showAutocompleteDropdown: true,
  preferFrenchNames: true,
  showDirectionHints: true,
  autoAdvance: false,
};
