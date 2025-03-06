import { App, PluginSettingTab, Setting } from "obsidian";
import FileTitleUpdaterPlugin from "./main";
import { TitleSource, IllegalCharacterHandling } from "./settings";

export class SettingsTab extends PluginSettingTab {
    plugin: FileTitleUpdaterPlugin;

    constructor(app: App, plugin: FileTitleUpdaterPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();

        new Setting(containerEl)
            .setName("Default title source")
            .setDesc(
                "Choose which source to use by default when synchronizing titles",
            )
            .addDropdown((dropdown) =>
                dropdown
                    .addOption(TitleSource.FILENAME, "Filename")
                    .addOption(TitleSource.FRONTMATTER, "Frontmatter title")
                    .addOption(TitleSource.HEADING, "First heading")
                    .setValue(this.plugin.settings.defaultTitleSource)
                    .onChange(async (value: TitleSource) => {
                        this.plugin.settings.defaultTitleSource = value;
                        await this.plugin.saveSettings();
                    }),
            );

        new Setting(containerEl)
            .setName("Illegal character handling")
            .setHeading();

        new Setting(containerEl)
            .setName("Illegal character handling")
            .setDesc(
                "Choose how to handle illegal characters when updating filenames",
            )
            .addDropdown((dropdown) =>
                dropdown
                    .addOption(
                        IllegalCharacterHandling.REMOVE,
                        "Remove illegal characters",
                    )
                    .addOption(
                        IllegalCharacterHandling.REPLACE_WITH_SPACE,
                        "Replace with space",
                    )
                    .addOption(
                        IllegalCharacterHandling.REPLACE_WITH_DASH,
                        "Replace with dash (-)",
                    )
                    .addOption(
                        IllegalCharacterHandling.REPLACE_WITH_UNDERSCORE,
                        "Replace with underscore (_)",
                    )
                    .addOption(
                        IllegalCharacterHandling.CUSTOM,
                        "Custom replacement",
                    )
                    .setValue(this.plugin.settings.illegalCharHandling)
                    .onChange(async (value: IllegalCharacterHandling) => {
                        this.plugin.settings.illegalCharHandling = value;

                        // Show/hide custom replacement setting based on selection
                        if (value === IllegalCharacterHandling.CUSTOM) {
                            customReplacementSetting.settingEl.style.display =
                                "block";
                        } else {
                            customReplacementSetting.settingEl.style.display =
                                "none";
                        }

                        await this.plugin.saveSettings();
                    }),
            );

        const customReplacementSetting = new Setting(containerEl)
            .setName("Custom replacement character")
            .setDesc(
                "Specify a custom character to replace illegal characters with",
            )
            .addText((text) =>
                text
                    .setValue(this.plugin.settings.customReplacement)
                    .onChange(async (value) => {
                        this.plugin.settings.customReplacement = value;
                        await this.plugin.saveSettings();
                    }),
            );

        // Initially hide/show based on current setting
        if (
            this.plugin.settings.illegalCharHandling !==
            IllegalCharacterHandling.CUSTOM
        ) {
            customReplacementSetting.settingEl.style.display = "none";
        }

        new Setting(containerEl)
            .setName("Update all titles with sanitized version")
            .setDesc(
                "When updating from frontmatter or heading to filename, also update the source with the sanitized version (without illegal characters)",
            )
            .addToggle((toggle) =>
                toggle
                    .setValue(
                        this.plugin.settings
                            .updateOtherTitlesWithSanitizedVersion,
                    )
                    .onChange(async (value) => {
                        this.plugin.settings.updateOtherTitlesWithSanitizedVersion =
                            value;
                        await this.plugin.saveSettings();
                    }),
            );
    }
}
