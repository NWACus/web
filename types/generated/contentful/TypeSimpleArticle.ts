import type { ChainModifiers, Entry, EntryFieldTypes, EntrySkeletonType, LocaleCode } from "contentful";

export interface TypeSimpleArticleFields {
    internalTitle: EntryFieldTypes.Symbol;
}

export type TypeSimpleArticleSkeleton = EntrySkeletonType<TypeSimpleArticleFields, "simpleArticle">;
export type TypeSimpleArticle<Modifiers extends ChainModifiers, Locales extends LocaleCode = LocaleCode> = Entry<TypeSimpleArticleSkeleton, Modifiers, Locales>;

export function isTypeSimpleArticle<Modifiers extends ChainModifiers, Locales extends LocaleCode>(entry: Entry<EntrySkeletonType, Modifiers, Locales>): entry is TypeSimpleArticle<Modifiers, Locales> {
    return entry.sys.contentType.sys.id === 'simpleArticle'
}
