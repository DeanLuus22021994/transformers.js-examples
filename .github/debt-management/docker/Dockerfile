FROM ubuntu:22.04 AS builder
ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update && apt-get install -y --no-install-recommends git curl wget unzip && apt-get clean && rm -rf /var/lib/apt/lists/*
RUN wget -q https://releases.hashicorp.com/packer/1.9.4/packer_1.9.4_linux_amd64.zip -O /tmp/packer.zip && unzip /tmp/packer.zip -d /usr/local/bin && rm /tmp/packer.zip

FROM ubuntu:22.04
ENV DEBIAN_FRONTEND=noninteractive BUILDKIT_INLINE_CACHE=1 PYTHONOPTIMIZE=1
RUN apt-get update && apt-get install -y --no-install-recommends git grep sed bc curl nodejs npm python3 python3-pip && pip3 install --no-cache-dir pyyaml tabulate colorama && apt-get clean && rm -rf /var/lib/apt/lists/*
COPY --from=builder /usr/local/bin/packer /usr/local/bin/
WORKDIR /repo
COPY debt-management/scripts/scan-debt.sh /usr/local/bin/scan-debt
COPY debt-management/scripts/generate-report.sh /usr/local/bin/generate-report
COPY debt-management/docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /usr/local/bin/scan-debt /usr/local/bin/generate-report /entrypoint.sh
VOLUME ["/runner-images-build", "/runner-images-cache"]
ENTRYPOINT ["/entrypoint.sh"]