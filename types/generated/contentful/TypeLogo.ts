import type { ChainModifiers, Entry, EntryFieldTypes, EntrySkeletonType, LocaleCode } from "contentful";

export interface TypeLogoFields {
    icon: EntryFieldTypes.AssetLink;
}

export type TypeLogoSkeleton = EntrySkeletonType<TypeLogoFields, "logo">;
export type TypeLogo<Modifiers extends ChainModifiers, Locales extends LocaleCode = LocaleCode> = Entry<TypeLogoSkeleton, Modifiers, Locales>;

export function isTypeLogo<Modifiers extends ChainModifiers, Locales extends LocaleCode>(entry: Entry<EntrySkeletonType, Modifiers, Locales>): entry is TypeLogo<Modifiers, Locales> {
    return entry.sys.contentType.sys.id === 'logo'
}
