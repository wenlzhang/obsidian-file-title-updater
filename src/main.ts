import {
    Plugin,
    TFile,
    TFolder,
    Notice,
    Editor,
    MarkdownView,
    FrontMatterCache,
    getFrontMatterInfo,
    parseYaml,
    stringifyYaml,
} from "obsidian";
import { SettingsTab } from "./settingsTab";
import {
    PluginSettings,
    DEFAULT_SETTINGS,
    TitleSource,
    IllegalCharacterHandling,
    SyncMode,
} from "./settings";
import { NotificationHelper } from "./notificationHelper";

export default class FileTitleUpdaterPlugin extends Plugin {
    settings: PluginSettings;
    notificationHelper: NotificationHelper;

    async onload() {
        await this.loadSettings();

        // Initialize notification helper
        this.notificationHelper = new NotificationHelper(this.settings);

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
            },
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
            },
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
            },
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
            },
        });

        // Register folder context menu for bulk title updates
        this.registerEvent(
            this.app.workspace.on("file-menu", (menu, file) => {
                if (file instanceof TFolder) {
                    menu.addItem((item) => {
                        item.setTitle("Sync titles in folder (default source)")
                            .setIcon("sync")
                            .onClick(async () => {
                                await this.syncTitlesInFolder(
                                    file,
                                    this.settings.defaultTitleSource,
                                );
                            });
                    });

                    menu.addItem((item) => {
                        item.setTitle("Sync titles in folder (from filename)")
                            .setIcon("file-text")
                            .onClick(async () => {
                                await this.syncTitlesInFolder(
                                    file,
                                    TitleSource.FILENAME,
                                );
                            });
                    });

                    menu.addItem((item) => {
                        item.setTitle(
                            "Sync titles in folder (from frontmatter)",
                        )
                            .setIcon("tag")
                            .onClick(async () => {
                                await this.syncTitlesInFolder(
                                    file,
                                    TitleSource.FRONTMATTER,
                                );
                            });
                    });

                    menu.addItem((item) => {
                        item.setTitle("Sync titles in folder (from heading)")
                            .setIcon("heading")
                            .onClick(async () => {
                                await this.syncTitlesInFolder(
                                    file,
                                    TitleSource.HEADING,
                                );
                            });
                    });
                }
            }),
        );
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
        // Reinitialize notification helper with updated settings
        if (this.notificationHelper) {
            this.notificationHelper = new NotificationHelper(this.settings);
        }
    }

    async saveSettings() {
        await this.saveData(this.settings);
        // Reinitialize notification helper with updated settings
        this.notificationHelper = new NotificationHelper(this.settings);
    }

    syncTitlesWithDefault() {
        this.syncTitles(this.settings.defaultTitleSource);
    }

    async syncTitles(source: TitleSource) {
        const activeFile = this.app.workspace.getActiveFile();
        if (!activeFile) {
            this.notificationHelper.showError("No active file");
            return;
        }

        try {
            // Check if all titles that are set to be synced are already the same
            if (await this.areTitlesToSyncAlreadySynchronized(activeFile)) {
                this.notificationHelper.showInfo(
                    "All titles that should be synced are already synchronized",
                );
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
            this.notificationHelper.showSuccess(
                "Titles synchronized successfully",
            );
        } catch (error) {
            this.notificationHelper.showError(
                `Error synchronizing titles: ${error.message}`,
            );
            console.error("Error synchronizing titles:", error);
        }
    }

    async syncTitlesInFolder(folder: TFolder, source: TitleSource) {
        try {
            // Get all markdown files in the folder and its subfolders recursively
            const markdownFiles = this.getAllMarkdownFilesInFolder(folder);

            if (markdownFiles.length === 0) {
                this.notificationHelper.showInfo(
                    `No markdown files found in folder "${folder.name}"`,
                );
                return;
            }

            let processedCount = 0;
            let skippedCount = 0;
            let errorCount = 0;

            this.notificationHelper.showInfo(
                `Starting bulk title sync for ${markdownFiles.length} files in "${folder.name}"...`,
            );

            // Process each file
            for (const file of markdownFiles) {
                try {
                    // Check if titles are already synchronized for this file
                    if (await this.areTitlesToSyncAlreadySynchronized(file)) {
                        skippedCount++;
                        continue;
                    }

                    // Sync titles for this file using the same logic as single file sync
                    switch (source) {
                        case TitleSource.FILENAME:
                            await this.syncFromFilename(file);
                            break;
                        case TitleSource.FRONTMATTER:
                            await this.syncFromFrontmatter(file);
                            break;
                        case TitleSource.HEADING:
                            await this.syncFromHeading(file);
                            break;
                    }

                    processedCount++;
                } catch (error) {
                    errorCount++;
                    console.error(`Error processing file ${file.path}:`, error);
                }
            }

            // Show summary notification
            const summary = `Bulk sync completed: ${processedCount} updated, ${skippedCount} skipped, ${errorCount} errors`;
            if (errorCount > 0) {
                this.notificationHelper.showError(summary);
            } else {
                this.notificationHelper.showSuccess(summary);
            }
        } catch (error) {
            this.notificationHelper.showError(
                `Error during bulk title sync: ${error.message}`,
            );
            console.error("Error during bulk title sync:", error);
        }
    }

    getAllMarkdownFilesInFolder(folder: TFolder): TFile[] {
        const markdownFiles: TFile[] = [];

        // Recursively traverse the folder and collect all markdown files
        const traverse = (currentFolder: TFolder) => {
            for (const child of currentFolder.children) {
                if (child instanceof TFile && child.extension === "md") {
                    markdownFiles.push(child);
                } else if (child instanceof TFolder) {
                    traverse(child);
                }
            }
        };

        traverse(folder);
        return markdownFiles;
    }

    async areTitlesToSyncAlreadySynchronized(file: TFile): Promise<boolean> {
        // Get filename
        const filename = file.basename;

        // Get frontmatter title
        const frontmatter =
            this.app.metadataCache.getFileCache(file)?.frontmatter;
        const frontmatterTitle = frontmatter?.title;

        // Get heading title using MetadataCache
        const headings = this.app.metadataCache.getFileCache(file)?.headings;
        const topLevelHeading = headings?.find((h) => h.level === 1);
        const headingTitle = topLevelHeading?.heading;

        // Check based on sync mode
        switch (this.settings.syncMode) {
            case SyncMode.ALL:
                // Need both frontmatter and heading to exist
                if (!frontmatterTitle || !headingTitle) {
                    return false;
                }
                return (
                    filename === frontmatterTitle &&
                    frontmatterTitle === headingTitle
                );

            case SyncMode.FILENAME_FRONTMATTER:
                // Only need frontmatter to exist
                if (!frontmatterTitle) {
                    return false;
                }
                return filename === frontmatterTitle;

            case SyncMode.FILENAME_HEADING:
                // Only need heading to exist
                if (!headingTitle) {
                    return false;
                }
                return filename === headingTitle;

            case SyncMode.FRONTMATTER_HEADING:
                // Need both frontmatter and heading to exist
                if (!frontmatterTitle || !headingTitle) {
                    return false;
                }
                return frontmatterTitle === headingTitle;

            default:
                return false;
        }
    }

    async syncFromFilename(file: TFile) {
        const filename = file.basename;
        await this.updateTitlesBasedOnSyncMode(file, filename);
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
                this.notificationHelper.showInfo(
                    `Title contains illegal characters. All titles will be updated with the sanitized version: "${sanitizedTitle}"`,
                );
                await this.updateTitlesBasedOnSyncMode(file, sanitizedTitle);
            } else {
                this.notificationHelper.showInfo(
                    `Title contains illegal characters. Filename will be sanitized to: "${sanitizedTitle}"`,
                );
                // Only update filename with sanitized version if it's part of sync mode
                const shouldUpdateFilename =
                    this.settings.syncMode !== SyncMode.FRONTMATTER_HEADING;
                const shouldUpdateFrontmatter = this.shouldSyncFrontmatter();
                const shouldUpdateHeading = this.shouldSyncHeading();

                if (shouldUpdateFilename) {
                    await this.updateFilename(file, sanitizedTitle);
                }

                // Keep original in frontmatter and/or heading if they should be synced
                if (shouldUpdateFrontmatter || shouldUpdateHeading) {
                    await this.updateFrontmatterAndOrHeading(file, title);
                }
            }
        } else {
            // No illegal characters, proceed normally
            await this.updateTitlesBasedOnSyncMode(file, title);
        }
    }

    async syncFromHeading(file: TFile) {
        // Get heading title using MetadataCache instead of regex
        const headings = this.app.metadataCache.getFileCache(file)?.headings;
        const topLevelHeading = headings?.find((h) => h.level === 1);
        const headingTitle = topLevelHeading?.heading;

        if (!headingTitle) {
            throw new Error(
                "No level 1 heading found in the file. Please add a level 1 heading or use another source for synchronization.",
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
                this.notificationHelper.showInfo(
                    `Title contains illegal characters. All titles will be updated with the sanitized version: "${sanitizedTitle}"`,
                );
                await this.updateTitlesBasedOnSyncMode(file, sanitizedTitle);
            } else {
                this.notificationHelper.showInfo(
                    `Title contains illegal characters. Filename will be sanitized to: "${sanitizedTitle}"`,
                );
                // Only update filename with sanitized version if it's part of sync mode
                const shouldUpdateFilename =
                    this.settings.syncMode !== SyncMode.FRONTMATTER_HEADING;
                const shouldUpdateFrontmatter = this.shouldSyncFrontmatter();
                const shouldUpdateHeading = this.shouldSyncHeading();

                if (shouldUpdateFilename) {
                    await this.updateFilename(file, sanitizedTitle);
                }

                // Keep original in frontmatter and/or heading if they should be synced
                if (shouldUpdateFrontmatter || shouldUpdateHeading) {
                    await this.updateFrontmatterAndOrHeading(file, title);
                }
            }
        } else {
            // No illegal characters, proceed normally
            await this.updateTitlesBasedOnSyncMode(file, title);
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

    // Helper methods to check which sources to sync based on settings
    shouldSyncFilename(): boolean {
        return this.settings.syncMode !== SyncMode.FRONTMATTER_HEADING;
    }

    shouldSyncFrontmatter(): boolean {
        return this.settings.syncMode !== SyncMode.FILENAME_HEADING;
    }

    shouldSyncHeading(): boolean {
        return this.settings.syncMode !== SyncMode.FILENAME_FRONTMATTER;
    }

    async updateTitlesBasedOnSyncMode(file: TFile, title: string) {
        const shouldUpdateFilename = this.shouldSyncFilename();
        const shouldUpdateFrontmatter = this.shouldSyncFrontmatter();
        const shouldUpdateHeading = this.shouldSyncHeading();

        // Update filename if it's part of the sync mode
        if (shouldUpdateFilename) {
            await this.updateFilename(file, title);
        }

        // Update frontmatter and/or heading if they're part of the sync mode
        if (shouldUpdateFrontmatter || shouldUpdateHeading) {
            await this.updateFrontmatterAndOrHeading(file, title);
        }
    }

    async updateFilename(file: TFile, title: string) {
        if (file.basename !== title) {
            await this.app.fileManager.renameFile(
                file,
                `${file.parent?.path ? file.parent.path + "/" : ""}${title}${file.extension ? "." + file.extension : ""}`,
            );
        }
    }

    async updateFrontmatterAndOrHeading(file: TFile, title: string) {
        await this.app.vault.process(file, (fileContents) => {
            return this.updateFileContents(
                fileContents,
                title,
                file,
                this.shouldSyncFrontmatter(),
                this.shouldSyncHeading(),
            );
        });
    }

    // For backward compatibility
    async updateFrontmatterAndHeading(file: TFile, title: string) {
        await this.updateFrontmatterAndOrHeading(file, title);
    }

    // Helper method to find the position of the first level 1 heading in content
    findFirstHeadingPosition(
        content: string,
        file: TFile,
    ): { hasHeading: boolean; position: number; text: string } {
        // Default result with no heading
        const result = { hasHeading: false, position: -1, text: "" };

        // Get file cache from metadata cache
        const fileCache = this.app.metadataCache.getFileCache(file);
        if (!fileCache || !fileCache.headings) {
            return result;
        }

        // Find the first level 1 heading
        const topLevelHeading = fileCache.headings.find((h) => h.level === 1);
        if (!topLevelHeading) {
            return result;
        }

        // Get the heading text and position
        result.hasHeading = true;
        result.text = topLevelHeading.heading;

        // Find the position in the content
        const headingLine = `# ${topLevelHeading.heading}`;
        result.position = content.indexOf(headingLine);

        return result;
    }

    updateFileContents(
        content: string,
        title: string,
        file: TFile,
        updateFrontmatter = true,
        updateHeading = true,
    ): string {
        let updatedContent = content;

        // Check for existing heading first using MetadataCache
        const headingInfo = this.findFirstHeadingPosition(updatedContent, file);
        const hasHeading = headingInfo.hasHeading;
        const headingPos = headingInfo.position;
        const headingText = headingInfo.text;

        // Use getFrontMatterInfo to get information about frontmatter
        const frontMatterInfo = getFrontMatterInfo(updatedContent);
        const hasFrontMatter = frontMatterInfo.exists;

        // Update frontmatter if needed
        if (updateFrontmatter) {
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
                    updatedContent =
                        updatedContent.substring(0, frontMatterInfo.from) +
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
                            `title: ${title}`,
                        );

                        // Replace the frontmatter in the content
                        updatedContent =
                            updatedContent.substring(0, frontMatterInfo.from) +
                            updatedFrontmatter +
                            updatedContent.substring(frontMatterInfo.to);
                    } else {
                        // Add title to existing frontmatter
                        const updatedFrontmatter = `title: ${title}\n${yaml}`;

                        // Replace the frontmatter in the content
                        updatedContent =
                            updatedContent.substring(0, frontMatterInfo.from) +
                            updatedFrontmatter +
                            updatedContent.substring(frontMatterInfo.to);
                    }
                }
            } else {
                // Add new frontmatter with title
                const frontmatter = { title: title };
                const yaml = stringifyYaml(frontmatter);

                if (hasHeading && headingPos >= 0) {
                    // If there's a heading, insert frontmatter before it
                    // Create frontmatter content properly
                    const frontMatterContent = `---\n${yaml}---\n\n`;

                    updatedContent =
                        frontMatterContent +
                        updatedContent.substring(0, headingPos).trim() +
                        (headingPos > 0 ? "\n\n" : "") +
                        updatedContent.substring(headingPos);
                } else {
                    // No heading, just add frontmatter at the beginning
                    const frontMatterContent = `---\n${yaml}---\n\n`;
                    updatedContent = frontMatterContent + updatedContent;
                }
            }
        }

        // Update heading if needed
        if (updateHeading) {
            // Need to re-check frontmatter info after our modifications
            const updatedFrontMatterInfo = getFrontMatterInfo(updatedContent);
            const contentStartsWithFrontmatter = updatedFrontMatterInfo.exists;

            // We need to use regex for heading detection after modifications since file cache won't be updated yet
            const headingRegex = /^#\s+(.+)$/m;
            const updatedHeadingMatch = updatedContent.match(headingRegex);

            if (updatedHeadingMatch) {
                // Extract the heading position and line
                const headingLine = updatedHeadingMatch[0];
                const headingIndex = updatedContent.indexOf(headingLine);

                // Replace the specific heading text while preserving its position
                updatedContent =
                    updatedContent.substring(0, headingIndex) +
                    `# ${title}` +
                    updatedContent.substring(headingIndex + headingLine.length);
            } else {
                // Add heading after frontmatter
                if (contentStartsWithFrontmatter) {
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

                    // Ensure proper spacing between frontmatter and heading by using string operations
                    // instead of regex to normalize the spacing
                    const endOfFrontMatter = updatedFrontMatterInfo.to;
                    const textAfterFrontMatter =
                        updatedContent.substring(endOfFrontMatter);

                    // Normalize spacing to exactly one newline after frontmatter
                    updatedContent =
                        updatedContent.substring(0, endOfFrontMatter) +
                        "\n\n" +
                        textAfterFrontMatter.trimStart();
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
        }

        return updatedContent;
    }
}
