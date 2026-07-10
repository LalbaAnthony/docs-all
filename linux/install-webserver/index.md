# Linux Web Server Setup Checklist

A step-by-step to-do list for hardening and preparing a Linux web server for production use.

## Update System Packages

```sh
apt update && apt upgrade -y
```

## Create a New User With Sudo Rights

```sh
adduser deploy
usermod -aG sudo deploy
```

### Allow access to desired files

```sh
chown -R deploy:www-data /var/www
```

### Allow certain commands without password

Edit sudoers file (here for user `deploy`):
```sh
sudo visudo -f /etc/sudoers.d/deploy
```

Add the following line:
```
deploy ALL=NOPASSWD: /usr/sbin/apache2ctl configtest
deploy ALL=NOPASSWD: /bin/systemctl status apache2
deploy ALL=NOPASSWD: /bin/systemctl reload apache2
deploy ALL=NOPASSWD: /bin/systemctl restart apache2
deploy ALL=NOPASSWD: /bin/systemctl reload nginx
deploy ALL=NOPASSWD: /bin/systemctl restart nginx
deploy ALL=NOPASSWD: /bin/systemctl restart mysql
```

> NOTE: Commands that required sudo as `systemctl restart apache2` still require `sudo` as the user is not root.

Usage:
```sh
su deploy
sudo systemctl restart apache2
```

## Secure SSH Access

### Change Default SSH Port

Edit `/etc/ssh/sshd_config`:
```
Port 2222 # Not all ports are allowed by default, choose wisely
```
Then restart:
```sh
systemctl restart sshd
```

### Disable Root SSH Login

In `/etc/ssh/sshd_config`:
```
PermitRootLogin no
```

### Use Key-Based Authentication

```sh
ssh-keygen -t ed25519
ssh-copy-id -p 2222 deploy@your_server_ip
```

Disable password authentication in `/etc/ssh/sshd_config`:
```
PasswordAuthentication no
```

Restart:
```sh
systemctl restart sshd
```

## Configure Firewall (UFW)

```sh
apt install ufw -y
ufw default deny incoming
ufw default allow outgoing
ufw allow 2222/tcp # Change to your SSH port if different. Forgetting this will lock you out.
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
ufw status
```

## Install and Configure Fail2Ban

```sh
apt install fail2ban -y
systemctl enable fail2ban
systemctl start fail2ban
```

Create override file `/etc/fail2ban/jail.local`:
```
[sshd]
enabled = true
port = 2222
maxretry = 5
bantime = 3600
```

Restart:
```sh
systemctl restart fail2ban
```

## Enable Automatic Security Updates

```sh
apt install unattended-upgrades -y
dpkg-reconfigure unattended-upgrades
```

## Configure Time Synchronization

```sh
apt install chrony -y
systemctl enable chrony
systemctl start chrony
```

## Install Web Server Packages

Example with Apache:
```sh
apt install apache2 -y
systemctl enable apache2
systemctl start apache2
```

Example with Nginx:
```sh
apt install nginx -y
systemctl enable nginx
systemctl start nginx
```

## Install Database (Optional)

Example with MariaDB:
```sh
apt install mariadb-server -y
mysql_secure_installation
```

## Enable HTTPS (Let's Encrypt)

Install certbot:
```sh
apt install certbot python3-certbot-apache -y
# or for nginx:

apt install certbot python3-certbot-nginx -y
```

Obtain certificate:
```sh
certbot --apache
# or

certbot --nginx
```

Enable auto-renew:
```sh
systemctl enable certbot.timer
```

## Harden Shared Memory (Optional)

Edit `/etc/fstab`:
```
tmpfs /run/shm tmpfs defaults,noexec,nosuid 0 0
```
Then:
```sh
mount -o remount /run/shm
```

## Set Up Log Monitoring

Install logwatch:
```sh
apt install logwatch -y
logwatch --detail high --mailto admin@example.com --service all --range today
```

## Disable Unused Services

List all:
```sh
systemctl list-unit-files --type=service
```
Disable:
```sh
systemctl disable service_name
systemctl stop service_name
```

## Configure Swap (if needed)

```sh
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
```

## Final Security Audit

Install lynis:
```sh
apt install lynis -y
lynis audit system
```

