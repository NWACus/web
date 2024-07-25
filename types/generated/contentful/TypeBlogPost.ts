import type { ChainModifiers, Entry, EntryFieldTypes, EntrySkeletonType, LocaleCode } from "contentful";
import type { TypeBiographySkeleton } from "./TypeBiography";

export interface TypeBlogPostFields {
    internalTitle: EntryFieldTypes.Symbol;
    slug: EntryFieldTypes.Symbol;
    title: EntryFieldTypes.Symbol;
    subtitle?: EntryFieldTypes.Symbol;
    date: EntryFieldTypes.Date;
    author?: EntryFieldTypes.Array<EntryFieldTypes.EntryLink<TypeBiographySkeleton>>;
    image: EntryFieldTypes.AssetLink;
    body: EntryFieldTypes.RichText;
}

export type TypeBlogPostSkeleton = EntrySkeletonType<TypeBlogPostFields, "blogPost">;
export type TypeBlogPost<Modifiers extends ChainModifiers, Locales extends LocaleCode = LocaleCode> = Entry<TypeBlogPostSkeleton, Modifiers, Locales>;

export function isTypeBlogPost<Modifiers extends ChainModifiers, Locales extends LocaleCode>(entry: Entry<EntrySkeletonType, Modifiers, Locales>): entry is TypeBlogPost<Modifiers, Locales> {
    return entry.sys.contentType.sys.id === 'blogPost'
}
