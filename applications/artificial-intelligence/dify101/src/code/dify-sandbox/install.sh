# check if ubuntu/debain
if [ -f /etc/debian_version ]; then
    apt-get install pkg-config gcc libseccomp-dev
# check if fedora
elif [ -f /etc/fedora-release ]; then
    dnf install pkgconfig gcc libseccomp-devel
# check if arch
elif [ -f /etc/arch-release ]; then
    pacman -S pkg-config gcc libseccomp
# check if alpine
elif [ -f /etc/alpine-release ]; then
    apk add pkgconfig gcc libseccomp-dev
# check if centos
elif [ -f /etc/centos-release ]; then
    yum install pkgconfig gcc libseccomp-devel
else
    echo "Unsupported distribution"
    exit 1
fi
