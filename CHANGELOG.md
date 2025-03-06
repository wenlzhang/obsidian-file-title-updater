# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).




## [0.2.0] - 2025-03-06

### Changes

- Fix ESLint error in main.ts and prepare for v0.1.5 release
- Fine tune settings tab
- Fine tune settings tab
- Handle illegal characters
- Update README.md
- Update README.md

## [0.1.5] - 2025-03-05

### Changes

- Update description
- Update README.md

## [0.1.4] - 2025-03-05

### Changes

- Fine tune settings tab
- Check if titles are already synced
- Fine tune spacing before first header
- Handle empty first header
- Add test scripts
- Add initial version
- Initial commit

## [0.1.3] - 2025-03-05

### Added

- Added check to detect when all titles are already synchronized
- Added notification when no changes are needed because titles are already in sync

## [0.1.2] - 2025-03-05

### Fixed

- Improved spacing between frontmatter and first heading to ensure exactly one empty line
- Fixed issue with multiple empty lines being created in some cases

## [0.1.1] - 2025-03-05

### Fixed

- Fixed edge case where the plugin would not properly create a first heading when none exists
- Improved error message when trying to sync from a non-existent first heading
- Enhanced handling of content placement when adding a new heading

## [0.1.0] - 2025-03-05

### Added

- Initial release of the File Title Updater plugin
- Added command to sync titles using default source (configurable in settings)
- Added command to sync titles using filename as source
- Added command to sync titles using frontmatter title as source
- Added command to sync titles using first heading as source
- Added settings to configure default title source
