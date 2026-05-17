#!/bin/bash
# theme-push.sh — Shopify theme push shortcuts
# Usage: ./scripts/theme-push.sh [target]
# Requires: shopify CLI authenticated (`shopify auth login`)

set -e

STORE="pitsmithco.com"  # change per project
THEME_DIR="."           # run from theme root

push_settings() {
  echo "→ Pushing settings_data.json only..."
  shopify theme push --store=$STORE --only config/settings_data.json
}

push_templates() {
  echo "→ Pushing product templates..."
  shopify theme push --store=$STORE --only templates/product.json
  shopify theme push --store=$STORE --only templates/index.json
}

push_sections() {
  echo "→ Pushing modified sections..."
  shopify theme push --store=$STORE --only sections/
}

push_all() {
  echo "→ Full theme push (use carefully)..."
  shopify theme push --store=$STORE
}

push_safe() {
  echo "→ Safe push: settings + templates only (no liquid edits)..."
  push_settings
  push_templates
}

# Route based on argument
case "$1" in
  settings)    push_settings ;;
  templates)   push_templates ;;
  sections)    push_sections ;;
  all)         push_all ;;
  safe|"")     push_safe ;;
  *)           echo "Usage: ./theme-push.sh [settings|templates|sections|all|safe]" ;;
esac
