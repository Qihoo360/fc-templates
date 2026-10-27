# Security

OpenDots is an application template under development, not a hosted service. The local prototype is single-owner; Space membership, Slack identity mapping, and voice delegation require additional enforcement before connected multi-user use. It is not a security-audited autonomous agent.

## Intended boundary

- Run local development on loopback.
- Protect remote deployments with authentication and HTTPS.
- Keep the browser service isolated from the application host and private networks. Do not expose its port publicly.
- Keep Intelligence, model, speech, and browser credentials on the server. Never commit `.env` files or local databases.
- Treat page text, uploaded content, and model output as untrusted data, not authorization to change permissions.
- Authorize every Space, Dot, and thread operation on the server. Map Slack actors explicitly; never treat a display name or client-supplied user ID as proof of identity.
- Voice sessions must use scoped, short-lived credentials and route compute actions through the same permissions as text and Slack.
- Research browsing is read-only. Page tools can edit local documents in the executing Dot’s Space; those writes use revision checks. Adding external writes requires a separate authorization and review design.

Recurring work requires an available server. A sample run is not evidence that a live provider or deployment is safe or configured correctly. Review results before using them for important decisions.

## Reporting

Use the repository's private vulnerability reporting feature when available. If it is unavailable, open an issue asking for a private reporting channel without including exploit details, credentials, private URLs, or personal data.

Do not post sensitive reproduction data in a public issue. This project does not currently promise a response-time SLA or offer a bug bounty.
