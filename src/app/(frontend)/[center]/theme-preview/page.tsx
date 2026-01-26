import type { Metadata } from 'next/types'

import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { getEnvironmentFriendlyName } from '@/utilities/getEnvironmentFriendlyName'
import { notFound } from 'next/navigation'

export const dynamic = 'force-static'

const disallowedEnvironments = ['prod', 'unknown']

export async function generateStaticParams() {
  const payload = await getPayload({ config: configPromise })

  const environment = getEnvironmentFriendlyName()

  if (disallowedEnvironments.includes(environment)) {
    return []
  }

  const tenants = await payload.find({
    collection: 'tenants',
    limit: 1000,
    select: {
      slug: true,
    },
  })

  return tenants.docs.map((tenant): PathArgs => ({ center: tenant.slug }))
}

type Args = {
  params: Promise<PathArgs>
}

type PathArgs = {
  center: string
}

export default async function Page({ params }: Args) {
  const environment = getEnvironmentFriendlyName()

  if (disallowedEnvironments.includes(environment)) {
    notFound()
  }

  const { center } = await params
  return (
    <div className="pt-4">
      <div className="container mb-16 grid gap-14">
        <h1 className="text-3xl font-bold mb-6">Theme Preview for {center.toUpperCase()}</h1>

        <div>
          <div className="space-y-4">
            {[100, 200, 300, 400, 500, 600, 700, 800, 900].map((weight) => (
              <div key={weight} className="flex items-center gap-6">
                <p
                  style={{
                    fontWeight: weight,
                    fontStyle: 'normal',
                  }}
                  className="text-lg"
                >
                  {weight} Normal
                </p>
                <p
                  style={{
                    fontWeight: weight,
                    fontStyle: 'italic',
                  }}
                  className="text-lg"
                >
                  {weight} Italic
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-8">
          <h2 className="text-xl font-semibold">Semantic Class Colors</h2>

          <div className="grid gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {/* background & foreground */}
            <section className="space-y-2">
              <h3 className="text-lg font-semibold">background / foreground</h3>
              <div className="flex flex-wrap gap-4">
                <div
                  className="w-32 h-32 flex-shrink-0 rounded-full border bg-background flex items-center justify-center"
                  title="bg-background"
                >
                  <span className="text-foreground text-sm font-medium">Background</span>
                </div>
              </div>
            </section>

            {/* card */}
            <section className="space-y-2">
              <h3 className="text-lg font-semibold">card</h3>
              <div className="flex flex-wrap gap-4">
                <div
                  className="w-32 h-32 flex-shrink-0 rounded-full border bg-card flex items-center justify-center"
                  title="bg-card"
                >
                  <span className="text-card-foreground text-sm font-medium">Card</span>
                </div>
              </div>
            </section>

            {/* popover */}
            <section className="space-y-2">
              <h3 className="text-lg font-semibold">popover</h3>
              <div className="flex flex-wrap gap-4">
                <div
                  className="w-32 h-32 flex-shrink-0 rounded-full border bg-popover flex items-center justify-center"
                  title="bg-popover"
                >
                  <span className="text-popover-foreground text-sm font-medium">Popover</span>
                </div>
              </div>
            </section>

            {/* primary */}
            <section className="space-y-2">
              <h3 className="text-lg font-semibold">primary</h3>
              <div className="flex flex-wrap gap-4">
                <div
                  className="w-32 h-32 flex-shrink-0 rounded-full border bg-primary flex items-center justify-center"
                  title="bg-primary"
                >
                  <span className="text-primary-foreground text-sm font-medium">Primary</span>
                </div>
              </div>
            </section>

            {/* secondary */}
            <section className="space-y-2">
              <h3 className="text-lg font-semibold">secondary</h3>
              <div className="flex flex-wrap gap-4">
                <div
                  className="w-32 h-32 flex-shrink-0 rounded-full border bg-secondary flex items-center justify-center"
                  title="bg-secondary"
                >
                  <span className="text-secondary-foreground text-sm font-medium">Secondary</span>
                </div>
              </div>
            </section>

            {/* muted */}
            <section className="space-y-2">
              <h3 className="text-lg font-semibold">muted</h3>
              <div className="flex flex-wrap gap-4">
                <div
                  className="w-32 h-32 flex-shrink-0 rounded-full border bg-muted flex items-center justify-center"
                  title="bg-muted"
                >
                  <span className="text-muted-foreground text-sm font-medium">Muted</span>
                </div>
              </div>
            </section>

            {/* accent */}
            <section className="space-y-2">
              <h3 className="text-lg font-semibold">accent</h3>
              <div className="flex flex-wrap gap-4">
                <div
                  className="w-32 h-32 flex-shrink-0 rounded-full border bg-accent flex items-center justify-center"
                  title="bg-accent"
                >
                  <span className="text-accent-foreground text-sm font-medium">Accent</span>
                </div>
              </div>
            </section>

            {/* destructive */}
            <section className="space-y-2">
              <h3 className="text-lg font-semibold">destructive</h3>
              <div className="flex flex-wrap gap-4">
                <div
                  className="w-32 h-32 flex-shrink-0 rounded-full border bg-destructive flex items-center justify-center"
                  title="bg-destructive"
                >
                  <span className="text-destructive-foreground text-sm font-medium">
                    Destructive
                  </span>
                </div>
              </div>
            </section>

            {/* border, input, ring */}
            <section className="space-y-2">
              <h3 className="text-lg font-semibold">border / input / ring</h3>
              <div className="flex flex-wrap gap-4">
                <div
                  className="w-32 h-32 flex-shrink-0 rounded-full border-4 border-border flex items-center justify-center"
                  title="border-border"
                >
                  <span className="text-foreground text-sm font-medium">Border</span>
                </div>
                <div
                  className="w-32 h-32 flex-shrink-0 rounded-full border-4 border-input flex items-center justify-center"
                  title="border-input"
                >
                  <span className="text-foreground text-sm font-medium">Input</span>
                </div>
                <div
                  className="w-32 h-32 flex-shrink-0 rounded-full border-4 border-ring flex items-center justify-center"
                  title="border-ring"
                >
                  <span className="text-foreground text-sm font-medium">Ring</span>
                </div>
              </div>
            </section>

            {/* header */}
            <section className="space-y-2">
              <h3 className="text-lg font-semibold">header</h3>
              <div className="flex flex-wrap gap-4">
                <div
                  className="w-32 h-32 flex-shrink-0 rounded-full border bg-header flex items-center justify-center"
                  title="bg-header"
                >
                  <span className="text-header-foreground text-sm font-medium">Header</span>
                </div>
              </div>
            </section>

            {/* footer */}
            <section className="space-y-2">
              <h3 className="text-lg font-semibold">footer</h3>
              <div className="flex flex-wrap gap-4">
                <div
                  className="w-32 h-32 flex-shrink-0 rounded-full border bg-footer flex items-center justify-center"
                  title="bg-footer"
                >
                  <span className="text-footer-foreground text-sm font-medium">Footer</span>
                </div>
              </div>
            </section>

            {/* callout */}
            <section className="space-y-2">
              <h3 className="text-lg font-semibold">callout</h3>
              <div className="flex flex-wrap gap-4">
                <div
                  className="w-32 h-32 flex-shrink-0 rounded-full border bg-callout flex items-center justify-center"
                  title="bg-callout"
                >
                  <span className="text-callout-foreground text-sm font-medium">Callout</span>
                </div>
              </div>
            </section>

            {/* brand */}
            <section className="space-y-2">
              <h3 className="text-lg font-semibold">brand</h3>
              <div className="flex flex-wrap gap-2">
                <div
                  className="w-20 h-20 rounded-full border bg-brand flex items-center justify-center"
                  title="bg-brand"
                >
                  <span className="text-brand-foreground text-sm font-medium">Default</span>
                </div>
                <div
                  className="w-20 h-20 rounded-full border bg-brand-50 flex items-center justify-center"
                  title="bg-brand-50"
                >
                  <span className="text-brand-foreground-50 text-sm font-medium">50</span>
                </div>
                <div
                  className="w-20 h-20 rounded-full border bg-brand-100 flex items-center justify-center"
                  title="bg-brand-100"
                >
                  <span className="text-brand-foreground-100 text-sm font-medium">100</span>
                </div>
                <div
                  className="w-20 h-20 rounded-full border bg-brand-200 flex items-center justify-center"
                  title="bg-brand-200"
                >
                  <span className="text-brand-foreground-200 text-sm font-medium">200</span>
                </div>
                <div
                  className="w-20 h-20 rounded-full border bg-brand-300 flex items-center justify-center"
                  title="bg-brand-300"
                >
                  <span className="text-brand-foreground-300 text-sm font-medium">300</span>
                </div>
                <div
                  className="w-20 h-20 rounded-full border bg-brand-400 flex items-center justify-center"
                  title="bg-brand-400"
                >
                  <span className="text-brand-foreground-400 text-sm font-medium">400</span>
                </div>
                <div
                  className="w-20 h-20 rounded-full border bg-brand-500 flex items-center justify-center"
                  title="bg-brand-500"
                >
                  <span className="text-brand-foreground-500 text-sm font-medium">500</span>
                </div>
                <div
                  className="w-20 h-20 rounded-full border bg-brand-600 flex items-center justify-center"
                  title="bg-brand-600"
                >
                  <span className="text-brand-foreground-600 text-sm font-medium">600</span>
                </div>
                <div
                  className="w-20 h-20 rounded-full border bg-brand-700 flex items-center justify-center"
                  title="bg-brand-700"
                >
                  <span className="text-brand-foreground-700 text-sm font-medium">700</span>
                </div>
                <div
                  className="w-20 h-20 rounded-full border bg-brand-800 flex items-center justify-center"
                  title="bg-brand-800"
                >
                  <span className="text-brand-foreground-800 text-sm font-medium">800</span>
                </div>
                <div
                  className="w-20 h-20 rounded-full border bg-brand-900 flex items-center justify-center"
                  title="bg-brand-900"
                >
                  <span className="text-brand-foreground-900 text-sm font-medium">900</span>
                </div>
                <div
                  className="w-20 h-20 rounded-full border bg-brand-950 flex items-center justify-center"
                  title="bg-brand-950"
                >
                  <span className="text-brand-foreground-950 text-sm font-medium">950</span>
                </div>
              </div>
            </section>

            {/* success, warning, error */}
            <section className="space-y-2">
              <h3 className="text-lg font-semibold">success / warning / error</h3>
              <div className="flex space-x-4">
                <div
                  className="w-32 h-32 flex-shrink-0 rounded-full border bg-success flex items-center justify-center"
                  title="bg-success"
                >
                  <span className="text-success-foreground text-sm font-medium">Success</span>
                </div>
                <div
                  className="w-32 h-32 flex-shrink-0 rounded-full border bg-warning flex items-center justify-center"
                  title="bg-warning"
                >
                  <span className="text-warning-foreground text-sm font-medium">Warning</span>
                </div>
                <div
                  className="w-32 h-32 flex-shrink-0 rounded-full border bg-error flex items-center justify-center"
                  title="bg-error"
                >
                  <span className="text-error-foreground text-sm font-medium">Error</span>
                </div>
              </div>
            </section>
          </div>
        </div>

        <div className="grid gap-8">
          <h2 className="text-xl font-semibold">Shadcn Components</h2>

          {/* Avatar */}
          <section className="space-y-2">
            <h3 className="text-lg font-semibold">Avatar</h3>
            <div className="flex space-x-4">
              <Avatar isCircle>
                <AvatarImage src="http://www.gravatar.com/avatar/?d=mp" alt="User Avatar" />
                <AvatarFallback>CN</AvatarFallback>
              </Avatar>
              <Avatar isCircle>
                <AvatarImage src="http://www.gravatar.com/avatar/?d=mp" alt="User Avatar" />
                <AvatarFallback>AN</AvatarFallback>
              </Avatar>
            </div>
          </section>

          {/* Button */}
          <section className="space-y-2">
            <h3 className="text-lg font-semibold">Button</h3>
            <div className="flex flex-wrap gap-2">
              <Button variant="default">Default</Button>
              <Button variant="destructive">Destructive</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="link">Link</Button>
            </div>
          </section>

          {/* Card */}
          <section className="space-y-2">
            <h3 className="text-lg font-semibold">Card</h3>
            <Card>
              <CardHeader>
                <CardTitle>Card Title</CardTitle>
                <CardDescription>Card Description</CardDescription>
              </CardHeader>
              <CardContent>
                <p>This is the main content of the card.</p>
              </CardContent>
              <CardFooter>
                <Button>Action</Button>
              </CardFooter>
            </Card>
          </section>

          {/* Checkbox */}
          <section className="space-y-2">
            <h3 className="text-lg font-semibold">Checkbox</h3>
            <div className="flex items-center space-x-2">
              <Checkbox id="terms" />
              <Label htmlFor="terms">Accept terms and conditions</Label>
            </div>
          </section>

          {/* Input */}
          <section className="space-y-2">
            <h3 className="text-lg font-semibold">Input</h3>
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="name">Name</Label>
              <Input type="text" id="name" placeholder="Enter your name" />
            </div>
          </section>

          {/* Label */}
          <section className="space-y-2">
            <h3 className="text-lg font-semibold">Label</h3>
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input type="email" id="email" placeholder="example@example.com" />
            </div>
          </section>

          {/* Pagination */}
          <section className="space-y-2">
            <h3 className="text-lg font-semibold">Pagination</h3>
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious />
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink>1</PaginationLink>
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink isActive>2</PaginationLink>
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink>3</PaginationLink>
                </PaginationItem>
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
                <PaginationItem>
                  <PaginationNext />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </section>

          {/* Popover */}
          <section className="space-y-2">
            <h3 className="text-lg font-semibold">Popover</h3>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline">Open Popover</Button>
              </PopoverTrigger>
              <PopoverContent className="w-64">
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium leading-none">Dimensions</h4>
                    <p className="text-sm text-muted-foreground">
                      Set the dimensions for the layer.
                    </p>
                  </div>
                  <div className="grid gap-2">
                    <div className="grid grid-cols-3 items-center gap-4">
                      <Label htmlFor="width">Width</Label>
                      <Input id="width" defaultValue="100%" className="col-span-2" />
                    </div>
                    <div className="grid grid-cols-3 items-center gap-4">
                      <Label htmlFor="height">Height</Label>
                      <Input id="height" defaultValue="25px" className="col-span-2" />
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </section>

          {/* Select */}
          <section className="space-y-2">
            <h3 className="text-lg font-semibold">Select</h3>
            <Select>
              <SelectTrigger className="w-full max-w-sm">
                <SelectValue placeholder="Select a fruit" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Fruits</SelectLabel>
                  <SelectItem value="apple">Apple</SelectItem>
                  <SelectItem value="banana">Banana</SelectItem>
                  <SelectItem value="orange">Orange</SelectItem>
                  <SelectItem value="grape">Grape</SelectItem>
                  <SelectItem value="strawberry">Strawberry</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </section>

          {/* Textarea */}
          <section className="space-y-2">
            <h3 className="text-lg font-semibold">Textarea</h3>
            <div className="grid w-full max-w-sm gap-1.5">
              <Label htmlFor="message">Your message</Label>
              <Textarea placeholder="Type your message here" id="message" />
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const payload = await getPayload({ config: configPromise })
  const { center } = await params
  const tenant = await payload.find({
    collection: 'tenants',
    select: {
      name: true,
    },
    where: {
      slug: {
        equals: center,
      },
    },
  })

  return {
    title:
      tenant.docs.length < 1
        ? 'Avalanche Center Theme Preview'
        : `${tenant.docs[0].name} - Theme Preview`,
  }
}
