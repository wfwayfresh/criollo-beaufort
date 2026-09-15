// Emails website form submissions to the owner.
//
// Every form on the site posts here. The subject line always leads with the
// restaurant name so a submission is identifiable at a glance in the inbox —
// both restaurants send to the same address.
//
// Env (set on the Vercel project):
//   ENQUIRY_TO              where submissions land (kept out of the code — the repo is public)
//   WES_GMAIL_USER          SMTP account (also the From address; Gmail requires they match)
//   WES_GMAIL_APP_PASSWORD  Gmail app password for that account

const nodemailer = require("nodemailer");

const SITE_NAME = "Criollo";
const TO = process.env.ENQUIRY_TO;

// Which form posted, and how its email should read.
const FORMS = {
  events: {
    label: "Private event enquiry",
    fields: [
      ["name", "Name"],
      ["email", "Email"],
      ["phone", "Phone"],
      ["date", "Preferred date"],
      ["type", "Occasion"],
      ["guests", "Guests"],
      ["message", "Details"],
    ],
  },
  contact: {
    label: "Website enquiry",
    fields: [
      ["name", "Name"],
      ["email", "Email"],
      ["message", "Message"],
    ],
  },
};

function parseBody(req) {
  const b = req.body;
  if (!b) return {};
  if (typeof b === "object") return b;
  if (typeof b === "string") {
    try {
      return JSON.parse(b);
    } catch {
      return Object.fromEntries(new URLSearchParams(b));
    }
  }
  return {};
}

const clean = (v) => (typeof v === "string" ? v.trim() : v == null ? "" : String(v).trim());

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const body = parseBody(req);

  // Honeypot: a real person never fills this in; bots fill everything.
  if (clean(body.company)) return res.status(200).json({ ok: true });

  const form = FORMS[clean(body.form)] || FORMS.contact;
  const name = clean(body.name);
  const email = clean(body.email);

  if (!name || !email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return res.status(400).json({ ok: false, error: "A name and a valid email address are required." });
  }

  const user = process.env.WES_GMAIL_USER;
  const pass = process.env.WES_GMAIL_APP_PASSWORD;
  if (!TO || !user || !pass) {
    console.error("[enquiry] ENQUIRY_TO or SMTP credentials missing — cannot send");
    return res.status(500).json({ ok: false, error: "Mail is not configured. Please call us instead." });
  }

  const lines = [`${SITE_NAME} — ${form.label.toLowerCase()} from the website.`, ""];
  for (const [key, label] of form.fields) {
    const v = clean(body[key]);
    if (v) lines.push(`${label}: ${v}`);
  }
  lines.push("", `Sent from the ${SITE_NAME} website.`);

  try {
    const transport = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: { user, pass },
    });
    await transport.sendMail({
      from: `"${SITE_NAME} website" <${user}>`,
      to: TO,
      replyTo: `"${name}" <${email}>`,
      subject: `${SITE_NAME} — ${form.label} from ${name}`,
      text: lines.join("\n"),
    });
  } catch (err) {
    console.error("[enquiry] send failed:", err);
    return res.status(502).json({ ok: false, error: "We couldn't send that just now. Please call us instead." });
  }

  // Browsers without JS get a redirect back to the page with a success flag.
  if ((req.headers.accept || "").includes("text/html")) {
    const back = clean(body.page) || "/";
    res.writeHead(303, { Location: `${back}?sent=1` });
    return res.end();
  }
  return res.status(200).json({ ok: true });
};
