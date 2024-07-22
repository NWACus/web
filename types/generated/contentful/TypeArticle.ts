import type { ChainModifiers, Entry, EntryFieldTypes, EntrySkeletonType, LocaleCode } from "contentful";
import type { TypeOneColumnSkeleton } from "./TypeOneColumn";
import type { TypeSimpleArticleSkeleton } from "./TypeSimpleArticle";
import type { TypeTwoColumnsSkeleton } from "./TypeTwoColumns";

export interface TypeArticleFields {
    title: EntryFieldTypes.Symbol;
    internalTitle: EntryFieldTypes.Symbol;
    slug: EntryFieldTypes.Symbol;
    content: EntryFieldTypes.Array<EntryFieldTypes.EntryLink<TypeOneColumnSkeleton | TypeSimpleArticleSkeleton | TypeTwoColumnsSkeleton>>;
}

export type TypeArticleSkeleton = EntrySkeletonType<TypeArticleFields, "article">;
export type TypeArticle<Modifiers extends ChainModifiers, Locales extends LocaleCode = LocaleCode> = Entry<TypeArticleSkeleton, Modifiers, Locales>;

export function isTypeArticle<Modifiers extends ChainModifiers, Locales extends LocaleCode>(entry: Entry<EntrySkeletonType, Modifiers, Locales>): entry is TypeArticle<Modifiers, Locales> {
    return entry.sys.contentType.sys.id === 'article'
}
