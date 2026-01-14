'use client'

export const GettingStartedWidget = () => {
  return (
    <div className="getting-started-widget card">
      <h3 className="card__title">Getting started</h3>
      <a
        href="https://avy-fx.notion.site/23b5af40f1988035a071e397e3780103?v=23b5af40f19880dcae89000c75417e41"
        target="_blank"
        rel="noopener noreferrer"
        className="getting-started-widget__link"
      >
        View docs
      </a>

      <style>{`
        .getting-started-widget {
          flex-direction: column;
          align-items: flex-start;
        }

        .getting-started-widget__link {
          color: var(--theme-elevation-500);
          text-decoration: none;
          font-size: 0.875rem;
        }

        .getting-started-widget__link:hover {
          color: var(--theme-text);
          text-decoration: underline;
        }
      `}</style>
    </div>
  )
}

export default GettingStartedWidget
