import { App, PluginSettingTab, Setting, DropdownComponent } from 'obsidian';
import type FileTitleUpdaterPlugin from './main';
import { TitleSource } from './settings';

export class SettingsTab extends PluginSettingTab {
    plugin: FileTitleUpdaterPlugin;

    constructor(app: App, plugin: FileTitleUpdaterPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();

        containerEl.createEl('h2', { text: 'File title updater settings' });

        new Setting(containerEl)
            .setName('Default title source')
            .setDesc('Choose which source should be used as the default when syncing titles')
            .addDropdown((dropdown: DropdownComponent) => {
                dropdown
                    .addOption(TitleSource.FILENAME, 'Filename')
                    .addOption(TitleSource.FRONTMATTER, 'Frontmatter title')
                    .addOption(TitleSource.HEADING, 'First heading')
                    .setValue(this.plugin.settings.defaultTitleSource)
                    .onChange(async (value: TitleSource) => {
                        this.plugin.settings.defaultTitleSource = value;
                        await this.plugin.saveSettings();
                    });
            });
    }
}
