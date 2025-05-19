# GitHub Directory Downloader

A command-line tool to download specific directories from GitHub repositories directly from your terminal. This tool uses the same backend as [download-directory.github.io](https://download-directory.github.io/).

## Features

- Download specific directories from GitHub repositories
- Clone GitHub directories to specific folders
- Support for private repositories with token authentication
- Download files as a zip archive or extract them directly
- Configurable concurrency for faster downloads
- Progress indicators for better user experience

## Installation

### System-wide Installation

The tool can be installed system-wide with the command name `ghdir` using the provided installation scripts.

#### Linux

```bash
sudo ./install/install-linux.sh
```

#### macOS

```bash
sudo ./install/install-macos.sh
```

#### Windows

Run PowerShell as Administrator and execute:

```powershell
.\install\install-windows.ps1
```

Or run Command Prompt as Administrator and execute:

```cmd
install\install-windows.bat
```

After installation, you may need to restart your terminal or command prompt for the `ghdir` command to be available.

### From Source

1. Clone this repository:
   ```
   git clone https://github.com/yourusername/github-directory-downloader.git
   cd github-directory-downloader
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Build the project:
   ```
   npm run build
   ```

4. Link the package globally (optional):
   ```
   npm link
   ```

## Usage

The tool provides two main commands: `download` (default) and `clone`.

### Download Command (Default)

```
github-dir [download] <github-url> [options]
```

#### Options

- `-o, --output <path>`: Output directory or zip file (default: current directory)
- `-t, --token <token>`: GitHub personal access token for private repositories
- `-z, --zip`: Download as zip file instead of extracting files
- `-c, --concurrency <number>`: Number of concurrent downloads (default: 10)
- `-h, --help`: Display help information
- `-V, --version`: Display version information

### Clone Command

```
github-dir clone <github-url> [destination] [options]
```

#### Options

- `-t, --token <token>`: GitHub personal access token for private repositories
- `-c, --concurrency <number>`: Number of concurrent downloads (default: 10)
- `-f, --force`: Overwrite existing files
- `-h, --help`: Display help information

### Examples

#### Download Command Examples

Download a directory and extract its contents to the current directory:
```
github-dir https://github.com/user/repo/tree/main/src
```

Download a directory as a zip file:
```
github-dir https://github.com/user/repo/tree/main/src --zip
```

Specify an output location:
```
github-dir https://github.com/user/repo/tree/main/src --output ./download
```

Download from a private repository:
```
github-dir https://github.com/user/private-repo/tree/main/src --token YOUR_GITHUB_TOKEN
```

#### Clone Command Examples

Clone a directory to the current working directory (will create a folder named after the directory):
```
github-dir clone https://github.com/user/repo/tree/main/src
```

Clone a directory to a specific folder:
```
github-dir clone https://github.com/user/repo/tree/main/src my-project
```

Clone a directory and overwrite existing files:
```
github-dir clone https://github.com/user/repo/tree/main/src my-project --force
```

Clone a private repository:
```
github-dir clone https://github.com/user/private-repo/tree/main/src my-project --token YOUR_GITHUB_TOKEN
```

## GitHub Token

For private repositories, you'll need to provide a GitHub Personal Access Token with the appropriate permissions.

To create a token:
1. Go to GitHub Settings > Developer settings > Personal access tokens
2. Generate a new token with the `repo` scope
3. Use this token with the `--token` option

## License

MIT
