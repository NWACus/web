import type { ChainModifiers, Entry, EntryFieldTypes, EntrySkeletonType, LocaleCode } from "contentful";
import type { TypeArticleSkeleton } from "./TypeArticle";
import type { TypeSimpleArticleSkeleton } from "./TypeSimpleArticle";

export interface TypeAboutFields {
    internalName: EntryFieldTypes.Symbol;
    articles: EntryFieldTypes.Array<EntryFieldTypes.EntryLink<TypeArticleSkeleton | TypeSimpleArticleSkeleton>>;
}

export type TypeAboutSkeleton = EntrySkeletonType<TypeAboutFields, "about">;
export type TypeAbout<Modifiers extends ChainModifiers, Locales extends LocaleCode = LocaleCode> = Entry<TypeAboutSkeleton, Modifiers, Locales>;

export function isTypeAbout<Modifiers extends ChainModifiers, Locales extends LocaleCode>(entry: Entry<EntrySkeletonType, Modifiers, Locales>): entry is TypeAbout<Modifiers, Locales> {
    return entry.sys.contentType.sys.id === 'about'
}
