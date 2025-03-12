import {
    Plugin,
    TFile,
    Notice,
    Editor,
    MarkdownView,
    FrontMatterCache,
    getFrontMatterInfo,
    parseYaml,
    stringifyYaml
} from "obsidian";
import { SettingsTab } from "./settingsTab";
import {
    PluginSettings,
    DEFAULT_SETTINGS,
    TitleSource,
    IllegalCharacterHandling,
} from "./settings";

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
            checkCallback: (checking: boolean) => {
                const activeFile = this.app.workspace.getActiveFile();
                if (activeFile) {
                    if (!checking) {
                        this.syncTitlesWithDefault();
                    }
                    return true;
                }
                return false;
            }
        });

        // Command to sync titles using filename as source
        this.addCommand({
            id: "sync-titles-from-filename",
            name: "Sync titles using filename as source",
            checkCallback: (checking: boolean) => {
                const activeFile = this.app.workspace.getActiveFile();
                if (activeFile) {
                    if (!checking) {
                        this.syncTitles(TitleSource.FILENAME);
                    }
                    return true;
                }
                return false;
            }
        });

        // Command to sync titles using frontmatter as source
        this.addCommand({
            id: "sync-titles-from-frontmatter",
            name: "Sync titles using frontmatter as source",
            checkCallback: (checking: boolean) => {
                const activeFile = this.app.workspace.getActiveFile();
                if (activeFile) {
                    if (!checking) {
                        this.syncTitles(TitleSource.FRONTMATTER);
                    }
                    return true;
                }
                return false;
            }
        });

        // Command to sync titles using heading as source
        this.addCommand({
            id: "sync-titles-from-heading",
            name: "Sync titles using first heading as source",
            checkCallback: (checking: boolean) => {
                const activeFile = this.app.workspace.getActiveFile();
                if (activeFile) {
                    if (!checking) {
                        this.syncTitles(TitleSource.HEADING);
                    }
                    return true;
                }
                return false;
            }
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
            // Check if all titles are already the same
            if (await this.areTitlesAlreadySynchronized(activeFile)) {
                new Notice("All titles are already synchronized");
                return;
            }

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

    async areTitlesAlreadySynchronized(file: TFile): Promise<boolean> {
        // Get filename
        const filename = file.basename;

        // Get frontmatter title
        const frontmatter =
            this.app.metadataCache.getFileCache(file)?.frontmatter;
        const frontmatterTitle = frontmatter?.title;

        // If no frontmatter title, they can't all be the same
        if (!frontmatterTitle) {
            return false;
        }

        // Get heading title using MetadataCache instead of regex
        const headings = this.app.metadataCache.getFileCache(file)?.headings;
        const topLevelHeading = headings?.find(h => h.level === 1);
        const headingTitle = topLevelHeading?.heading;

        // If no heading, they can't all be the same
        if (!headingTitle) {
            return false;
        }

        // Check if all three titles are the same
        return (
            filename === frontmatterTitle && frontmatterTitle === headingTitle
        );
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

        // When syncing from frontmatter to filename, we need to sanitize the title
        // for illegal characters that aren't allowed in filenames
        const sanitizedTitle = this.sanitizeFilename(title);

        // Check if sanitization changed the title
        if (sanitizedTitle !== title) {
            // If we should update all titles with the sanitized version
            if (this.settings.updateOtherTitlesWithSanitizedVersion) {
                new Notice(
                    `Title contains illegal characters. All titles will be updated with the sanitized version: "${sanitizedTitle}"`,
                );
                await this.updateAllTitles(file, sanitizedTitle);
            } else {
                new Notice(
                    `Title contains illegal characters. Filename will be sanitized to: "${sanitizedTitle}"`,
                );
                // Update filename with sanitized version, but keep original in frontmatter and heading
                await this.updateFilename(file, sanitizedTitle);
                await this.updateFrontmatterAndHeading(file, title);
            }
        } else {
            // No illegal characters, proceed normally
            await this.updateAllTitles(file, title);
        }
    }

    async syncFromHeading(file: TFile) {
        // Get heading title using MetadataCache instead of regex
        const headings = this.app.metadataCache.getFileCache(file)?.headings;
        const topLevelHeading = headings?.find(h => h.level === 1);
        const headingTitle = topLevelHeading?.heading;

        if (!headingTitle) {
            throw new Error(
                "No level 1 heading found in the file. Please add a level 1 heading or use another source for synchronization."
            );
        }

        const title = headingTitle;

        // When syncing from heading to filename, we need to sanitize the title
        // for illegal characters that aren't allowed in filenames
        const sanitizedTitle = this.sanitizeFilename(title);

        // Check if sanitization changed the title
        if (sanitizedTitle !== title) {
            // If we should update all titles with the sanitized version
            if (this.settings.updateOtherTitlesWithSanitizedVersion) {
                new Notice(
                    `Title contains illegal characters. All titles will be updated with the sanitized version: "${sanitizedTitle}"`,
                );
                await this.updateAllTitles(file, sanitizedTitle);
            } else {
                new Notice(
                    `Title contains illegal characters. Filename will be sanitized to: "${sanitizedTitle}"`,
                );
                // Update filename with sanitized version, but keep original in frontmatter and heading
                await this.updateFilename(file, sanitizedTitle);
                await this.updateFrontmatterAndHeading(file, title);
            }
        } else {
            // No illegal characters, proceed normally
            await this.updateAllTitles(file, title);
        }
    }

    /**
     * Sanitize a title for use as a filename by removing or replacing illegal characters
     * according to the user's settings
     */
    sanitizeFilename(title: string): string {
        // Obsidian doesn't allow these characters in filenames:
        // / \ : * ? " < > |
        const illegalCharsRegex = /[\/\\:*?"<>|#^[\]]/g;

        // Check if the title contains illegal characters
        if (!illegalCharsRegex.test(title)) {
            return title;
        }

        // Handle illegal characters based on user settings
        switch (this.settings.illegalCharHandling) {
            case IllegalCharacterHandling.REMOVE:
                return title.replace(illegalCharsRegex, "");

            case IllegalCharacterHandling.REPLACE_WITH_SPACE:
                return title.replace(illegalCharsRegex, " ");

            case IllegalCharacterHandling.REPLACE_WITH_DASH:
                return title.replace(illegalCharsRegex, "-");

            case IllegalCharacterHandling.REPLACE_WITH_UNDERSCORE:
                return title.replace(illegalCharsRegex, "_");

            case IllegalCharacterHandling.CUSTOM: {
                const replacement = this.settings.customReplacement || "";
                return title.replace(illegalCharsRegex, replacement);
            }

            default:
                return title.replace(illegalCharsRegex, "");
        }
    }

    async updateAllTitles(file: TFile, title: string) {
        // Update filename (if different)
        await this.updateFilename(file, title);

        // Update file contents (frontmatter and heading)
        await this.updateFrontmatterAndHeading(file, title);
    }

    async updateFilename(file: TFile, title: string) {
        if (file.basename !== title) {
            await this.app.fileManager.renameFile(
                file,
                `${file.parent?.path ? file.parent.path + "/" : ""}${title}${file.extension ? "." + file.extension : ""}`,
            );
        }
    }

    async updateFrontmatterAndHeading(file: TFile, title: string) {
        await this.app.vault.process(file, (fileContents) => {
            return this.updateFileContents(fileContents, title);
        });
    }

    updateFileContents(content: string, title: string): string {
        let updatedContent = content;

        // Use getFrontMatterInfo to get information about frontmatter
        const frontMatterInfo = getFrontMatterInfo(updatedContent);
        const hasFrontMatter = frontMatterInfo.exists;

        if (hasFrontMatter) {
            // Get the frontmatter content
            const yaml = frontMatterInfo.frontmatter;
            
            try {
                // Parse the YAML frontmatter
                const frontmatter = parseYaml(yaml) || {};
                
                // Update the title property
                frontmatter.title = title;
                
                // Convert back to YAML string
                const updatedFrontmatter = stringifyYaml(frontmatter);
                
                // Replace the frontmatter in the content
                updatedContent = updatedContent.substring(0, frontMatterInfo.from) + 
                                updatedFrontmatter + 
                                updatedContent.substring(frontMatterInfo.to);
            } catch (e) {
                // Fallback to regex if YAML parsing fails
                console.error("Error parsing frontmatter:", e);
                const titleRegex = /^title:\s*(.*)$/m;
                const titleMatch = yaml.match(titleRegex);

                if (titleMatch) {
                    // Update existing title in frontmatter
                    const updatedFrontmatter = yaml.replace(
                        titleRegex,
                        `title: ${title}`
                    );
                    
                    // Replace the frontmatter in the content
                    updatedContent = updatedContent.substring(0, frontMatterInfo.from) + 
                                    updatedFrontmatter + 
                                    updatedContent.substring(frontMatterInfo.to);
                } else {
                    // Add title to existing frontmatter
                    const updatedFrontmatter = `title: ${title}\n${yaml}`;
                    
                    // Replace the frontmatter in the content
                    updatedContent = updatedContent.substring(0, frontMatterInfo.from) + 
                                    updatedFrontmatter + 
                                    updatedContent.substring(frontMatterInfo.to);
                }
            }
        } else {
            // Add new frontmatter with title
            const frontmatter = { title: title };
            const yaml = stringifyYaml(frontmatter);
            updatedContent = `---\n${yaml}---\n\n${updatedContent}`;
        }

        // Update or add first level 1 heading
        const headingRegex = /^#\s+(.+)$/m;
        const headingMatch = updatedContent.match(headingRegex);

        if (headingMatch) {
            // Update existing heading
            updatedContent = updatedContent.replace(headingRegex, `# ${title}`);
        } else {
            // Add heading after frontmatter
            if (hasFrontMatter) {
                // Get the updated frontmatter info after our changes
                const updatedFrontMatterInfo = getFrontMatterInfo(updatedContent);
                
                // contentStart is the position where the content starts after the frontmatter block
                const contentStartPos = updatedFrontMatterInfo.contentStart;
                
                // Check if there's content after frontmatter
                const afterFrontmatter = updatedContent
                    .substring(contentStartPos)
                    .trim();

                if (afterFrontmatter.length > 0) {
                    // Insert heading between frontmatter and content with exactly one empty line
                    updatedContent =
                        updatedContent.substring(0, contentStartPos) +
                        `\n# ${title}\n\n` +
                        afterFrontmatter;
                } else {
                    // Just add heading after frontmatter with exactly one empty line
                    updatedContent =
                        updatedContent.substring(0, contentStartPos) +
                        `\n# ${title}`;
                }

                // Fix any potential multiple empty lines between frontmatter and heading
                updatedContent = updatedContent.replace(
                    /---\s*\n\s*\n+/g,
                    "---\n\n"
                );
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
