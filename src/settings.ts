import { App } from 'obsidian';

export interface PluginSettings {
    // Add your settings properties here
    exampleSetting: string;
}

export const DEFAULT_SETTINGS: PluginSettings = {
    exampleSetting: 'default'
};
