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

**Authentication → Emails → Magic Link** (the email template): **skip this for now.** Supabase only allows template changes once your own email service (SMTP) is connected, so until then sign-in uses the standard email link. Do this part before launch, together with the SMTP setup under "Worth knowing":

People will sign in with a 6-digit code from their email rather than a link. A link opens in the phone's browser, not the installed app, so on iPhone it would sign in the wrong place. Replace the template's body with:

```html
<h2>Your sign-in code</h2>
<p>Enter this code in NZ Property Tracker:</p>
<p style="font-size:28px;letter-spacing:4px"><b>{{ .Token }}</b></p>
<p>If you didn't ask for this, you can ignore this email.</p>
```

Set **Subject** to `Your NZ Property Tracker code`, then **Save**.

## 4. Send me the two keys

Open **Project Settings → API Keys** (or **Data API**) and copy:
- the **Project URL**, like `https://abcdefghijkl.supabase.co`
- the **publishable key** (called **anon public** on older projects)

Both are safe to paste here. They're meant to be in the app's code, and the security rules from step 2 are what protect the data.

**Never share the `secret` / `service_role` key.** It gets past every rule.

## Worth knowing

- **Email limit.** Supabase's built-in email only sends a few sign-in emails an hour. That's fine for testing. Before real users, connect an email service like Resend (free for 3,000 a month) under **Authentication → Emails → SMTP Settings**.
- **Free projects pause** after a week with no use, and you restore them from the dashboard. Upgrade to Pro (about US$25 a month) before launch.
- **Privacy.** Once the app stores people's data, you'll need a short privacy policy (NZ Privacy Act 2020) saying:
  - what's stored and where (Supabase, Sydney)
  - who can see it
  - how to delete it

  The app will have a "Delete my account and data" button.
