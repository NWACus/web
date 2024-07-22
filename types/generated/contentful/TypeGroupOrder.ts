import type { ChainModifiers, Entry, EntryFieldTypes, EntrySkeletonType, LocaleCode } from "contentful";
import type { TypeGroupSkeleton } from "./TypeGroup";

export interface TypeGroupOrderFields {
    internalName: EntryFieldTypes.Symbol;
    groups?: EntryFieldTypes.Array<EntryFieldTypes.EntryLink<TypeGroupSkeleton>>;
}

export type TypeGroupOrderSkeleton = EntrySkeletonType<TypeGroupOrderFields, "groupOrder">;
export type TypeGroupOrder<Modifiers extends ChainModifiers, Locales extends LocaleCode = LocaleCode> = Entry<TypeGroupOrderSkeleton, Modifiers, Locales>;

export function isTypeGroupOrder<Modifiers extends ChainModifiers, Locales extends LocaleCode>(entry: Entry<EntrySkeletonType, Modifiers, Locales>): entry is TypeGroupOrder<Modifiers, Locales> {
    return entry.sys.contentType.sys.id === 'groupOrder'
}
