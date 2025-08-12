#!/bin/bash

set -e pipefail

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)

if ! command -v go &>/dev/null; then
  echo "Go is not installed. Please install Go first."
  exit 1
fi

PACKAGES=(
  "github.com/cloudwego/thriftgo@v0.4.1"
  "github.com/cloudwego/kitex/tool/cmd/kitex@v0.13.1"
  "github.com/cloudwego/hertz/cmd/hz@v0.9.7"
  "github.com/cloudwego/thrift-gen-validator@v0.2.6"
)

check_version() {
  local bin_name=$1
  local expected_version=$2
  local current_version
  local version_output

  version_output=$("${bin_name}" -version 2>&1 || "${bin_name}" --version 2>&1)

  case "${bin_name}" in
  "thriftgo")
    # Format: "thriftgo 0.4.1"
    current_version=$(echo "${version_output}" | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | sed 's/^/v/')
    ;;
  "cloudwego_kitex")
    # Format: "v0.13.1"
    current_version=$(echo "${version_output}" | grep -oE 'v[0-9]+\.[0-9]+\.[0-9]+')
    ;;
  "cloudwego_hz")
    # Format: "hz version v0.9.7"
    current_version=$(echo "${version_output}" | grep -oE 'v[0-9]+\.[0-9]+\.[0-9]+')
    ;;
  "thrift-gen-validator")
    # Format: "v0.2.6"
    current_version=$(echo "${version_output}" | grep -oE 'v[0-9]+\.[0-9]+\.[0-9]+')
    ;;
  *)
    echo "Warning: Unknown binary ${bin_name}"
    return 1
    ;;
  esac

  if [ -z "${current_version}" ]; then
    echo "Warning: Could not determine version for ${bin_name}. Version output was: ${version_output}"
    return 1
  fi

  if [ "${current_version}" = "${expected_version}" ]; then
    return 0
  else
    echo "${bin_name} version mismatch. Expected ${expected_version}, got ${current_version}"
    return 1
  fi
}

install_and_verify() {
  local pkg=$1
  local bin_name
  local version

  bin_name=$(echo "$pkg" | sed -E 's/.*\/([^@]+)@.*/\1/')
  version=$(echo "$pkg" | sed -E 's/.*@(.*)/\1/')

  if [[ "$pkg" == *"kitex/tool/cmd/kitex"* ]]; then
    bin_name="cloudwego_kitex"
  fi

  if [[ "$pkg" == *"hertz/cmd/hz"* ]]; then
    bin_name="cloudwego_hz"
  fi

  if command -v "${bin_name}" &>/dev/null; then
    if check_version "${bin_name}" "${version}"; then
      echo "${bin_name} version ${version} is already installed"
      return 0
    fi
  fi

  echo "Installing $pkg..."
  go install $pkg

  if [[ "$pkg" == *"hertz/cmd/hz"* ]]; then
    mv "${GOPATH}/bin/hz" "${GOPATH}/bin/cloudwego_hz"
  fi

  if [[ "$pkg" == *"kitex/tool/cmd/kitex"* ]]; then
    mv "${GOPATH}/bin/kitex" "${GOPATH}/bin/cloudwego_kitex"
  fi

  if ! check_version "${bin_name}" "${version}"; then
    echo "Failed to verify ${bin_name} version after installation"
    return 1
  fi

  echo "${bin_name} version ${version} installed successfully"
}

for pkg in "${PACKAGES[@]}"; do
  if ! install_and_verify "$pkg"; then
    echo "Failed to install package: $pkg"
    exit 1
  fi
done

echo "Compiling local loopgen..."
cd "${SCRIPT_DIR}/loopgen"
go build -o "${GOPATH}/bin/loopgen" main.go
if [ $? -ne 0 ]; then
  echo "Failed to compile loopgen"
  exit 1
fi
echo "loopgen has been compiled and installed to ${GOPATH}/bin/loopgen"

echo "All packages have been installed successfully"
