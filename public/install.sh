#!/bin/sh
# Install sprout: https://github.com/Sprout-DevLabs/sprout
#
#   curl -fsSL https://sprout-devlabs.github.io/sprout-web/install.sh | sh
#
# Environment:
#   SPROUT_VERSION       release tag to install, e.g. v0.2.0 (default: latest)
#   SPROUT_INSTALL_DIR   where to put the binary (default: /usr/local/bin if
#                        writable, otherwise ~/.local/bin)
#
# The archive's SHA-256 is checked against the release's checksums.txt
# before anything is installed. Nothing here uses sudo.

set -eu

repo="Sprout-DevLabs/sprout"

err() {
	printf 'sprout install: %s\n' "$1" >&2
	exit 1
}

have() { command -v "$1" >/dev/null 2>&1; }

download() { # url dest
	# Retry transient failures, and give up on a stalled connection instead
	# of hanging forever.
	if have curl; then
		curl -fsSL --proto '=https' --tlsv1.2 --retry 3 --connect-timeout 15 \
			--speed-limit 1024 --speed-time 30 -o "$2" "$1"
	elif have wget; then
		wget -q --https-only --tries=3 --timeout=30 -O "$2" "$1"
	else
		err "curl or wget is required"
	fi
}

latest_version() {
	# github.com/.../releases/latest redirects to .../releases/tag/vX.Y.Z
	if have curl; then
		url=$(curl -fsSLI --proto '=https' --retry 3 --connect-timeout 15 --max-time 60 -o /dev/null -w '%{url_effective}' "https://github.com/$repo/releases/latest")
	else
		url=$(wget -q --https-only --max-redirect=5 -S -O /dev/null "https://github.com/$repo/releases/latest" 2>&1 | sed -n 's/^ *Location: *//p' | tail -n 1)
	fi
	tag=${url##*/}
	case "$tag" in
	v[0-9]*) printf '%s' "$tag" ;;
	*) err "couldn't find the latest release (got '$url')" ;;
	esac
}

sha256() {
	if have sha256sum; then
		sha256sum "$1" | cut -d ' ' -f 1
	elif have shasum; then
		shasum -a 256 "$1" | cut -d ' ' -f 1
	else
		err "sha256sum or shasum is required to verify the download"
	fi
}

main() {
	os=$(uname -s)
	case "$os" in
	Linux) os=linux ;;
	Darwin) os=darwin ;;
	*) err "unsupported OS '$os'. On Windows, use: scoop bucket add sprout https://github.com/Sprout-DevLabs/scoop-bucket; scoop install sprout" ;;
	esac

	arch=$(uname -m)
	case "$arch" in
	x86_64 | amd64) arch=amd64 ;;
	arm64 | aarch64) arch=arm64 ;;
	*) err "unsupported architecture '$arch'. Try: go install github.com/$repo@latest" ;;
	esac

	have tar || err "tar is required"

	version=${SPROUT_VERSION:-$(latest_version)}
	archive="sprout_${version#v}_${os}_${arch}.tar.gz"
	base="https://github.com/$repo/releases/download/$version"

	tmp=$(mktemp -d)
	trap 'rm -rf "$tmp"' EXIT INT TERM

	printf 'Downloading sprout %s for %s/%s\n' "$version" "$os" "$arch"
	download "$base/$archive" "$tmp/$archive" || err "download failed: $base/$archive"
	download "$base/checksums.txt" "$tmp/checksums.txt" || err "download failed: $base/checksums.txt"

	expected=$(awk -v f="$archive" '$2 == f { print $1 }' "$tmp/checksums.txt")
	[ -n "$expected" ] || err "$archive is not listed in checksums.txt"
	actual=$(sha256 "$tmp/$archive")
	[ "$expected" = "$actual" ] || err "checksum mismatch for $archive (expected $expected, got $actual)"

	tar -xzf "$tmp/$archive" -C "$tmp" sprout

	if [ -n "${SPROUT_INSTALL_DIR:-}" ]; then
		dir=$SPROUT_INSTALL_DIR
	elif [ -d /usr/local/bin ] && [ -w /usr/local/bin ]; then
		dir=/usr/local/bin
	else
		dir="$HOME/.local/bin"
	fi
	mkdir -p "$dir"
	cp "$tmp/sprout" "$dir/sprout.tmp"
	chmod 755 "$dir/sprout.tmp"
	mv -f "$dir/sprout.tmp" "$dir/sprout" # atomic replace of an existing install

	printf 'Installed %s to %s\n' "$("$dir/sprout" --version)" "$dir/sprout"
	case ":$PATH:" in
	*":$dir:"*) ;;
	*) printf '\n%s is not on your PATH. Add this to your shell profile:\n  export PATH="%s:$PATH"\n' "$dir" "$dir" ;;
	esac
	printf '\nTry: sprout tour   (then: claude mcp add sprout -- sprout mcp)\n'
	printf 'If Sprout helps, a star helps others find it: https://github.com/Sprout-DevLabs/sprout\n'
}

main "$@"
