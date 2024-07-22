import type { ChainModifiers, Entry, EntryFieldTypes, EntrySkeletonType, LocaleCode } from "contentful";

export interface TypeNewsFields {
    newsTitle?: EntryFieldTypes.Symbol;
    newsDescription?: EntryFieldTypes.RichText;
    newsDate?: EntryFieldTypes.Symbol;
}

export type TypeNewsSkeleton = EntrySkeletonType<TypeNewsFields, "news">;
export type TypeNews<Modifiers extends ChainModifiers, Locales extends LocaleCode = LocaleCode> = Entry<TypeNewsSkeleton, Modifiers, Locales>;

export function isTypeNews<Modifiers extends ChainModifiers, Locales extends LocaleCode>(entry: Entry<EntrySkeletonType, Modifiers, Locales>): entry is TypeNews<Modifiers, Locales> {
    return entry.sys.contentType.sys.id === 'news'
}
