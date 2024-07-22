import type { ChainModifiers, Entry, EntryFieldTypes, EntrySkeletonType, LocaleCode } from "contentful";

export interface TypeTestFields {
    test?: EntryFieldTypes.RichText;
}

export type TypeTestSkeleton = EntrySkeletonType<TypeTestFields, "test">;
export type TypeTest<Modifiers extends ChainModifiers, Locales extends LocaleCode = LocaleCode> = Entry<TypeTestSkeleton, Modifiers, Locales>;

export function isTypeTest<Modifiers extends ChainModifiers, Locales extends LocaleCode>(entry: Entry<EntrySkeletonType, Modifiers, Locales>): entry is TypeTest<Modifiers, Locales> {
    return entry.sys.contentType.sys.id === 'test'
}
