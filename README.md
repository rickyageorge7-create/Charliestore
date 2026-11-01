# Liberia Tech Market

A production-oriented electronics e-commerce platform for the Liberian market, built as a Node.js + Express + SQLite application.

## Quick start

1. Install dependencies:
   npm install
2. Copy the environment template:
   copy .env.example .env
3. Update credentials for your environment.
4. Start the app:
   npm start
5. Open http://localhost:3000

## Included features

- Product catalog with search, category filtering, and featured items
- Shopping cart and checkout flow
- Customer registration/login and guest checkout support
- Order lifecycle management with delivery counties and configurable shipping fees
- Admin dashboard for products, inventory, orders, and customers
- SQLite database with structured backend data models
- Modular payment provider service ready for Orange Money and card gateways

## Payment requirements and provider guidance

This project is intentionally designed to avoid fake or unauthenticated payment flows. Payment processing is only activated when valid merchant credentials are configured in the environment.

### Orange Money

Orange Money in Liberia requires a merchant account or approved payment integration from Orange or an authorized local payment aggregator. Typical requirements include:

- registered business information
- valid tax or business registration documents
- a merchant account with the payment provider
- API credentials, webhook secret, and live environment access
- completion of onboarding/verification and transaction testing

### Bank cards

For Visa and Mastercard, use a payment gateway that can legally onboard Liberian merchants and supports the country/market. Typical modern options include Stripe or a regional aggregator with Liberia support, but each requires merchant verification and approved credentials before live transactions are possible.

This application includes an adapter pattern so that the gateway can be swapped without rewriting the storefront. Without credentials, the app keeps payment requests in a secure "not configured" state and never falsely reports payment success.

## Admin login

The seeded admin account is:

- Email: admin@liberiatech.market
- Password: Admin@123

Change the password after first login or update the environment variables.

## Local development notes

- The SQLite database file is stored in `data/store.db`.
- Product and order data can be managed via the admin dashboard.
- Product images are loaded from publicly available URLs; for production, replace them with your own hosted images.
