import { isUser } from '@/utilities/isUser'
import { Button } from '@payloadcms/ui'
import { BookOpenText, HelpCircle } from 'lucide-react'
import Link from 'next/link'
import { WidgetServerProps } from 'payload'

export async function GettingStartedWidget({ req }: WidgetServerProps) {
  const name = isUser(req.user) ? req.user.name : undefined

  return (
    <div className="card flex flex-col gap-8 mb-4">
      <div className="flex flex-col gap-4">
        <h3>Getting Started</h3>
        <p>Welcome to AvyWeb{name && `, ${name}`}.</p>
      </div>
      <div className="flex items-center gap-2">
        <Link
          href="https://avy-fx.notion.site/Avy-3205af40f19880efb0a5f5910a9cbdb4"
          title="Help"
          target="_blank"
        >
          <Button
            buttonStyle="subtle"
            iconPosition="left"
            icon={<BookOpenText className="w-5 h-5 flex-shrink-0" />}
            className="m-0"
          >
            Read the Docs
          </Button>
        </Link>
        <Link
          href="https://avy-fx.notion.site/Help-2cb5af40f19880dfb71af06a3bd0ae90"
          title="Help"
          target="_blank"
        >
          <Button
            buttonStyle="subtle"
            iconPosition="left"
            icon={<HelpCircle className="w-5 h-5 flex-shrink-0" />}
            className="m-0"
          >
            Get Help
          </Button>
        </Link>
      </div>
    </div>
  )
}
