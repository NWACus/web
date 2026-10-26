/**
 * The legacy widget's section help (`helpContent` in its `constants/forecasts.js`), verbatim apart
 * from markup: its `nac-*` classes are dropped, the danger link's stray doubled quote
 * (`danger-scale/""`) is fixed, and links that open a tab get `rel="noopener noreferrer"`.
 */
import { DANGER_SCALE_URL } from '@/services/nac/dangerScale'

const AVALANCHE_PROBLEM_URL = 'https://avalanche.org/avalanche-encyclopedia/avalanche-problem/'

const newTabLink = (href: string, text: string) =>
  `<a href="${href}" target="_blank" rel="noopener noreferrer">${text}</a>`

export const AVALANCHE_DANGER_HELP = `<p><strong>Avalanche Danger</strong> is a tool used by avalanche forecasters to communicate the potential for avalanches to cause harm or injury to backcountry travelers.</p><p>Watch this ${newTabLink(DANGER_SCALE_URL, 'video')} to learn more about Avalanche Danger.</p>`

export const AVALANCHE_PROBLEMS_HELP = `<p><strong>Avalanche Problems</strong> use four factors to give a more nuanced description of the days avalanche conditions: the type of potential avalanche, its location in the terrain, the likelihood of triggering it, and the potential size of the avalanche.</p><p>Watch this ${newTabLink(AVALANCHE_PROBLEM_URL, 'video')} to learn more about Avalanche Problems.</p>`
