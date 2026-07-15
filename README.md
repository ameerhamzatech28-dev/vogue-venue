# Ten11 Pizza Valley — Vercel Edition

Same site as the PHP build, converted to run on Vercel's free tier:
- `index.html` — was `index.php`; the menu is now static HTML (no PHP available on Vercel)
- `api/contact-handler.js` — was `php/contact-handler.php`; a Vercel serverless
  function (Node.js) that emails the order using your own Gmail account over SMTP
- Everything else (scroll-scrubbed hero, background-removed spinning burger,
  3D tilt menu cards) is unchanged front-end JS/CSS — none of that needed PHP.

## 1. Get a Gmail "App Password" (free, ~2 minutes)
Regular Gmail passwords don't work for sending mail from code — Google
requires a separate 16-character "App Password":
1. On the Gmail account you want orders sent from (e.g.
   `ten11pizzavalley@gmail.com`), turn on **2-Step Verification** at
   https://myaccount.google.com/security (required before App Passwords appear).
2. Go to https://myaccount.google.com/apppasswords
3. Create a new app password (name it anything, e.g. "Ten11 Website").
4. Copy the 16-character password shown — you'll paste it into Vercel in step 3 below.

## 2. Deploy to Vercel (free)
**Easiest path — no command line needed:**
1. Create a free account at https://vercel.com (you can sign up with GitHub, GitLab, or email).
2. Put this folder in a GitHub repo (create a new repo, upload all these files).
3. In Vercel: **Add New → Project**, import that GitHub repo, click **Deploy**.
   Vercel auto-detects the static files + the `/api` function — no build
   configuration needed.

**Or via the command line, if you have Node installed:**
```bash
npm install -g vercel
cd ten11-pizza-website-vercel
vercel        # follow the prompts, then...
vercel --prod
```

## 3. Add the environment variables
In your new Vercel project: **Settings → Environment Variables**, add:

| Name | Value |
|---|---|
| `GMAIL_USER` | `ten11pizzavalley@gmail.com` |
| `GMAIL_APP_PASSWORD` | the 16-character app password from step 1 |

Then redeploy once (Vercel → Deployments → ⋯ → Redeploy) so the function
picks up the new variables.

## 4. Test it
Open your `.vercel.app` URL, scroll to the order form, submit a test order,
and confirm the email lands in `ten11pizzavalley@gmail.com`.

## Editing the menu
There's no database — the menu lives directly in `index.html` as plain
HTML cards (search for `menu-grid`). Duplicate a `.menu-card` block and
edit the tag/name/description/price for each item you want to add.

## Using your own domain
Vercel's free tier includes custom domains: **Settings → Domains** → add
`ten11pizzavalley.com` (or whatever you own) and follow the DNS instructions
it gives you.

## Deploying to Netlify instead
This repo also works on Netlify — it includes both function formats:
- `netlify/functions/contact-handler.js` — Netlify's format (currently active;
  the form's `action` in `index.html` points here)
- `api/contact-handler.js` — Vercel's format (kept in case you switch back;
  unused on Netlify)

**Netlify's "Build settings" screen**, when connecting this repo:
| Field | Value |
|---|---|
| Branch to deploy | `main` |
| Base directory | *(leave empty)* |
| Build command | *(leave empty — it's already static, no build step)* |
| Publish directory | *(leave empty, or `.`)* |
| Functions directory | *(leave empty — `netlify.toml` in this repo already sets it to `netlify/functions`)* |

Then add the same two environment variables under **Site configuration →
Environment variables**: `GMAIL_USER` and `GMAIL_APP_PASSWORD` (see the Gmail
App Password steps above), and redeploy once so the function picks them up.

## A note on cost
Everything above is free: Vercel's Hobby plan, GitHub, and Gmail SMTP all
have no cost for a site at this scale. The only thing you'd ever pay for
is a custom domain name itself (bought elsewhere, e.g. Namecheap/GoDaddy),
which isn't required — you already get a free `yourproject.vercel.app` URL.
