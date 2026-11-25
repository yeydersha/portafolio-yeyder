/**
 * Utility functions for the portfolio project.
 * Contains cn (className concatenation) for Tailwind CSS v4.
 */

export const cn = (...classes: (string | boolean | undefined)[]) => {
  return classes.filter(Boolean).join(" ");
};