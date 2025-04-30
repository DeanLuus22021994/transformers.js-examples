#!/bin/bash
set -e
[ -n "$RUNNER_IMAGES_TOKEN" ] || { echo env_var_missing; exit 1; }
[ -d /repo ] || { echo no_repo_mount; exit 1; }
cd /repo && git submodule update --init --recursive
mkdir -p /repo/debt-reports /runner-images-build
[ -d /runner-images-src ] || { echo no_runner_images_src_mount; exit 1; }
cd /runner-images-src && [ -f images/ubuntu/templates/ubuntu2204.pkr.hcl ] && packer init images/ubuntu/templates/ubuntu2204.pkr.hcl && packer build -force -color=false -on-error=abort -var output_dir=/runner-images-build -var cache_dir=/runner-images-build/.packer_cache images/ubuntu/templates/ubuntu2204.pkr.hcl || echo no_packer_template
cd /repo && scan-debt && generate-report