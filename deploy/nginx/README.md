# Nginx Proxy Manager (NPM) Configuration Guide for Audex

Reference reverse proxy configurations for deploying the Audex ecosystem via **Nginx Proxy Manager (NPM)**.

---

## Network Topology & Ports

In standard Docker Compose deployments (`.env`), Audex services are mapped to the following host ports:

| Service | Public Domain | Protocol | Internal Container Port | Host Port (`.env`) | Snippet File |
| :--- | :--- | :---: | :---: | :---: | :--- |
| **Audex Client** | `audex.home` | HTTP/HTTPS | `client:80` | `3700` (`CLIENT_PORT`) | [`npm/client-advanced.conf`](./npm/client-advanced.conf) |
| **Audex Web API** | `server.audex.home` | HTTP/HTTPS | `server:5000` | `9200` (`SERVER_PORT`) | [`npm/server-advanced.conf`](./npm/server-advanced.conf) |
| **MinIO S3 Storage** | `s3.audex.home` | HTTP/HTTPS | `files-database:9000` | `9000` (`MINIO_API_PORT`) | [`npm/minio-s3-advanced.conf`](./npm/minio-s3-advanced.conf) |

---

## Proxy Host Setup in NPM

Create **three** Proxy Hosts in the NPM web UI:

### 1. Host: `server.audex.home` (Web API & SignalR)

#### **Details** Tab:
* **Domain Names**: `server.audex.home`
* **Scheme**: `http`
* **Forward Hostname / IP**: `<DOCKER_HOST_IP>` (e.g. `192.168.1.115`) or `audex_server` (if NPM is in the same Docker network)
* **Forward Port**: `9200` (or `5000` in a shared network)
* **Cache Assets**: ❌ Off
* **Block Common Exploits**: ✅ On
* **Websockets Support**: ✅ On

#### **SSL** Tab:
* **SSL Certificate**: Select your certificate
* **Force SSL**: ✅ On
* **HTTP/2 Support**: ✅ On
* **HSTS Enabled**: ✅ On

#### **Advanced** Tab:
Copy and paste the entire content from [`npm/server-advanced.conf`](./npm/server-advanced.conf):
* Extends request timeouts to `300s` / `3600s` for database backup operations and SignalR WebSocket longevity.
* Increases `client_max_body_size` to `100M`.
* Disables proxy buffering for Server-Sent Events (SSE) and streamed file exports.

---

### 2. Host: `audex.home` (Web Client React SPA)

#### **Details** Tab:
* **Domain Names**: `audex.home`
* **Scheme**: `http`
* **Forward Hostname / IP**: `<DOCKER_HOST_IP>`
* **Forward Port**: `3700` (or `80` in a shared network)
* **Cache Assets**: ✅ On
* **Block Common Exploits**: ✅ On
* **Websockets Support**: ❌ Off

#### **SSL** Tab:
* **SSL Certificate**: Select your certificate
* **Force SSL**: ✅ On
* **HTTP/2 Support**: ✅ On
* **HSTS Enabled**: ✅ On

#### **Advanced** Tab:
Copy and paste the entire content from [`npm/client-advanced.conf`](./npm/client-advanced.conf):
* Adds standard HTTP security headers (`X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`).

---

### 3. Host: `s3.audex.home` (MinIO S3 Storage API)

#### **Details** Tab:
* **Domain Names**: `s3.audex.home`
* **Scheme**: `http`
* **Forward Hostname / IP**: `<DOCKER_HOST_IP>`
* **Forward Port**: `9000`
* **Cache Assets**: ❌ Off
* **Block Common Exploits**: ❌ Off *(required: exploit filters corrupt base64 S3 requests)*
* **Websockets Support**: ❌ Off

#### **SSL** Tab:
* **SSL Certificate**: Select your certificate
* **Force SSL**: ✅ On
* **HTTP/2 Support**: ✅ On

#### **Advanced** Tab:
Copy and paste the entire content from [`npm/minio-s3-advanced.conf`](./npm/minio-s3-advanced.conf):
* Sets `proxy_set_header Host $http_host;` — critical for AWS Signature V4 authentication.
* Increases `client_max_body_size` to `500M`.
* Disables request/response proxy buffering for streaming chunked uploads.

---

## Validation Checklist

After saving configurations in NPM, verify functionality:

1. **SignalR WebSocket Connection**:
   * Open `https://audex.home` in your browser.
   * Open DevTools (`F12`) -> **Network** tab -> filter by `messages`.
   * Verify status `101 Switching Protocols` (WebSocket protocol). Ping frames (`{"type":6}`) should stream periodically.
2. **Backup & Large Payload Operations**:
   * Uploading database backups or broker statements exceeding 1MB must succeed without `413 Payload Too Large`.
   * Backup restore operations running longer than 60 seconds must not terminate with `504 Gateway Timeout`.
3. **MinIO S3 Object Uploads**:
   * Uploading account or bank icon images must succeed without `SignatureDoesNotMatch` errors.
