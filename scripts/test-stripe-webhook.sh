#!/bin/bash
# Stripe Webhook Local Test Script
# Prerequisites: stripe CLI installed, .env.local configured
#
# Usage:
#   1. Start dev server: npm run dev
#   2. In another terminal: stripe listen --forward-to localhost:3000/api/webhooks/stripe
#   3. In a third terminal: bash scripts/test-stripe-webhook.sh
#
# This triggers test events via Stripe CLI.

set -e

echo "=== FamilyMind Stripe Webhook Test ==="
echo ""
echo "Ensure your dev server is running on localhost:3000"
echo "Ensure stripe listen is forwarding to localhost:3000/api/webhooks/stripe"
echo ""

# Test 1: checkout.session.completed
echo "[1/3] Triggering checkout.session.completed..."
stripe trigger checkout.session.completed
echo "  -> Check server logs for entitlement creation"
echo ""

# Test 2: customer.subscription.updated
echo "[2/3] Triggering customer.subscription.updated..."
stripe trigger customer.subscription.updated
echo "  -> Check server logs for subscription status update"
echo ""

# Test 3: customer.subscription.deleted
echo "[3/3] Triggering customer.subscription.deleted..."
stripe trigger customer.subscription.deleted
echo "  -> Check server logs for subscription cancellation"
echo ""

echo "=== Manual verification checklist ==="
echo "[ ] Entitlement created in database after checkout.session.completed"
echo "[ ] Entitlement status updated after subscription.updated"
echo "[ ] Entitlement cancelled after subscription.deleted"
echo "[ ] No duplicate entitlements on retry (idempotency)"
echo "[ ] Bundle purchase creates entitlements for all included products"
