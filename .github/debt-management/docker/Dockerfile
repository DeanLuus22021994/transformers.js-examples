FROM ubuntu:22.04
RUN apt-get update && apt-get install -y git grep sed bc curl vim nano nodejs npm python3 python3-pip build-essential wget unzip && apt-get clean && rm -rf /var/lib/apt/lists/*
RUN wget https://releases.hashicorp.com/packer/1.8.7/packer_1.8.7_linux_amd64.zip -O /tmp/packer.zip \
	&& unzip /tmp/packer.zip -d /usr/local/bin \
	&& rm /tmp/packer.zip
ENV DOCKER_BUILDKIT=1
RUN pip3 install --no-cache-dir pyyaml tabulate colorama
WORKDIR /repo
COPY scripts/scan-debt.sh /usr/local/bin/scan-debt
COPY scripts/generate-report.sh /usr/local/bin/generate-report
COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /usr/local/bin/scan-debt /usr/local/bin/generate-report /entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"]

# Keep container running for interactive/instant builds
CMD ["tail", "-f", "/dev/null"]