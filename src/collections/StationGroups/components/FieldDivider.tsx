// Payload has no divider field type, so a `ui` field renders this instead. The
// table layout is a different kind of decision from the page's name and region,
// and a rule between them says so without hiding either behind a tab.
export function FieldDivider() {
  return (
    <hr
      style={{
        border: 'none',
        borderTop: '1px solid var(--theme-elevation-150)',
        margin: 'calc(var(--base) * 0.5) 0',
        width: '100%',
      }}
    />
  )
}
