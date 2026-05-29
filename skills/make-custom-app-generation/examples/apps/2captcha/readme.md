# 2Captcha Make app

Production-ready local Make custom app for 2Captcha API v2. Authentication uses the documented `clientKey` JSON field against `https://api.2captcha.com`.

Included modules (11 total including the universal fallback):

- Make an API Call
- Get Balance
- Create Image-to-Text Task
- Create reCAPTCHA V2 Task
- Create reCAPTCHA V3 Task
- Create hCaptcha Task
- Create Cloudflare Turnstile Task
- Create Custom Task
- Get Task Result
- Report Correct Solution
- Report Incorrect Solution

No webhooks are included because the selected 2Captcha API endpoints do not provide webhook registration lifecycle endpoints for Make to attach/detach.

Docs: https://2captcha.com/api-docs
