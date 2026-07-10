# Node.js Production Readiness Checklist

## General Setup

| Task                          | Why                             | How                                          |
| ----------------------------- | ------------------------------- | -------------------------------------------- |
| Set `NODE_ENV=production`     | Enables Express optimizations   | `export NODE_ENV=production`                 |
| Use `.env` for secrets/config | Avoid hardcoding secrets        | `npm i dotenv`, `require('dotenv').config()` |
| Keep `.env` out of Git        | Prevent leaks of sensitive info | Add `.env` to `.gitignore`                   |
| Pin dependency versions       | Prevent supply chain breaks     | Use `package-lock.json` + `npm ci`           |
| Run `npm audit` regularly     | Detect known vulnerabilities    | `npm audit` + `npm audit fix`                |
| Keep Node LTS version         | Security & stability            | Use `nvm use --lts`                          |
| Enable structured logs        | Easier parsing & debugging      | `npm i winston` or `pino`                    |
| Configure graceful shutdown   | Prevent data loss on restart    | Handle `SIGTERM` and `SIGINT`                |
| Use process manager           | Auto-restart, clustering        | PM2, systemd, Docker                         |

## Security

| Task                          | Why                                       | How                                      |
| ----------------------------- | ----------------------------------------- | ---------------------------------------- |
| Use `helmet`                  | Protects from XSS, sniffing, clickjacking | `npm i helmet`, `app.use(helmet())`      |
| Configure CORS                | Restrict who can access API               | `npm i cors`, restrict origins           |
| Enforce HTTPS                 | Encrypts data in transit                  | SSL certs via NGINX or Let's Encrypt     |
| Disable `x-powered-by` header | Hide Express identity                     | `app.disable('x-powered-by')`            |
| Validate all inputs           | Prevent injections & bad data             | `express-validator`, `joi`               |
| Sanitize input                | Block HTML/script injection               | `npm i express-mongo-sanitize xss-clean` |
| Implement rate limiting       | Prevent DoS/brute force                   | `npm i express-rate-limit`               |
| Secure cookies                | Prevent hijacking                         | `HttpOnly`, `Secure`, `SameSite`         |
| Use CSRF protection           | Prevent cross-site request forgery        | `npm i csurf`                            |
| Use short-lived JWTs          | Limit damage if stolen                    | `expiresIn: '15m'`                       |
| Hash passwords                | Prevent leaks of plain passwords          | `bcrypt.hash(password, 10)`              |
| Don't log secrets             | Prevent data leaks in logs                | Filter out sensitive info                |
| Run app as non-root           | Limit damage on compromise                | `USER node` in Dockerfile                |
| Use dependency scanners       | Detect malicious packages                 | `npm audit`, `snyk test`                 |
| Restrict allowed file uploads | Prevent malicious files                   | Validate MIME types, size limits         |

## Performance & Optimization

| Task                      | Why                                   | How                                           |
| ------------------------- | ------------------------------------- | --------------------------------------------- |
| Enable GZIP compression   | Reduce bandwidth usage                | `npm i compression`, `app.use(compression())` |
| Use clustering            | Utilize all CPU cores                 | `pm2 start app.js -i max`                     |
| Use caching               | Reduce DB load, improve response time | Redis, CDN, or `node-cache`                   |
| Optimize database queries | Prevent latency & heavy load          | Use indexes, pagination                       |
| Set request timeouts      | Avoid hanging connections             | `server.timeout = 10000`                      |
| Avoid blocking operations | Keep event loop responsive            | Offload CPU-heavy tasks to workers            |
| Use async/await           | Avoid callback hell & improve clarity | Built-in async syntax                         |
| Minify static files       | Reduce asset size                     | Use a build pipeline or CDN                   |
| Use connection pooling    | Reuse DB connections efficiently      | Use ORM/driver pooling options                |

##  Logging & Monitoring

| Task                         | Why                                      | How                                           |
| ---------------------------- | ---------------------------------------- | --------------------------------------------- |
| Implement structured logging | Easier parsing for log systems           | `winston` or `pino` JSON format               |
| Enable request logging       | Trace requests & issues                  | `npm i morgan`, `app.use(morgan('combined'))` |
| Create health check endpoint | Enable uptime monitoring                 | `/healthz` returns `{ status: 'ok' }`         |
| Add error logging            | Detect runtime exceptions                | Global error handler middleware               |
| Use centralized logging      | Aggregate logs from multiple servers     | ELK, Graylog, or CloudWatch                   |
| Monitor metrics              | Observe performance (CPU, mem, reqs/sec) | `prom-client`, Prometheus, Grafana            |
| Track errors                 | Catch unhandled exceptions               | Sentry, Rollbar                               |
| Log user actions (safely)    | Useful for audit trails                  | Log anonymized actions only                   |

