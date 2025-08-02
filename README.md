# File Title Updater

[![GitHub release (Latest by date)](https://img.shields.io/github/v/release/wenlzhang/obsidian-file-title-updater)](https://github.com/wenlzhang/obsidian-file-title-updater/releases) ![GitHub all releases](https://img.shields.io/github/downloads/wenlzhang/obsidian-file-title-updater/total?color=success)

An [Obsidian](https://obsidian.md) plugin that synchronizes titles between filename, frontmatter, and first heading in your notes. Works on individual files or entire folders with subfolders.

## Features

This plugin helps maintain consistency between the three places where a note's title can appear:

1. The filename
2. The `title` field in the frontmatter
3. The first level 1 heading (`#`) in the note

### Individual File Commands

The plugin provides four commands for working with individual files:

- **Sync titles using default source**: Uses the default source (configurable in settings) to update all other title locations
- **Sync titles using filename as source**: Uses the filename to update frontmatter title and first heading
- **Sync titles using frontmatter as source**: Uses the frontmatter title to update filename and first heading
- **Sync titles using first heading as source**: Uses the first level 1 heading to update filename and frontmatter title

### Bulk Folder Operations

> [!WARNING]
> Since this bulk updating feature will operate on many files, there is no way to revert changes. Please use this feature with caution and ensure you back up your files before proceeding.

For efficient management of large note collections, you can also sync titles for entire folders:

- **Right-click on any folder** in the file explorer to access bulk sync options
- **Sync titles in folder (default source)**: Updates all markdown files in the folder and subfolders using your default source
- **Sync titles in folder (from filename)**: Bulk updates using filenames as the source
- **Sync titles in folder (from frontmatter)**: Bulk updates using frontmatter titles as the source
- **Sync titles in folder (from heading)**: Bulk updates using first headings as the source

The bulk operations work recursively, processing all markdown files in the selected folder and any nested subfolders at any depth.

### Smart Behavior

The plugin includes several intelligent features:

- **Customizable sync targets**: Choose which title locations to sync (all three, or any pair of two)
- **Detects already synchronized titles**: If all titles that should be synced are already the same, the plugin will notify you and skip unnecessary updates
- **Proper spacing**: Ensures exactly one empty line between frontmatter and the first heading
- **Handles edge cases**: Properly creates first headings when none exist and provides helpful error messages
- **Handles illegal characters**: Automatically sanitizes titles when updating filenames to remove or replace characters that aren't allowed in filenames

## Why use this plugin?

Having the same title in multiple places provides redundancy and makes your notes more accessible:

- Consistent filenames make it easier to find notes in your file system
- Frontmatter titles enable better metadata management and can be used with plugins like Dataview
- First-level headings provide visual context when reading the note

You can now choose which of these title locations matter most to your workflow and selectively sync between them.

## Documentation

📚 **[View Full Documentation](https://ptkm.net/obsidian-file-title-updater)**

Visit the documentation site to learn how to make the most of File Title Updater in your Obsidian workflow.

## Support & Community

This plugin is a labor of love, developed and maintained during my free time after work and on weekends. A lot of thought, energy, and care goes into making it reliable, user-friendly, and aligned with PTKM principles.

If you find this plugin valuable in your daily workflow:

- If it helps you update titles more effectively
- If it saves you time and mental energy

Please consider supporting my work. Your support would mean the world to me and would help me dedicate more time and energy to:

- Developing new features
- Maintaining code quality
- Providing support and documentation
- Making the plugin even better for everyone

### Ways to Support

You can support this project in several ways:

- ⭐ Star the project on GitHub
- 💝 <a href='https://ko-fi.com/C0C66C1TB' target='_blank'><img height='36' style='border:0px;height:36px;' src='https://storage.ko-fi.com/cdn/kofi1.png?v=3' border='0' alt='Buy Me a Coffee' /></a>
- [Sponsor](https://github.com/sponsors/wenlzhang) my work on GitHub
- 💌 Share your success stories and feedback
- 📢 Spread the word about the plugin
- 🐛 [Report issues](https://github.com/wenlzhang/obsidian-file-title-updater/issues) to help improve the plugin

Thank you for being part of this journey! 🙏
