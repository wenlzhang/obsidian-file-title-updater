import { Plugin } from 'obsidian';
import { SettingsTab } from './settingsTab';
import { PluginSettings, DEFAULT_SETTINGS } from './settings';

export default class MyPlugin extends Plugin {
    settings: PluginSettings;

    async onload() {
        await this.loadSettings();

        // Add settings tab
        this.addSettingTab(new SettingsTab(this.app, this));

        // Add your plugin's functionality here
        // For example:
        // this.addCommand({
        //     id: 'example-command',
        //     name: 'Example Command',
        //     callback: () => {
        //         // Command logic
        //     }
        // });
    }

    onunload() {
        // Cleanup when the plugin is disabled
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }
}
