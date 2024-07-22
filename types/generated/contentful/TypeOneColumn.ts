import type { ChainModifiers, Entry, EntryFieldTypes, EntrySkeletonType, LocaleCode } from "contentful";
import type { TypeSimpleArticleSkeleton } from "./TypeSimpleArticle";
import type { TypeTwoColumnsSkeleton } from "./TypeTwoColumns";

export interface TypeOneColumnFields {
    layout: EntryFieldTypes.Symbol<"One Column - Full Screen (100%)">;
    content: EntryFieldTypes.Array<EntryFieldTypes.EntryLink<TypeOneColumnSkeleton | TypeSimpleArticleSkeleton | TypeTwoColumnsSkeleton>>;
}

export type TypeOneColumnSkeleton = EntrySkeletonType<TypeOneColumnFields, "oneColumn">;
export type TypeOneColumn<Modifiers extends ChainModifiers, Locales extends LocaleCode = LocaleCode> = Entry<TypeOneColumnSkeleton, Modifiers, Locales>;

export function isTypeOneColumn<Modifiers extends ChainModifiers, Locales extends LocaleCode>(entry: Entry<EntrySkeletonType, Modifiers, Locales>): entry is TypeOneColumn<Modifiers, Locales> {
    return entry.sys.contentType.sys.id === 'oneColumn'
}
