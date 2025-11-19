import { Icons } from '../ui/icons'

export const NACDisclaimer = () => {
  return (
    <div className="container p-8 flex gap-8 items-center border border-l-4 rounded shadow hover:shadow-md text-gray border-gray border-s-secondary">
      <div className="text-secondary">
        <Icons.avyCaution />
      </div>
      <div>
        Observations document past conditions. They are not predictive and should not be confused
        with an avalanche forecast. Public observations are not checked for accuracy. A lack of
        reported avalanches does not mean no avalanches occurred.
      </div>
    </div>
  )
}
