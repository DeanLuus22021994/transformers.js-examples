FROM ubuntu:22.04

# Install dependencies
RUN apt-get update && \
	apt-get install -y git grep sed bc curl vim nano nodejs npm python3 python3-pip && \
	apt-get clean && \
	rm -rf /var/lib/apt/lists/*

# Install Python dependencies
RUN pip3 install pyyaml tabulate colorama

# Set up working directory
WORKDIR /repo

# Copy scripts
COPY scripts/scan-debt.sh /usr/local/bin/scan-debt
COPY scripts/generate-report.sh /usr/local/bin/generate-report
COPY docker/entrypoint.sh /entrypoint.sh

# Make scripts executable
RUN chmod +x /usr/local/bin/scan-debt /usr/local/bin/generate-report /entrypoint.sh

# Set entrypoint
ENTRYPOINT ["/entrypoint.sh"]
