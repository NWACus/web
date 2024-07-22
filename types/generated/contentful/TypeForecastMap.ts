import type { ChainModifiers, Entry, EntryFieldTypes, EntrySkeletonType, LocaleCode } from "contentful";

export interface TypeForecastMapFields {
    forecastHeader?: EntryFieldTypes.Symbol;
    widgetUrl?: EntryFieldTypes.Symbol;
}

export type TypeForecastMapSkeleton = EntrySkeletonType<TypeForecastMapFields, "forecastMap">;
export type TypeForecastMap<Modifiers extends ChainModifiers, Locales extends LocaleCode = LocaleCode> = Entry<TypeForecastMapSkeleton, Modifiers, Locales>;

export function isTypeForecastMap<Modifiers extends ChainModifiers, Locales extends LocaleCode>(entry: Entry<EntrySkeletonType, Modifiers, Locales>): entry is TypeForecastMap<Modifiers, Locales> {
    return entry.sys.contentType.sys.id === 'forecastMap'
}
