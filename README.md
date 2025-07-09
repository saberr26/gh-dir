<div align="center">
  <h1>
    <img src="https://github.com/user-attachments/assets/c805b9d0-99a2-4979-9993-7fcfcec96152" width="72" style="pointer-events: none; display: inline-block; vertical-align: middle;" alt="Logo">
    <span style="pointer-events: none; display: inline-block; vertical-align: middle; color: #89b4fa;">GitHub Directory Downloader</span>
  </h1>
  
  <p>
    <em style="color: #a6adc8;">A command-line tool written in Rust to efficiently download specific directories from GitHub repositories.</em>
  </p>

  <p>
    <a href="https://github.com/saberr26/gh-dir/stargazers">
      <img alt="Stars" src="https://img.shields.io/github/stars/saberr26/gh-dir?style=for-the-badge&color=89b4fa&labelColor=313244&border_color=45475a">
    </a>
    <a href="https://github.com/saberr26/gh-dir/issues">
      <img alt="Issues" src="https://img.shields.io/github/issues/saberr26/gh-dir?style=for-the-badge&color=89b4fa&labelColor=313244&border_color=45475a">
    </a>
    <a href="https://github.com/saberr26/gh-dir/commits/main">
      <img alt="Commit Activity" src="https://img.shields.io/github/commit-activity/m/saberr26/gh-dir/main?style=for-the-badge&color=89b4fa&labelColor=313244&border_color=45475a">
    </a>
    <a href="https://github.com/saberr26/gh-dir">
      <img alt="Repo Size" src="https://img.shields.io/github/repo-size/saberr26/gh-dir?style=for-the-badge&color=89b4fa&labelColor=313244&border_color=45475a">
    </a>
  </p>

  <p>
    <img src="https://img.shields.io/badge/Rust-89b4fa?style=for-the-badge&color=89b4fa&labelColor=313244">
    <img src="https://img.shields.io/badge/Platforms-Linux%20%7C%20macOS%20%7C%20Windows-89b4fa?style=for-the-badge&labelColor=313244">
  </p>
</div>

<br>

# GitHub Directory Downloader

A Rust-based command-line tool designed to download specific directories from GitHub repositories without cloning the entire repository. This tool is tailored for developers who require targeted access to repository contents without needing to download the whole repo.

## Features

- **Directory-Specific Downloads**: Retrieve only the directories you need.
- **Private Repository Support**: Authenticate using GitHub tokens for private repositories.
- **Concurrent Downloads**: Configure concurrency for optimized performance.
- **Progress Indicators**: Display real-time download progress in the terminal.
- **Cross-Platform Compatibility**: Supports Linux, macOS, and Windows.

## Built With

<div align="center">
  <table>
    <tr>
      <td align="center" width="150">
        <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/rust/rust-original.svg" width="48" height="48" alt="Rust"/>
        <br><strong>Rust</strong>
      </td>
      <td align="center" width="150">
        <img src="https://github.com/simple-icons/simple-icons/blob/develop/icons/github.svg" width="48" height="48" alt="GitHub API"/>
        <br><strong>GitHub API</strong>
      </td>
    </tr>
  </table>
</div>

### Core Dependencies

- **[clap](https://crates.io/crates/clap)** - Command-line argument parsing.
- **[reqwest](https://crates.io/crates/reqwest)** - HTTP client for API requests.
- **[tokio](https://crates.io/crates/tokio)** - Asynchronous runtime for concurrency.
- **[indicatif](https://crates.io/crates/indicatif)** - Terminal progress bars and spinners.

## Installation

### From Source
For the latest development version:

1. Ensure Rust and Cargo are installed (Rust 1.60+ recommended).
2. Clone the repository:
   ```bash
   git clone https://github.com/saberr26/gh-dir.git
   cd gh-dir
   ```
3. Build the project:
   ```bash
   cargo build --release
   ```
4. Run the binary:
   ```bash
   ./target/release/gh-dir-rust --help
   ```

## Usage

### Basic Command
Download a specific directory from a GitHub repository:

```bash
gh-dir-rust clone https://github.com/user/repo/tree/main/directory
```

### Optional Arguments
- `--token <TOKEN>`: Provide a GitHub personal access token for private repositories.
- `--output <PATH>`: Specify the output directory (default: current directory).
- `--concurrency <N>`: Set the number of concurrent downloads (default: 10).
- `--zip`: Download as a ZIP file instead of extracting files.
- `--yes`: Skip the confirmation prompt.
- `--debug`: Enable debug output.
- `--plain`: Display plain output without boxes.

### Example
Clone a directory with a token and custom output:

```bash
gh-dir-rust clone https://github.com/user/repo/tree/main/src --token ghp_xxx --output /path/to/dest
```

## Development

### Prerequisites
- Rust 1.60+ and Cargo installed.
- Git for version control.

### Setup Instructions
1. Clone the repository:
   ```bash
   git clone https://github.com/saberr26/gh-dir.git
   cd gh-dir
   ```
2. Build the project:
   ```bash
   cargo build --release
   ```
3. Run tests (optional):
   ```bash
   cargo test
   ```
4. Execute the tool:
   ```bash
   ./target/release/gh-dir-rust --help
   ```

## Contributing

We welcome contributions to improve this tool. Please review our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Contribution Process
1. Fork the repository.
2. Create a feature branch: `git checkout -b feature/your-feature`.
3. Commit changes: `git commit -m "Add your feature"`.
4. Push to your branch: `git push origin feature/your-feature`.
5. Open a Pull Request against the `main` branch.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Issues & Support

For bugs, questions, or feature requests:
- Check existing [Issues](https://github.com/saberr26/gh-dir/issues).
- Create a [New Issue](https://github.com/saberr26/gh-dir/issues/new).
- Join our [Discussions](https://github.com/saberr26/gh-dir/discussions) for community support.

---

<div align="center">
  <strong>Developed by <a href="https://github.com/saberr26">saberr26</a></strong>
  <br>
  <em>Consider starring this repository if you find it useful!</em>
</div>
