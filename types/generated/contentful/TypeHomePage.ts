import type { ChainModifiers, Entry, EntryFieldTypes, EntrySkeletonType, LocaleCode } from "contentful";
import type { TypeForecastMapSkeleton } from "./TypeForecastMap";
import type { TypeNewsSkeleton } from "./TypeNews";

export interface TypeHomePageFields {
    centerId?: EntryFieldTypes.Symbol;
    forecast?: EntryFieldTypes.EntryLink<TypeForecastMapSkeleton>;
    news?: EntryFieldTypes.EntryLink<TypeNewsSkeleton>;
}

export type TypeHomePageSkeleton = EntrySkeletonType<TypeHomePageFields, "homePage">;
export type TypeHomePage<Modifiers extends ChainModifiers, Locales extends LocaleCode = LocaleCode> = Entry<TypeHomePageSkeleton, Modifiers, Locales>;

export function isTypeHomePage<Modifiers extends ChainModifiers, Locales extends LocaleCode>(entry: Entry<EntrySkeletonType, Modifiers, Locales>): entry is TypeHomePage<Modifiers, Locales> {
    return entry.sys.contentType.sys.id === 'homePage'
}
