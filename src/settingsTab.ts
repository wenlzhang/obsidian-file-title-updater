import { App, PluginSettingTab, Setting } from 'obsidian';
import type MyPlugin from './main';

export class SettingsTab extends PluginSettingTab {
    plugin: MyPlugin;

    constructor(app: App, plugin: MyPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();

        containerEl.createEl('h2', { text: 'Plugin Settings' });

        new Setting(containerEl)
            .setName('Example Setting')
            .setDesc('This is an example setting')
            .addText(text => text
                .setPlaceholder('Enter your setting')
                .setValue(this.plugin.settings.exampleSetting)
                .onChange(async (value) => {
                    this.plugin.settings.exampleSetting = value;
                    await this.plugin.saveSettings();
                }));
    }
}
