// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import { serve } from "https://deno.land/std@0.182.0/http/server.ts";

console.log("Starting send-email Edge Function...");

serve(async (req: Request) => {
  if (req.method !== "POST") {
    console.error(`Invalid request method: ${req.method}`);
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    console.log("Parsing request payload...");

    // Parse incoming request
    const payload = await req.json();
    console.log("Received payload:", payload);

    const { email, name } = payload;
    const SENDER_EMAIL = Deno.env.get("SENDER_EMAIL"); // FIXME  use sender email

    // Validate payload
    if (!email || !name) {
      console.error("Invalid payload: Missing email or name.");
      return new Response("Invalid payload", { status: 400 });
    }

    console.log("Payload validated. Preparing email data...");

    // Prepare email data for Brevo
    const emailData = {
      sender: { email: SENDER_EMAIL, name: "Mutts in the 6ix" },
      to: [{ email, name }],
      subject: "Thank You!",
      htmlContent: `<p>Hi <span style="color:lightpurple">${name}</span>, thank you for signing the Mutts In The 6ix waiver form! We hope you and your dog have a great time at our event!</p><br><p>We'd love to hear your feedback on the event, please fill out this <a href="https://forms.gle/LzvaJ7UYywM7pwMx7">feedback form</a>!</p>`,
    };

    console.log("Email data prepared.", emailData);

    // Fetch Brevo API key securely from environment variables
    const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY");
    const BREVO_URL = "https://api.brevo.com/v3/smtp/email";

    if (!BREVO_API_KEY) {
      console.error("Missing Brevo API Key.");
      return new Response("Internal Server Error: Missing API Key", {
        status: 500,
      });
    }

    console.log("Sending email via Brevo API...");

    // Prepare API request
    const response = await fetch(BREVO_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": BREVO_API_KEY,
      },
      body: JSON.stringify(emailData),
    });

    console.log(`Brevo API response status: ${response.status}`, response);

    // Log response data in case of failure
    const responseData = await response.text();

    if (!response.ok) {
      console.error("Brevo API Error:", responseData);
      return new Response(`Failed to send email: ${responseData}`, {
        status: 500,
      });
    }

    console.log("Email sent successfully!");
    return new Response("Email sent successfully!", { status: 200 });
  } catch (error) {
    console.error("Unhandled error:", error.message);
    return new Response("Internal Server Error", { status: 500 });
  }
});
