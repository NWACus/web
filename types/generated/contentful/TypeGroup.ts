import type { ChainModifiers, Entry, EntryFieldTypes, EntrySkeletonType, LocaleCode } from "contentful";
import type { TypeBiographySkeleton } from "./TypeBiography";

export interface TypeGroupFields {
    name: EntryFieldTypes.Symbol;
    member: EntryFieldTypes.Array<EntryFieldTypes.EntryLink<TypeBiographySkeleton>>;
}

export type TypeGroupSkeleton = EntrySkeletonType<TypeGroupFields, "group">;
export type TypeGroup<Modifiers extends ChainModifiers, Locales extends LocaleCode = LocaleCode> = Entry<TypeGroupSkeleton, Modifiers, Locales>;

export function isTypeGroup<Modifiers extends ChainModifiers, Locales extends LocaleCode>(entry: Entry<EntrySkeletonType, Modifiers, Locales>): entry is TypeGroup<Modifiers, Locales> {
    return entry.sys.contentType.sys.id === 'group'
}
