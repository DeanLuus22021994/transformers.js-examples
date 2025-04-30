#!/bin/bash
set -e
[ -n "$RUNNER_IMAGES_TOKEN" ] || { echo "RUNNER_IMAGES_TOKEN not set"; exit 1; }
[ -d /repo ] || { echo "Repository not mounted"; exit 1; }
mkdir -p /runner-images-build /runner-images-cache
if [ ! -d /runner-images-src/.git ]; then
  git clone --depth 1 https://github.com/DeanLuus22021994/runner-images.git /runner-images-src
else
  cd /runner-images-src && git pull
fi
cd /runner-images-src
export PACKER_CACHE_DIR=/runner-images-cache
mkdir -p $PACKER_PLUGIN_PATH
[ -f images/ubuntu/templates/ubuntu2204.pkr.hcl ] && packer init -upgrade images/ubuntu/templates/ubuntu2204.pkr.hcl && packer build -force -color=false -parallel-builds=0 -var "output_dir=/runner-images-build" -var "github_feed_token=$RUNNER_IMAGES_TOKEN" images/ubuntu/templates/ubuntu2204.pkr.hcl
cd /repo && scan-debt && generate-report
tail -f /dev/null