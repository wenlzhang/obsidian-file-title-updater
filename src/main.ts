import {
    Plugin,
    TFile,
    Notice,
    Editor,
    MarkdownView,
    FrontMatterCache,
} from "obsidian";
import { SettingsTab } from "./settingsTab";
import { PluginSettings, DEFAULT_SETTINGS, TitleSource } from "./settings";

export default class FileTitleUpdaterPlugin extends Plugin {
    settings: PluginSettings;

    async onload() {
        await this.loadSettings();

        // Add settings tab
        this.addSettingTab(new SettingsTab(this.app, this));

        // Command to sync titles based on default source
        this.addCommand({
            id: "sync-titles-default",
            name: "Sync titles using default source",
            callback: () => this.syncTitlesWithDefault(),
        });

        // Command to sync titles using filename as source
        this.addCommand({
            id: "sync-titles-from-filename",
            name: "Sync titles using filename as source",
            callback: () => this.syncTitles(TitleSource.FILENAME),
        });

        // Command to sync titles using frontmatter as source
        this.addCommand({
            id: "sync-titles-from-frontmatter",
            name: "Sync titles using frontmatter as source",
            callback: () => this.syncTitles(TitleSource.FRONTMATTER),
        });

        // Command to sync titles using heading as source
        this.addCommand({
            id: "sync-titles-from-heading",
            name: "Sync titles using first heading as source",
            callback: () => this.syncTitles(TitleSource.HEADING),
        });
    }

    onunload() {
        // Cleanup when the plugin is disabled
    }

    async loadSettings() {
        this.settings = Object.assign(
            {},
            DEFAULT_SETTINGS,
            await this.loadData(),
        );
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }

    syncTitlesWithDefault() {
        this.syncTitles(this.settings.defaultTitleSource);
    }

    async syncTitles(source: TitleSource) {
        const activeFile = this.app.workspace.getActiveFile();
        if (!activeFile) {
            new Notice("No active file");
            return;
        }

        try {
            switch (source) {
                case TitleSource.FILENAME:
                    await this.syncFromFilename(activeFile);
                    break;
                case TitleSource.FRONTMATTER:
                    await this.syncFromFrontmatter(activeFile);
                    break;
                case TitleSource.HEADING:
                    await this.syncFromHeading(activeFile);
                    break;
            }
            new Notice("Titles synchronized successfully");
        } catch (error) {
            new Notice(`Error synchronizing titles: ${error.message}`);
            console.error("Error synchronizing titles:", error);
        }
    }

    async syncFromFilename(file: TFile) {
        const filename = file.basename;
        await this.updateAllTitles(file, filename);
    }

    async syncFromFrontmatter(file: TFile) {
        const frontmatter =
            this.app.metadataCache.getFileCache(file)?.frontmatter;
        if (!frontmatter || !frontmatter.title) {
            throw new Error("No title found in frontmatter");
        }

        const title = frontmatter.title;
        await this.updateAllTitles(file, title);
    }

    async syncFromHeading(file: TFile) {
        const fileContents = await this.app.vault.read(file);
        const headingMatch = fileContents.match(/^#\s+(.+)$/m);

        if (!headingMatch) {
            throw new Error(
                "No level 1 heading found in the file. Please add a level 1 heading or use another source for synchronization.",
            );
        }

        const title = headingMatch[1];
        await this.updateAllTitles(file, title);
    }

    async updateAllTitles(file: TFile, title: string) {
        // Update filename (if different)
        if (file.basename !== title) {
            await this.app.fileManager.renameFile(
                file,
                `${file.parent?.path ? file.parent.path + "/" : ""}${title}${file.extension ? "." + file.extension : ""}`,
            );
        }

        // Update file contents (frontmatter and heading)
        const fileContents = await this.app.vault.read(file);
        const updatedContents = this.updateFileContents(fileContents, title);

        if (fileContents !== updatedContents) {
            await this.app.vault.modify(file, updatedContents);
        }
    }

    updateFileContents(content: string, title: string): string {
        let updatedContent = content;

        // Update frontmatter title
        const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n/;
        const frontmatterMatch = content.match(frontmatterRegex);

        if (frontmatterMatch) {
            const frontmatter = frontmatterMatch[1];
            const titleRegex = /^title:\s*(.*)$/m;
            const titleMatch = frontmatter.match(titleRegex);

            if (titleMatch) {
                // Update existing title
                updatedContent = updatedContent.replace(
                    titleRegex,
                    `title: ${title}`,
                );
            } else {
                // Add title to existing frontmatter
                updatedContent = updatedContent.replace(
                    frontmatterRegex,
                    `---\ntitle: ${title}\n$1\n---\n`,
                );
            }
        } else {
            // Add new frontmatter with title
            updatedContent = `---\ntitle: ${title}\n---\n\n${updatedContent}`;
        }

        // Update or add first level 1 heading
        const headingRegex = /^#\s+(.+)$/m;
        const headingMatch = updatedContent.match(headingRegex);

        if (headingMatch) {
            // Update existing heading
            updatedContent = updatedContent.replace(headingRegex, `# ${title}`);
        } else {
            // Add heading after frontmatter
            const frontmatterEndMatch = updatedContent.match(
                /^---\s*\n[\s\S]*?\n---\s*\n/,
            );

            if (frontmatterEndMatch) {
                const frontmatterEnd = frontmatterEndMatch[0];
                const frontmatterEndPos =
                    updatedContent.indexOf(frontmatterEnd) +
                    frontmatterEnd.length;

                // Check if there's content after frontmatter
                const afterFrontmatter = updatedContent
                    .substring(frontmatterEndPos)
                    .trim();

                if (afterFrontmatter.length > 0) {
                    // Insert heading between frontmatter and content
                    updatedContent =
                        updatedContent.substring(0, frontmatterEndPos) +
                        `\n# ${title}\n\n` +
                        afterFrontmatter;
                } else {
                    // Just add heading after frontmatter
                    updatedContent =
                        updatedContent.substring(0, frontmatterEndPos) +
                        `\n# ${title}\n`;
                }
            } else {
                // No frontmatter, add heading at the beginning
                const contentTrimmed = updatedContent.trim();
                if (contentTrimmed.length > 0) {
                    updatedContent = `# ${title}\n\n${contentTrimmed}`;
                } else {
                    updatedContent = `# ${title}`;
                }
            }
        }

        return updatedContent;
    }
}
