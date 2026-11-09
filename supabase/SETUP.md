# Setting up Supabase for sync

About 15 minutes. Everything here is in the Supabase website; nothing to install.

## 1. Create the project

1. Go to [supabase.com](https://supabase.com) and choose **Start your project**. Signing up with GitHub is easiest (you already use it for the app).
2. Choose **New project**:
   - **Name:** `nz-property-tracker`
   - **Database password:** choose **Generate a password** and save it in your password manager. The app never needs it, but you'd need it to manage the database later.
   - **Region:** **Asia-Pacific (Sydney)**, the closest to NZ, so syncing is quick.
   - **Plan:** Free is fine for now.
3. Wait a minute or two while it sets up.

## 2. Create the table and security rules

1. In the left menu, open **SQL Editor**, then **New query**.
2. Open `supabase/schema.sql` from this project, copy all of it, paste it in, and choose **Run**.
3. It should say **Success. No rows returned**. If it shows an error, copy the message to me.

This creates:
- the `props` table (one row per property)
- a private `files` storage area for receipts and photos
- the rules that stop anyone seeing anyone else's data
- the function behind a "Delete my account" button

## 3. Sign-in settings

**Authentication → URL Configuration**
- **Site URL:** `https://literal-aiden.github.io/NZ-Property-Track/`
- Under **Redirect URLs**, add both:
  - `https://literal-aiden.github.io/NZ-Property-Track/**`
  - `http://localhost:8765/**` (so I can test in the preview)

**Authentication → Emails → Templates** (done once custom SMTP is set up, below): people sign in with the code from the email, because a link opens in the phone's browser, not the installed app, so on iPhone it would sign in the wrong place. The link stays in the email for computers and Android. Put this in both **Magic link or OTP** and **Confirm signup** (first-time sign-ins get that one):

```html
<h2>Your sign-in code</h2>
<p>Enter this code in Rent &amp; Reno:</p>
<p style="font-size:28px;letter-spacing:4px;margin:16px 0"><b>{{ .Token }}</b></p>
<p>Or tap this link to sign in on this device:<br>
<a href="{{ .ConfirmationURL }}">Sign in to Rent &amp; Reno</a></p>
<p style="color:#76665f;font-size:13px">If you didn't ask for this, you can ignore this email.</p>
```

Set **Subject** to `Your Rent & Reno code`, then **Save changes**. If emails still arrive with the old text, make a small change (a space at the end) and save again. Set to 6 digits under **Authentication → Sign In / Providers → Email → Email OTP Length** (the app also accepts 8).

## 4. Send me the two keys

Open **Project Settings → API Keys** (or **Data API**) and copy:
- the **Project URL**, like `https://abcdefghijkl.supabase.co`
- the **publishable key** (called **anon public** on older projects)

Both are safe to paste here. They're meant to be in the app's code, and the security rules from step 2 are what protect the data.

**Never share the `secret` / `service_role` key.** It gets past every rule.

## Worth knowing

- **Email service (done).** Sign-in emails go through Resend: in Supabase, **Authentication → Emails → SMTP Settings** with host `smtp.resend.com`, port `465`, username `resend`, and a Resend API key (sending access only) as the password. Never paste that key anywhere else. Supabase's built-in email allowed only about 2 an hour; with Resend the limit is under **Authentication → Rate Limits**. Until your own domain is verified in Resend, the sender `onboarding@resend.dev` only reaches your own Resend account's email.
- **Free projects pause** after a week with no use, and you restore them from the dashboard. Until you upgrade to Pro (about US$25 a month, worth it before launch), `.github/workflows/keepalive.yml` keeps it awake: GitHub calls the database's `ping()` function every 3 days. It needs the `ping()` part of `schema.sql` to have been run. GitHub emails you if a run fails, and switches scheduled runs off if the repo has no commits for 60 days (it says so on the Actions tab; turn it back on there). Delete the workflow once you're on Pro.
- **Privacy.** Once the app stores people's data, you'll need a short privacy policy (NZ Privacy Act 2020) saying:
  - what's stored and where (Supabase, Sydney)
  - who can see it
  - how to delete it

  The app will have a "Delete my account and data" button.
