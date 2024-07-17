import type { ChainModifiers, Entry, EntryFieldTypes, EntrySkeletonType, LocaleCode } from "contentful";
import type { TypeBiographySkeleton } from "./TypeBiography";

export interface TypeQuestionAndAnswerFields {
    question: EntryFieldTypes.Symbol;
    answer: EntryFieldTypes.Text;
    who?: EntryFieldTypes.EntryLink<TypeBiographySkeleton>;
}

export type TypeQuestionAndAnswerSkeleton = EntrySkeletonType<TypeQuestionAndAnswerFields, "questionAndAnswer">;
export type TypeQuestionAndAnswer<Modifiers extends ChainModifiers, Locales extends LocaleCode = LocaleCode> = Entry<TypeQuestionAndAnswerSkeleton, Modifiers, Locales>;

export function isTypeQuestionAndAnswer<Modifiers extends ChainModifiers, Locales extends LocaleCode>(entry: Entry<EntrySkeletonType, Modifiers, Locales>): entry is TypeQuestionAndAnswer<Modifiers, Locales> {
    return entry.sys.contentType.sys.id === 'questionAndAnswer'
}
