import { App, PluginSettingTab, Setting } from "obsidian";
import FileTitleUpdaterPlugin from "./main";
import { TitleSource, IllegalCharacterHandling, SyncMode } from "./settings";

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
            .setName("Sync mode")
            .setDesc(
                "Choose which title locations to sync (which of the three title places to update)",
            )
            .addDropdown((dropdown) =>
                dropdown
                    .addOption(
                        SyncMode.ALL,
                        "All (Filename + Frontmatter + Heading)",
                    )
                    .addOption(
                        SyncMode.FILENAME_FRONTMATTER,
                        "Filename + Frontmatter",
                    )
                    .addOption(SyncMode.FILENAME_HEADING, "Filename + Heading")
                    .addOption(
                        SyncMode.FRONTMATTER_HEADING,
                        "Frontmatter + Heading",
                    )
                    .setValue(this.plugin.settings.syncMode)
                    .onChange(async (value: SyncMode) => {
                        this.plugin.settings.syncMode = value;
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

        // Notifications section
        new Setting(containerEl).setName("Notifications").setHeading();

        // Desktop Notification Preference
        new Setting(containerEl)
            .setName("Notification preference")
            .setDesc(
                "Choose when to show notifications for sync operations. 'All' shows notifications for both successful syncs and errors. 'Errors only' shows notifications only when sync operations fail. 'None' suppresses all sync notifications.",
            )
            .addDropdown((dropdown) =>
                dropdown
                    .addOption("all", "All notifications")
                    .addOption("errors", "Errors only")
                    .addOption("none", "No notifications")
                    .setValue(this.plugin.settings.notificationPreference)
                    .onChange(async (value: "all" | "errors" | "none") => {
                        this.plugin.settings.notificationPreference = value;
                        await this.plugin.saveSettings();
                    }),
            );

        // Mobile Notification Preference
        new Setting(containerEl)
            .setName("Mobile notification preference")
            .setDesc(
                "Override notification preference specifically for mobile devices. Leave as 'Same as desktop' to use the same setting as above, or choose a different preference for mobile use.",
            )
            .addDropdown((dropdown) =>
                dropdown
                    .addOption("null", "Same as desktop")
                    .addOption("all", "All notifications")
                    .addOption("errors", "Errors only")
                    .addOption("none", "No notifications")
                    .setValue(
                        this.plugin.settings.mobileNotificationPreference?.toString() ||
                            "null",
                    )
                    .onChange(async (value: string) => {
                        this.plugin.settings.mobileNotificationPreference =
                            value === "null"
                                ? null
                                : (value as "all" | "errors" | "none");
                        await this.plugin.saveSettings();
                    }),
            );
    }
}
