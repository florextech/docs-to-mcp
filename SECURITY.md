# Security Policy

## Reporting a Vulnerability

If you find a security vulnerability, please **do not** open a public issue.

Email **security@florexlabs.com** with:

- Description of the vulnerability
- Steps to reproduce
- Potential impact

We will respond within 48 hours.

## Scope

- URL injection or SSRF in the crawler
- Command injection via user input
- Sensitive data exposure in embeddings or logs
- Dependency vulnerabilities

## Safe Defaults

- Crawler is restricted to same-origin by default
- No shell execution from user-controlled input
- Local embeddings stay on your machine
- URLs are sanitized and normalized
