#!/bin/bash

VERSION="$1"

case "$VERSION" in
    "head"|"0.14.1"|"0.15.1")
        ;;
    *)
        echo "Error: Invalid version '$VERSION'"
        echo "Allowed versions: head, 0.14.1, 0.15.1"
        exit 1
        ;;
esac

ZIG_BIN_PATH="/Users/ozzy/zig/$VERSION/files/zig"
ZIG_LINK_PATH="/opt/homebrew/bin/zig"

ln -sf "$ZIG_BIN_PATH" "$ZIG_LINK_PATH"
echo "Switched to Zig version $VERSION"
