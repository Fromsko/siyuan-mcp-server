# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

## [1.2.7] - 2026-03-26

### Fixed
- Fixed MCP initialization outputting non-JSON formatted debug information that caused Antigravity parsing errors
- Removed unnecessary console outputs to ensure MCP protocol compatibility
- Only output debug information in development mode

### Added
- Added support for configuring remote SiYuan address via SIYUAN_API_URL environment variable
- Enhanced documentation for connecting to remote SiYuan services
- Added detailed configuration examples for Claude Desktop integration

### Changed
- Updated README with comprehensive remote server setup instructions
- Refined error handling and logging behavior