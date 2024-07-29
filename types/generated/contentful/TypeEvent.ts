import type { ChainModifiers, Entry, EntryFieldTypes, EntrySkeletonType, LocaleCode } from "contentful";

export interface TypeEventFields {
    internalName?: EntryFieldTypes.Symbol;
    name: EntryFieldTypes.Symbol;
    slug: EntryFieldTypes.Symbol;
    locationName: EntryFieldTypes.Symbol;
    location?: EntryFieldTypes.Location;
    date: EntryFieldTypes.Date;
    endDate?: EntryFieldTypes.Date;
    blurb?: EntryFieldTypes.Symbol;
    about: EntryFieldTypes.RichText;
    labels?: EntryFieldTypes.Array<EntryFieldTypes.Symbol>;
    image: EntryFieldTypes.AssetLink;
    facebookLink?: EntryFieldTypes.Symbol;
    entryPrice?: EntryFieldTypes.Number;
    externalLink?: EntryFieldTypes.Symbol;
}

export type TypeEventSkeleton = EntrySkeletonType<TypeEventFields, "event">;
export type TypeEvent<Modifiers extends ChainModifiers, Locales extends LocaleCode = LocaleCode> = Entry<TypeEventSkeleton, Modifiers, Locales>;

export function isTypeEvent<Modifiers extends ChainModifiers, Locales extends LocaleCode>(entry: Entry<EntrySkeletonType, Modifiers, Locales>): entry is TypeEvent<Modifiers, Locales> {
    return entry.sys.contentType.sys.id === 'event'
}
