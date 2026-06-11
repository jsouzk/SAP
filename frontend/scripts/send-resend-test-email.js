/* global process */

import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY || "re_xxxxxxxxx";

if (apiKey === "re_xxxxxxxxx") {
  console.error("Replace re_xxxxxxxxx with your real Resend API key, or set RESEND_API_KEY before running this script.");
  process.exit(1);
}

const resend = new Resend(apiKey);

const { data, error } = await resend.emails.send({
  from: "onboarding@resend.dev",
  to: "juliodesouzaif@gmail.com",
  subject: "Hello World",
  html: "<p>Congrats on sending your <strong>first email</strong>!</p>",
});

if (error) {
  console.error({ error });
  process.exit(1);
}

console.log({ data });
