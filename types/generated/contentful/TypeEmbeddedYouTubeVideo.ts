import type { ChainModifiers, Entry, EntryFieldTypes, EntrySkeletonType, LocaleCode } from "contentful";

export interface TypeEmbeddedYouTubeVideoFields {
    internalName: EntryFieldTypes.Symbol;
    videoId: EntryFieldTypes.Symbol;
    thumbnail?: EntryFieldTypes.AssetLink;
}

export type TypeEmbeddedYouTubeVideoSkeleton = EntrySkeletonType<TypeEmbeddedYouTubeVideoFields, "embeddedYouTubeVideo">;
export type TypeEmbeddedYouTubeVideo<Modifiers extends ChainModifiers, Locales extends LocaleCode = LocaleCode> = Entry<TypeEmbeddedYouTubeVideoSkeleton, Modifiers, Locales>;

export function isTypeEmbeddedYouTubeVideo<Modifiers extends ChainModifiers, Locales extends LocaleCode>(entry: Entry<EntrySkeletonType, Modifiers, Locales>): entry is TypeEmbeddedYouTubeVideo<Modifiers, Locales> {
    return entry.sys.contentType.sys.id === 'embeddedYouTubeVideo'
}
