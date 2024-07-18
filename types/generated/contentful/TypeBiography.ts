import type { ChainModifiers, Entry, EntryFieldTypes, EntrySkeletonType, LocaleCode } from "contentful";

export interface TypeBiographyFields {
    firstName: EntryFieldTypes.Symbol;
    lastName: EntryFieldTypes.Symbol;
    email?: EntryFieldTypes.Symbol;
    title?: EntryFieldTypes.Symbol;
    startDate?: EntryFieldTypes.Date;
    biography?: EntryFieldTypes.Text;
    photo: EntryFieldTypes.AssetLink;
}

export type TypeBiographySkeleton = EntrySkeletonType<TypeBiographyFields, "biography">;
export type TypeBiography<Modifiers extends ChainModifiers, Locales extends LocaleCode = LocaleCode> = Entry<TypeBiographySkeleton, Modifiers, Locales>;

export function isTypeBiography<Modifiers extends ChainModifiers, Locales extends LocaleCode>(entry: Entry<EntrySkeletonType, Modifiers, Locales>): entry is TypeBiography<Modifiers, Locales> {
    return entry.sys.contentType.sys.id === 'biography'
}
