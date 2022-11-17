/**
 * NOTE: the variable below should be used across ALL zustand stores
 * that are using such zustand middlewares:
 * devOnlyDevtools(..)
 * devtools(..)
 * This will allow you to use rewind state feature
 * of redux devtools extension, without having to switch between different connection tabs from
 * the dropdown menu, which may be very inconvenient.
 */
export const reactDevtoolsConnectionName =
  'Bears & Bees - demo for better zustand devtools middleware'
