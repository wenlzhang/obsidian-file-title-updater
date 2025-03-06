# File Title Updater

[![GitHub release (Latest by date)](https://img.shields.io/github/v/release/wenlzhang/obsidian-file-title-updater)](https://github.com/wenlzhang/obsidian-file-title-updater/releases) ![GitHub all releases](https://img.shields.io/github/downloads/wenlzhang/obsidian-file-title-updater/total?color=success)

A plugin for [Obsidian](https://obsidian.md) that synchronizes titles between filename, frontmatter, and first heading in your notes.

## Features

This plugin helps maintain consistency between the three places where a note's title can appear:

1. The filename
2. The `title` field in the frontmatter
3. The first level 1 heading (`#`) in the note

The plugin provides four commands:

- **Sync titles using default source**: Uses the default source (configurable in settings) to update all other title locations
- **Sync titles using filename as source**: Uses the filename to update frontmatter title and first heading
- **Sync titles using frontmatter as source**: Uses the frontmatter title to update filename and first heading
- **Sync titles using first heading as source**: Uses the first level 1 heading to update filename and frontmatter title

### Smart Behavior

The plugin includes several intelligent features:

- **Detects already synchronized titles**: If all three titles are already the same, the plugin will notify you and skip unnecessary updates
- **Proper spacing**: Ensures exactly one empty line between frontmatter and the first heading
- **Handles edge cases**: Properly creates first headings when none exist and provides helpful error messages

## Why use this plugin?

Having the same title in multiple places provides redundancy and makes your notes more accessible:

- Consistent filenames make it easier to find notes in your file system
- Frontmatter titles enable better metadata management and can be used with plugins like Dataview
- First-level headings provide visual context when reading the note

## Usage

1. Open a note in Obsidian
2. Use one of the commands from the command palette (Ctrl/Cmd + P)
3. The plugin will update all title locations based on your selected source

### Special Cases

- If all titles are already synchronized, you'll see a notification: "All titles are already synchronized"
- When creating a first heading in a note that doesn't have one, the heading will be placed after the frontmatter with exactly one empty line
- If you try to sync from a source that doesn't exist (e.g., a non-existent frontmatter title), you'll receive a helpful error message

## Configuration

In the plugin settings, you can configure:

- **Default title source**: Choose which source (filename, frontmatter, or heading) should be used as the default when syncing titles

## Installation

### From Obsidian Community Plugins

1. Open Obsidian Settings
2. Go to Community Plugins and disable Safe Mode
3. Click Browse and search for "File Title Updater"
4. Install and enable the plugin

### Manual Installation

1. Download the latest release from the [releases page](https://github.com/wenlzhang/obsidian-file-title-updater/releases)
2. Extract the zip file to your Obsidian vault's `.obsidian/plugins` folder
3. Enable the plugin in Obsidian's settings

## Support

<a href='https://ko-fi.com/C0C66C1TB' target='_blank'><img height='36' style='border:0px;height:36px;' src='https://storage.ko-fi.com/cdn/kofi1.png?v=3' border='0' alt='Buy Me a Coffee at ko-fi.com' /></a>
