import { App } from 'obsidian';

export enum TitleSource {
    FILENAME = 'filename',
    FRONTMATTER = 'frontmatter',
    HEADING = 'heading'
}

export interface PluginSettings {
    defaultTitleSource: TitleSource;
}

export const DEFAULT_SETTINGS: PluginSettings = {
    defaultTitleSource: TitleSource.FILENAME
};
