import type { ChainModifiers, Entry, EntryFieldTypes, EntrySkeletonType, LocaleCode } from "contentful";
import type { TypeOneColumnSkeleton } from "./TypeOneColumn";
import type { TypeSimpleArticleSkeleton } from "./TypeSimpleArticle";

export interface TypeTwoColumnsFields {
    layout: EntryFieldTypes.Symbol<"Two Columns - Even Split (50%/50%)" | "Two Columns - Left Aside (25%/75%)" | "Two Columns - Left Heavy (66%/33%)" | "Two Columns - Right Aside (75%/25%)" | "Two Columns - Right Heavy (33%/66%)">;
    leftContent: EntryFieldTypes.Array<EntryFieldTypes.EntryLink<TypeOneColumnSkeleton | TypeSimpleArticleSkeleton>>;
    rightContent: EntryFieldTypes.Array<EntryFieldTypes.EntryLink<TypeOneColumnSkeleton | TypeSimpleArticleSkeleton>>;
}

export type TypeTwoColumnsSkeleton = EntrySkeletonType<TypeTwoColumnsFields, "twoColumns">;
export type TypeTwoColumns<Modifiers extends ChainModifiers, Locales extends LocaleCode = LocaleCode> = Entry<TypeTwoColumnsSkeleton, Modifiers, Locales>;

export function isTypeTwoColumns<Modifiers extends ChainModifiers, Locales extends LocaleCode>(entry: Entry<EntrySkeletonType, Modifiers, Locales>): entry is TypeTwoColumns<Modifiers, Locales> {
    return entry.sys.contentType.sys.id === 'twoColumns'
}
