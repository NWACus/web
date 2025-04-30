# Using Semantic Class Names for Themes

Date: 2025-04-30

Status: accepted

## Context

[Shadcn uses CSS Variables](https://ui.shadcn.com/docs/theming#css-variables) to enable theming based on [Tailwind's suggested approach](https://v3.tailwindcss.com/docs/customizing-colors#using-css-variables) to defining colors using CSS Variables.

Tailwind theme's colors are extended with names that point at CSS Variables:

```
// globals.css
@layer base {
  :root {
    --primary: 240 5.9% 10%;
    --primary-foreground: 0 0% 98%;
  }
}

```

```
// tailwind.config.mjs
theme: {
  extend: {
    colors: {
      primary: {
        DEFAULT: 'hsl(var(--primary))',
        foreground: 'hsl(var(--primary-foreground))',
      }
    }
  }
}
```

This setup let's you use classnames like `bg-primary` and `text-primary-foreground` that can result in different colors depending on the value of the CSS Variable. This is how Shadcn and Tailwind allows for theming while being able to use the same class names in your code.

Shadcn components are written using the semantic classnames that the library has chosen to support. Shadcn also uses a pattern of defining background and text color combinations using the naming syntax where the background color is the semantic name and the text color is suffixed with `foreground`.

So `primary-foreground` is intended to be an appropriately contrasting text color displayed in front of a background that uses the `primary` variable. You'll often see this as: `<div className="bg-primary text-primary-foreground" />`.

Shadcn uses the following semantic names ([list of variables](https://ui.shadcn.com/docs/theming#list-of-variables)):

| Semantic Name     | Associated Foreground Variable      |
|-------------------|-------------------------------------|
| radius            | - (not a color)                     |
| background        | background-foreground               |
| card              | card-foreground                     |
| popover           | popover-foreground                  |
| primary           | primary-foreground                  |
| secondary         | secondary-foreground                |
| muted             | muted-foreground                    |
| accent            | accent-foreground                   |
| destructive       | destructive-foreground              |
| border            | -                                   |
| input             | -                                   |
| ring              | -                                   |
| chart-1           | chart-1-foreground                  |
| chart-2           | chart-2-foreground                  |
| chart-3           | chart-3-foreground                  |
| chart-4           | chart-4-foreground                  |
| chart-5           | chart-5-foreground                  |
| sidebar           | sidebar-foreground                  |
| sidebar-primary   | sidebar-primary-foreground          |
| sidebar-accent    | sidebar-accent-foreground           |
| sidebar-border    | -                                   |
| sidebar-ring      | -                                   |

## Decision
### Using a subset of Shadcn class names + some custom ones

Shadcn's class names cover us pretty well but we want to extend this list and exclude a few that we don't expect to use. The list of class names we'll support in a theme are:

| Semantic Name         | Associated Foreground Variable | Notes                           |
|-----------------------|--------------------------|---------------------------------------|
| background            | background-foreground    |                                       |
| card                  | card-foreground          |                                       |
| popover               | popover-foreground       |                                       |
| primary               | primary-foreground       |                                       |
| secondary             | secondary-foreground     |                                       |
| muted                 | muted-foreground         |                                       |
| accent                | accent-foreground        |                                       |
| destructive           | destructive-foreground   |                                       |
| border                | -                        |                                       |
| input                 | -                        |                                       |
| ring                  | -                        |                                       |
| radius                | -                        | Not a color, but included for completeness |
| header                | header-foreground        | **Custom**                            |
| footer                | footer-foreground        | **Custom**                            |
| callout               | callout-foreground       | **Custom**                            |
| brand-50 ... brand-950| brand-foreground-50 ... brand-foreground-950 | **Custom** Brand color scale         |
| success               | -                        | **Custom** Status color               |
| warning               | -                        | **Custom** Status color               |
| error                 | -                        | **Custom** Status color               |

We are extending the Shadcn set with custom variables for `header`, `footer`, `callout`, and a full `brand` color scale (with matching foregrounds). We are also adding `success`, `warning`, and `error` for status messaging. Some Shadcn variables like `sidebar` and chart colors are omitted for now, as we don't expect to use them.

The `brand` color scale is intended to be a bail out for designers when we need another color that the other semantic class names don't provide. An idea is to let a content editor choose a section's (i.e. block) background color from a dropdown of a subset of tailwind colors (associated with classnames) and their brand-50 to brand-950 colors. But they may be used elsewhere too.

This approach gives us a consistent set of semantic class names for theming, while allowing flexibility for our own design needs.

### Toggling themes

We will use this CSS Variables pattern to toggle themes between avalanche centers. Each avalanche center could have a light mode and a dark mode.

We would have a theme defined in our globals.css for each avalanche center like:

```
// globals.css
@layer base {
  :root {
    --primary: 240 5.9% 10%;
    --primary-foreground: 0 0% 98%;
    ...
  }

  .nwac {
    --primary: 217 62% 21%;
    --primary-foreground: 0 0% 98%;
    ...
  }

  .sac {
    --primary: 202, 63%, 45%;
    --primary-foreground: 0 0% 98%;
    ...
  }
}

```

Then we can apply the appropriate class based on the avalanche center:

```
export default async function RootLayout({ children, params }: Args) {
  const { center } = await params

  return (
    <main className={center}>
      <Header center={center} />
      {children}
      <Footer center={center} />
    </main>
  )
}
```

The :root variables will be defined as the slate theme from Shadcn as the default. A theme can override all or some of the variables.

### Dark mode

This approach could support a dark mode version for each avalanche center by providing a dark theme for each center:

```
  .nwac {
    --primary: 217 62% 21%;
    --primary-foreground: 0 0% 98%;
    ...
  }

  .dark.nwac {
    /* Placeholder for a dark theme for each avalanche center */
  }
```

We'll need a more complex setup for this like the light/dark mode toggle that came with the Payload website template. See https://github.com/NWACus/web/pull/130 which removed that.

But assuming that we'll have a dark mode for each theme will enable us to use [dark modifiers](https://v3.tailwindcss.com/docs/dark-mode#toggling-dark-mode-manually) for elements that need it (not all will).

## Consequences

This setup assumes that we're defining the theme for each avalanche center manually in globals.css. For the first few avalanche centers this is fine. But as we onboard more and more we'll need to be able to either easily generate themes based on brand colors or allow full control over the theme from the payload admin panel. Either of these things are possible following the fundamentals of this approach. We will just need to determine how to inject the values of the customized css variables.

This decision primarily focuses on defining the semantic class names we want to use/support in each theme so those class names can be used during development of the frontend.
