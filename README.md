<div align="center">
  <h1>
    <img src="https://github.com/user-attachments/assets/c805b9d0-99a2-4979-9993-7fcfcec96152" width="72" style="pointer-events: none; display: inline-block; vertical-align: middle;" alt="Logo">
    <span style="pointer-events: none; display: inline-block; vertical-align: middle; background: linear-gradient(45deg, #cba6f7, #f5c2e7); -webkit-background-clip: text; -webkit-text-fill-color: transparent;"> GitHub Directory Downloader (Rust)</span>
  </h1>
  
  <p>
    <em style="color: #a6adc8;">A lightning-fast command-line tool to download specific directories from GitHub repositories, now rewritten in Rust.</em>
  </p>

  <!-- Catppuccin-themed badges -->
  <p>
    <a href="https://github.com/saberr26/gh-dir/stargazers">
      <img alt="Stargazers" src="https://img.shields.io/github/stars/saberr26/gh-dir?style=for-the-badge&logo=starship&color=cba6f7&logoColor=1e1e2e&labelColor=313244&border_color=45475a">
    </a>
    <a href="https://github.com/saberr26/gh-dir/issues">
      <img alt="Issues" src="https://img.shields.io/github/issues/saberr26/gh-dir?style=for-the-badge&logo=gitbook&color=a6e3a1&logoColor=1e1e2e&labelColor=313244&border_color=45475a">
    </a>
    <a href="https://github.com/saberr26/gh-dir/commits/main">
      <img alt="Commit Activity" src="https://img.shields.io/github/commit-activity/m/saberr26/gh-dir/main?style=for-the-badge&logo=github&color=fab387&logoColor=1e1e2e&labelColor=313244&border_color=45475a">
    </a>
    <a href="https://github.com/saberr26/gh-dir">
      <img alt="Size" src="https://img.shields.io/github/repo-size/saberr26/gh-dir?style=for-the-badge&logo=discord&color=f5c2e7&logoColor=1e1e2e&labelColor=313244&border_color=45475a">
    </a>
  </p>

  <p>
    <img src="https://img.shields.io/badge/Rust-89b4fa?style=for-the-badge&logo=rust&logoColor=1e1e2e">
    <img src="https://img.shields.io/badge/Platforms-Linux%20%7C%20macOS%20%7C%20Windows-cba6f7?style=for-the-badge&logo=windows11&logoColor=1e1e2e">
  </p>

</div>

<br>

A Rust-based command-line tool for efficiently downloading specific directories from GitHub repositories without cloning the entire repository. Built for developers who need targeted access to repository contents.

## ⚡ Features

- **Directory-specific downloads** - Download only the directories you need
- **Private repository support** - Authenticate with GitHub tokens for private repos
- **Concurrent downloads** - Configurable concurrency for optimal performance
- **Progress indicators** - Real-time download progress with elegant terminal output
- **Cross-platform compatibility** - Works on Linux, macOS, and Windows

## ️ Built With

<div align="center">
  <table>
    <tr>
      <td align="center" width="150">
        <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/rust/rust-plain.svg" width="48" height="48" alt="Rust"/>
        <br><strong>Rust</strong>
      </td>
      <td align="center" width="150">
        <img src="https://i.imgur.com/RlJ0sex.png" width="48" height="48" alt="GitHub API"/>
        <br><strong>GitHub API</strong>
      </td>
    </tr>
  </table>
</div>

### Core Dependencies

- **[clap](https://crates.io/crates/clap)** - Command-line argument parser
- **[reqwest](https://crates.io/crates/reqwest)** - HTTP client
- **[tokio](https://crates.io/crates/tokio)** - Asynchronous runtime
- **[indicatif](https://crates.io/crates/indicatif)** - Progress bars and spinners

##  Installation

### Cargo
'''bash
cargo install gh-dir-rust
'''

##  Usage

### Basic Usage
'''bash
# Download a specific directory
gh-dir-rust https://github.com/user/repo/tree/main/src
'''

##  Development

### Prerequisites
- Rust 1.60+
- Cargo

### Setup
'''bash
# Clone repository
git clone https://github.com/saberr26/gh-dir.git
cd gh-dir

# Build project
cargo build --release

# Run
cargo run -- <github-url>
'''

##  Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Contribution Process
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -am '''Add your feature'''`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Create a Pull Request

<div align="center">

[![Contributors](https://contrib.rocks/image?repo=saberr26/gh-dir)](https://github.com/saberr26/gh-dir/graphs/contributors)

</div>

##  License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

##  Issues & Support

If you encounter any issues or have questions:

- Check existing [Issues](https://github.com/saberr26/gh-dir/issues)
- Create a [New Issue](https://github.com/saberr26/gh-dir/issues/new)
- Join our [Discussions](https://github.com/saberr26/gh-dir/discussions)

---

<div align="center">
  <strong>Made with ❤️ by <a href="https://github.com/saberr26">saberr26</a></strong>
  <br>
  <em>⭐ Star this repo if you find it helpful!</em>
</div>