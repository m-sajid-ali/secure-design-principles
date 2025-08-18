# Secure DB Access Demo (Adminer + MariaDB + Nginx + Docker)

This project demonstrates a **secure approach to database access** using:

- Nginx (as reverse proxy with IP filtering + HTTP auth)
- MariaDB (with fine-grained user permissions)
- Adminer (web-based DB client, access-controlled)
-  Docker Compose (for isolated, repeatable setup)

---

## How to Run the Project

```bash
docker compose up -d
```

## Accessing the Services
- A simple web app to transfer and view balance at port **:80**
  - Available users are **alice** and **bob**
- DB client (Adminer (via Nginx) is accessible at port **:8080**
  - List of users availble for HTTP Auth are:
    - admin
    - dev
    - devops
    - analytics
    - dba
  - All HTTP users password is their username.
  - You may also create HTTP users using *htpasswd* utility
  - List of ips allowed can be found at *./nginx/ip-allow.conf* file
  - Available database users are:
    - admin
    - dev
    - analytics
    - dba
    - auditing
    - app_user
  - Permissions for these users can be found at *./db/init-secure.sql* file.
- List of available services can be found in *docker-compose.yaml* file.

## Disclaimer
 - This setup is for educational/demo use. For real production:
 - Use secure networks (VPN, VPC)
 - Rotate credentials regularly
 - Implement logging, monitoring, and rate limiting
---
