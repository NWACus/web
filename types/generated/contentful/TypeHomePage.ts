import type { ChainModifiers, Entry, EntryFieldTypes, EntrySkeletonType, LocaleCode } from "contentful";

export interface TypeHomePageFields {
    centerId?: EntryFieldTypes.Symbol;
    centerLogo?: EntryFieldTypes.AssetLink;
}

export type TypeHomePageSkeleton = EntrySkeletonType<TypeHomePageFields, "homePage">;
export type TypeHomePage<Modifiers extends ChainModifiers, Locales extends LocaleCode = LocaleCode> = Entry<TypeHomePageSkeleton, Modifiers, Locales>;

export function isTypeHomePage<Modifiers extends ChainModifiers, Locales extends LocaleCode>(entry: Entry<EntrySkeletonType, Modifiers, Locales>): entry is TypeHomePage<Modifiers, Locales> {
    return entry.sys.contentType.sys.id === 'homePage'
}
