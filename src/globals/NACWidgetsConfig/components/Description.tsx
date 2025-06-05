export function Description() {
  return (
    <div className="mb-12 flex flex-col gap-4">
      <p>
        Controls the baseUrl and version used for loading of NAC widgets across all Avy-Web
        avalanche center websites.
      </p>
      <p>
        The version should typically be set to "latest" but can be changed to a specific date
        version if needed.
      </p>
      <p>
        The version refers to the published date version of the{' '}
        <a href="https://github.com/NationalAvalancheCenter" target="_blank" rel="noreferrer">
          afp-public-widgets
        </a>{' '}
        repo. <a href="mailto:chris@avalanche.org">Chris Lundy</a> is the point of contact if there
        is an issue with widget loading.
      </p>
    </div>
  )
}
