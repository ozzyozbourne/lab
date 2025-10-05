#!/bin/bash

if [ $# -eq 0 ]; then
    echo "Error: No argument provided"
    echo "Usage: sc.sh [docker|rancher]"
    exit 1
fi

case "$1" in
    docker)
        echo "Switching to Docker Desktop..."
        ln -sf /Applications/Docker.app/Contents/Resources/cli-plugins/docker-buildx ~/.docker/cli-plugins/docker-buildx
        ln -sf /Applications/Docker.app/Contents/Resources/cli-plugins/docker-compose ~/.docker/cli-plugins/docker-compose
        echo "✓ Symlinks now point to Docker Desktop"
        ;;
    rancher)
        echo "Switching to Rancher Desktop..."
        ln -sf ~/.rd/bin/docker-buildx ~/.docker/cli-plugins/docker-buildx
        ln -sf ~/.rd/bin/docker-compose ~/.docker/cli-plugins/docker-compose
        echo "✓ Symlinks now point to Rancher Desktop"
        ;;
    *)
        echo "Error: Invalid argument '$1'"
        echo "Usage: sc.sh [docker|rancher]"
        exit 1
        ;;
esac
