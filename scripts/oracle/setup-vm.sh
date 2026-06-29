#!/usr/bin/env bash
# One-time Oracle Cloud VM setup: Docker + firewall rules for StackDesk.
# Run on the VM as a user with sudo access:
#   curl -fsSL <raw-url>/scripts/oracle/setup-vm.sh | bash
# Or after cloning the repo:
#   bash scripts/oracle/setup-vm.sh

set -euo pipefail

if ! command -v sudo >/dev/null 2>&1; then
  echo "sudo is required."
  exit 1
fi

echo "==> Updating packages..."
sudo apt-get update -qq
sudo apt-get upgrade -y -qq

echo "==> Installing Docker..."
if ! command -v docker >/dev/null 2>&1; then
  curl -fsSL https://get.docker.com | sudo sh
  sudo usermod -aG docker "$USER"
  echo "Added $USER to the docker group. Log out and back in before running deploy."
fi

echo "==> Opening ports in iptables (Oracle blocks these by default)..."
# Oracle Ubuntu images ship with restrictive iptables rules.
for port in 22 80 443 3000; do
  sudo iptables -C INPUT -p tcp --dport "$port" -j ACCEPT 2>/dev/null \
    || sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport "$port" -j ACCEPT
done

if command -v netfilter-persistent >/dev/null 2>&1; then
  sudo netfilter-persistent save
elif [ -d /etc/iptables ]; then
  sudo sh -c 'iptables-save > /etc/iptables/rules.v4'
fi

echo ""
echo "Setup complete."
echo ""
echo "Next steps:"
echo "  1. In OCI Console → Networking → Security List → Ingress Rules, allow TCP 22, 80, 443, 3000"
echo "  2. Log out and back in (docker group)"
echo "  3. Clone the repo and run: bash scripts/oracle/deploy.sh"
