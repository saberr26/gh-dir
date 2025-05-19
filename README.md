<div align="center">
  <h1>
    <img src="https://github.com/user-attachments/assets/c805b9d0-99a2-4979-9993-7fcfcec96152" width="72" style="pointer-events: none; display: inline-block; vertical-align: middle;" alt="Logo">
    <span style="pointer-events: none; display: inline-block; vertical-align: middle; background: linear-gradient(45deg, #cba6f7, #f5c2e7); -webkit-background-clip: text; -webkit-text-fill-color: transparent;"> GitHub Directory Downloader</span>
  </h1>
  
  <p>
    <em style="color: #a6adc8;">A lightning-fast command-line tool to download specific directories from GitHub repositories</em>
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
    <img src="https://img.shields.io/badge/TypeScript-89b4fa?style=for-the-badge&logo=typescript&logoColor=1e1e2e">
    <img src="https://img.shields.io/badge/Node.js-a6e3a1?style=for-the-badge&logo=nodedotjs&logoColor=1e1e2e">
    <img src="https://img.shields.io/badge/Platforms-Linux%20%7C%20macOS%20%7C%20Windows-cba6f7?style=for-the-badge&logo=windows11&logoColor=1e1e2e">
  </p>

  <img src="https://user-images.githubusercontent.com/17677196/216833690-fdf6e9d3-6a4d-4c3b-9a7e-6b9e0a0e0e2f.png" width="700" alt="gh-dir demo" style="border-radius: 15px; box-shadow: 0 4px 8px rgba(203, 166, 247, 0.3);">
</div>

<br>

A TypeScript-based command-line tool for efficiently downloading specific directories from GitHub repositories without cloning the entire repository. Built for developers who need targeted access to repository contents.

## ⚡ Features

- **Directory-specific downloads** - Download only the directories you need
- **Multiple output formats** - Extract files directly or download as ZIP archives
- **Private repository support** - Authenticate with GitHub tokens for private repos
- **Concurrent downloads** - Configurable concurrency for optimal performance
- **Progress indicators** - Real-time download progress with elegant terminal output
- **Cross-platform compatibility** - Works on Linux, macOS, and Windows
- **Type-safe codebase** - Built with TypeScript for reliability and maintainability

## 🛠️ Built With

<div align="center">
  <table>
    <tr>
      <td align="center" width="150">
        <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg" width="48" height="48" alt="TypeScript"/>
        <br><strong>TypeScript</strong>
      </td>
      <td align="center" width="150">
        <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg" width="48" height="48" alt="Node.js"/>
        <br><strong>Node.js</strong>
      </td>
      <td align="center" width="150">
        <img src="https://i.imgur.com/RlJ0sex.png" width="48" height="48" alt="GitHub API"/>
        <br><strong>GitHub API</strong>
      </td>
    </tr>
  </table>
</div>

### Core Dependencies

- **[Commander.js](https://github.com/tj/commander.js/)** - Command-line interface framework
- **[Ora](https://github.com/sindresorhus/ora)** - Terminal progress spinners
- **[Chalk](https://github.com/chalk/chalk)** - Terminal styling and colors
- **[Axios](https://github.com/axios/axios)** - HTTP client for GitHub API requests

## 📦 Installation

### NPX (Recommended)
```bash
npx gh-dir <github-url>
```

### Global Installation
```bash
npm install -g gh-dir
```

## 🚀 Usage

### Basic Usage
```bash
# Download a specific directory
ghdir https://github.com/user/repo/tree/main/src

# Download as ZIP archive
ghdir https://github.com/user/repo/tree/main/src --zip
```

### Advanced Usage
```bash
# Clone to custom directory
ghdir clone https://github.com/user/repo/tree/main/src my-project

# Private repository with token
ghdir https://github.com/user/private-repo/tree/main/src --token YOUR_TOKEN

# Specify concurrency level
ghdir https://github.com/user/repo/tree/main/src --concurrency 10

# Verbose output
ghdir https://github.com/user/repo/tree/main/src --verbose
```

### Command Options

| Option | Description | Default |
|--------|-------------|---------|
| `--zip` | Download as ZIP archive | `false` |
| `--token <token>` | GitHub authentication token | - |
| `--concurrency <num>` | Maximum concurrent downloads | `5` |
| `--verbose` | Enable verbose logging | `false` |
| `--output <path>` | Specify output directory | Current directory |

## 🔧 Development

### Prerequisites
- Node.js 16+ 
- npm or yarn

### Setup
```bash
# Clone repository
git clone https://github.com/saberr26/gh-dir.git
cd gh-dir

# Install dependencies
npm install

# Build project
npm run build

# Development mode
npm run dev

# Run tests
npm test

# Lint code
npm run lint
```

### Project Structure
```
gh-dir/
├── src/
│   ├── commands/        # CLI command implementations
│   ├── utils/          # Utility functions
│   ├── types/          # TypeScript type definitions
│   └── index.ts        # Main entry point
├── tests/              # Test suites
├── dist/               # Compiled JavaScript
└── docs/               # Documentation
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- <test-file>
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Contribution Process
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -am 'Add your feature'`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Create a Pull Request

<div align="center">

[![Contributors](https://contrib.rocks/image?repo=saberr26/gh-dir)](https://github.com/saberr26/gh-dir/graphs/contributors)

</div>

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🐛 Issues & Support

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
