/**
 * Small static info marker for weather-table field help. Renders an "ⓘ" whose native title shows
 * the help text as plain text. This is deliberately NOT the glossary tooltip system (issue 06) —
 * it is the weather table's own hardcoded/structural help.
 */

// Strip HTML tags/entities to plain text for the title attribute (help strings are controlled).
function toPlainText(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function WeatherInfoHint({ content }: { content: string }) {
  const text = toPlainText(content)
  return (
    <span
      title={text}
      aria-label={text}
      className="ml-1 cursor-help align-middle text-xs text-muted-foreground"
    >
      ⓘ
    </span>
  )
}
