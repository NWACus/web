'use client'

import { SeedButton } from './SeedButton.client'

const BeforeDashboard = (props: { showDevAction: boolean }) => {
  const { showDevAction } = props
  return (
    <>
      {showDevAction ?? (
        <div className="pt-6">
          <h2>Dev Mode Actions</h2>
          <SeedButton />
        </div>
      )}
      <div className="dashboard__group">
        <h2 className="dashboard__label">Getting started</h2>
        <a
          href="https://avy-fx.notion.site/23b5af40f1988035a071e397e3780103?v=23b5af40f19880dcae89000c75417e41"
          target="_blank"
        >
          View docs
        </a>
      </div>
    </>
  )
}

export default BeforeDashboard
