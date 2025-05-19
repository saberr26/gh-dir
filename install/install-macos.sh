#!/bin/bash

# GitHub Directory Downloader macOS Installation Script
# This script installs the GitHub Directory Downloader tool system-wide

set -e

# Define colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Define installation paths
INSTALL_DIR="/usr/local/lib/ghdir"
BIN_DIR="/usr/local/bin"
COMMAND_NAME="ghdir"

# Check if running as root or with sudo
if [ "$(id -u)" -ne 0 ]; then
    echo -e "${RED}Error: This script must be run with sudo privileges${NC}"
    exit 1
fi

echo -e "${GREEN}Installing GitHub Directory Downloader...${NC}"

# Create installation directory if it doesn't exist
mkdir -p "$INSTALL_DIR"

# Get the script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Copy the project files to the installation directory
echo -e "${YELLOW}Copying files to $INSTALL_DIR...${NC}"
cp -r "$PROJECT_DIR/dist" "$INSTALL_DIR/"
cp -r "$PROJECT_DIR/node_modules" "$INSTALL_DIR/"
cp "$PROJECT_DIR/package.json" "$INSTALL_DIR/"

# Create a wrapper script
echo -e "${YELLOW}Creating wrapper script at $BIN_DIR/$COMMAND_NAME...${NC}"
cat > "$BIN_DIR/$COMMAND_NAME" << 'EOF'
#!/bin/bash
node /usr/local/lib/ghdir/dist/index.js "$@"
EOF

# Make the wrapper script executable
chmod +x "$BIN_DIR/$COMMAND_NAME"

echo -e "${GREEN}Installation complete!${NC}"
echo -e "${YELLOW}You can now use the command '${COMMAND_NAME}' to download GitHub directories.${NC}"
echo -e "${YELLOW}Examples:${NC}"
echo -e "  ${COMMAND_NAME} https://github.com/user/repo/tree/main/src"
echo -e "  ${COMMAND_NAME} clone https://github.com/user/repo/tree/main/src my-project"