## Code Quality & Maintenance

| Task                      | Why                         | How                           |
| ------------------------- | --------------------------- | ----------------------------- |
| Enforce linting rules     | Consistent code, fewer bugs | `eslint` + `prettier`         |
| Run automated tests       | Ensure correctness          | `jest` + `supertest`          |
| Add integration tests     | Verify API endpoints        | Test routes + DB interactions |
| Use code coverage         | Ensure completeness         | `jest --coverage`             |
| Setup CI/CD pipeline      | Automated build/test/deploy | GitHub Actions, GitLab CI     |
| Review dependencies       | Remove unused ones          | `depcheck`                    |
| Document API              | Ease of use & maintenance   | Swagger, Postman Collection   |
| Version your API          | Backward compatibility      | `/v1`, `/v2` endpoints        |
| Use TypeScript (optional) | Catch type errors early     | `npx tsc --init`              |

## Database & Data Integrity

| Task                        | Why                     | How                                |
| --------------------------- | ----------------------- | ---------------------------------- |
| Use migrations              | Consistent schema       | `sequelize-cli`, `knex`, or Prisma |
| Backup DB regularly         | Disaster recovery       | Cron jobs, cloud backups           |
| Limit query results         | Prevent overfetching    | Pagination (`limit` + `offset`)    |
| Encrypt sensitive fields    | Protect PII             | AES, field-level encryption        |
| Validate DB schema          | Maintain data integrity | ORM validation                     |
| Use read replicas if needed | Load balancing          | Database replication setup         |

## Deployment & Infrastructure

| Task                        | Why                               | How                                 |
| --------------------------- | --------------------------------- | ----------------------------------- |
| Dockerize app               | Reproducible environments         | Dockerfile + `.dockerignore`        |
| Use reverse proxy           | Handle SSL, rate limits, gzip     | NGINX, Caddy                        |
| Redirect HTTP => HTTPS      | Enforce encryption                | NGINX rule                          |
| Enable automatic restart    | Prevent downtime                  | PM2 or systemd                      |
| Add log rotation            | Prevent disk overflow             | `pm2 logrotate` or `logrotate.conf` |
| Set resource limits         | Avoid memory leaks killing server | `pm2 --max-memory-restart`          |
| Enable monitoring dashboard | Observe uptime                    | PM2 monit, Grafana                  |
| Store secrets securely      | Prevent .env leaks                | AWS Secrets Manager, Docker secrets |
| Run as non-root             | Reduce risk                       | Dockerfile: `USER node`             |
| Set up automatic backups    | Data retention                    | Cron, scripts, cloud backup         |
| Use CDN for assets          | Reduce load, increase speed       | Cloudflare, AWS CloudFront          |
| Configure firewall          | Restrict ports                    | `ufw allow 80,443`, deny others     |
| Separate environments       | Isolate dev/test/prod             | Different `.env` + DBs              |

## Example Quick Commands Setup

```sh
# Setup environment
export NODE_ENV=production
npm ci

# Security
npm i helmet cors express-rate-limit compression dotenv

# Logging
npm i morgan winston

# Validation & Security
npm i express-validator bcrypt jsonwebtoken express-mongo-sanitize xss-clean

# Run app
pm2 start src/app.js -i max --name myapp
pm2 save && pm2 startup
```

## Verification Checklist Before Go-Live

- [ ] Server runs on `NODE_ENV=production`
- [ ] HTTPS enforced & working
- [ ] All secrets loaded from `.env` (not in code)
- [ ] Helmet, CORS, rate limiting enabled
- [ ] All routes validated & sanitized
- [ ] JWT expiry short and verified
- [ ] No stack traces shown in production errors
- [ ] Logs are structured and central
- [ ] Health check endpoint returns `{status: \"ok\"}`
- [ ] Database has automatic backups
- [ ] PM2 or systemd restarts app on crash
- [ ] Error notifications via Sentry
- [ ] CI/CD tests pass before deployment
- [ ] Firewall only allows HTTP/HTTPS/SSH
- [ ] Uptime monitor active
- [ ] Backup restore tested successfully
- [ ] Resource limits configured
- [ ] No open debug ports  