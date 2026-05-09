import * as Sentry from "@sentry/node"


Sentry.init({
  dsn: "https://b54f20112ad606f57a3a9b6bb18dae12@o4511357982212096.ingest.us.sentry.io/4511357988306944",
  // Setting this option to true will send default PII data to Sentry.
  // For example, automatic IP address collection on events
  sendDefaultPii: true,
});