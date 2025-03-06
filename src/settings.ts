import { App } from "obsidian";

export enum TitleSource {
    FILENAME = "filename",
    FRONTMATTER = "frontmatter",
    HEADING = "heading",
}

export enum IllegalCharacterHandling {
    REMOVE = "remove",
    REPLACE_WITH_SPACE = "replace_with_space",
    REPLACE_WITH_DASH = "replace_with_dash",
    REPLACE_WITH_UNDERSCORE = "replace_with_underscore",
    CUSTOM = "custom",
}

export interface PluginSettings {
    defaultTitleSource: TitleSource;
    illegalCharHandling: IllegalCharacterHandling;
    customReplacement: string;
    updateOtherTitlesWithSanitizedVersion: boolean;
}

export const DEFAULT_SETTINGS: PluginSettings = {
    defaultTitleSource: TitleSource.FILENAME,
    illegalCharHandling: IllegalCharacterHandling.REMOVE,
    customReplacement: "",
    updateOtherTitlesWithSanitizedVersion: false,
};
