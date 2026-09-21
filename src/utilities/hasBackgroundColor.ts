// Whether a block's background color picker value paints anything. The page is
// white, so `white` and `transparent` (the picker's default) both read as none.
export function hasBackgroundColor(backgroundColor?: string | null): boolean {
  return !!backgroundColor && backgroundColor !== 'transparent' && backgroundColor !== 'white'
}
