import { DuplicatePageFor as DuplicatePageFor_8f1d8961a356bec6784e5c591c016925 } from '@/collections/Pages/components/DuplicatePageFor'
import { CollectionsField as CollectionsField_49c0311020325b59204cc21d2f536b8d } from '@/collections/Roles/components/CollectionsField'
import { RulesCell as RulesCell_649699f5b285e7a5429592dc58fd6f0c } from '@/collections/Roles/components/RulesCell'
import { AvalancheCenterName as AvalancheCenterName_acb7f1a03857e27efe1942bb65ab80ad } from '@/collections/Settings/components/AvalancheCenterName'
import { USFSLogoDescription as USFSLogoDescription_d2eea91290575f9a545768dce25713f4 } from '@/collections/Settings/components/USFSLogoDescription'
import { InviteUser as InviteUser_6042b6804e11048cd4fbe6206cbc2b0f } from '@/collections/Users/components/InviteUser'
import { ResendInviteButton as ResendInviteButton_e262b7912e5bdc08a1a83eb2731de735 } from '@/collections/Users/components/ResendInviteButton'
import { UserStatusCell as UserStatusCell_bcfd328e5e7c9f1261310753bec8f6ee } from '@/collections/Users/components/UserStatusCell'
import { default as default_1a7510af427896d367a49dbf838d2de6 } from '@/components/BeforeDashboard'
import { default as default_55a7d1ebef7afeed563b856ae2e2cbf4 } from '@/components/ColorPicker'
import { AvyFxIcon as AvyFxIcon_5698f736c9797d81d0dacf1b1321e327 } from '@/components/Icon/AvyFxIcon'
import { AvyFxLogo as AvyFxLogo_f711e8d8656c7552b63fe9abc7b36dc4 } from '@/components/Logo/AvyFxLogo'
import { LogoutButton as LogoutButton_db9ac62598c46d0f1db201f6af05442e } from '@/components/LogoutButton'
import { default as default_2aead22399b7847b21b134dc4a7931e0 } from '@/components/TenantSelector/TenantSelector'
import { default as default_cb0ad5752e1389a2a940bb73c2c0e7d2 } from '@/components/ViewTypeAction'
import { LinkLabelDescription as LinkLabelDescription_cc2cf53f1598892c0c926f3cb616a721 } from '@/fields/navLink/components/LinkLabelDescription'
import { SlugComponent as SlugComponent_92cc057d0a2abb4f6cf0307edf59f986 } from '@/fields/slug/SlugComponent'
import { DiagnosticsDisplay as DiagnosticsDisplay_eee0393496e2f0e3400424e01efca1c6 } from '@/globals/Diagnostics/components/DiagnosticsDisplay'
import { ViewTypeProvider as ViewTypeProvider_1dd5649a8d943d1e5c4f21c0e3cc22f0 } from '@/providers/ViewTypeProvider'
import { AcceptInvite as AcceptInvite_a090ee9cb5b31ae357daa74987d3109a } from '@/views/AcceptInvite'
import { TenantField as TenantField_1d0591e3cf4f332c83a86da13a0de59a } from '@payloadcms/plugin-multi-tenant/client'
import {
  GlobalViewRedirect as GlobalViewRedirect_d6d5f193a167989e2ee7d14202901e62,
  TenantSelectionProvider as TenantSelectionProvider_d6d5f193a167989e2ee7d14202901e62,
} from '@payloadcms/plugin-multi-tenant/rsc'
import { AdminErrorBoundary as AdminErrorBoundary_e5a9e14bdbe97e70ba60697217fe7688 } from '@payloadcms/plugin-sentry/client'
import {
  MetaDescriptionComponent as MetaDescriptionComponent_a8a977ebc872c5d5ea7ee689724c0860,
  MetaImageComponent as MetaImageComponent_a8a977ebc872c5d5ea7ee689724c0860,
  MetaTitleComponent as MetaTitleComponent_a8a977ebc872c5d5ea7ee689724c0860,
  OverviewComponent as OverviewComponent_a8a977ebc872c5d5ea7ee689724c0860,
  PreviewComponent as PreviewComponent_a8a977ebc872c5d5ea7ee689724c0860,
} from '@payloadcms/plugin-seo/client'
import {
  BlocksFeatureClient as BlocksFeatureClient_e70f5e05f09f93e00b997edb1ef0c864,
  BoldFeatureClient as BoldFeatureClient_e70f5e05f09f93e00b997edb1ef0c864,
  FixedToolbarFeatureClient as FixedToolbarFeatureClient_e70f5e05f09f93e00b997edb1ef0c864,
  HeadingFeatureClient as HeadingFeatureClient_e70f5e05f09f93e00b997edb1ef0c864,
  HorizontalRuleFeatureClient as HorizontalRuleFeatureClient_e70f5e05f09f93e00b997edb1ef0c864,
  InlineToolbarFeatureClient as InlineToolbarFeatureClient_e70f5e05f09f93e00b997edb1ef0c864,
  ItalicFeatureClient as ItalicFeatureClient_e70f5e05f09f93e00b997edb1ef0c864,
  LinkFeatureClient as LinkFeatureClient_e70f5e05f09f93e00b997edb1ef0c864,
  OrderedListFeatureClient as OrderedListFeatureClient_e70f5e05f09f93e00b997edb1ef0c864,
  ParagraphFeatureClient as ParagraphFeatureClient_e70f5e05f09f93e00b997edb1ef0c864,
  UnderlineFeatureClient as UnderlineFeatureClient_e70f5e05f09f93e00b997edb1ef0c864,
  UnorderedListFeatureClient as UnorderedListFeatureClient_e70f5e05f09f93e00b997edb1ef0c864,
} from '@payloadcms/richtext-lexical/client'
import {
  LexicalDiffComponent as LexicalDiffComponent_44fe37237e0ebf4470c9990d8cb7b07e,
  RscEntryLexicalCell as RscEntryLexicalCell_44fe37237e0ebf4470c9990d8cb7b07e,
  RscEntryLexicalField as RscEntryLexicalField_44fe37237e0ebf4470c9990d8cb7b07e,
} from '@payloadcms/richtext-lexical/rsc'
import { VercelBlobClientUploadHandler as VercelBlobClientUploadHandler_16c82c5e25f430251a3e3ba57219ff4e } from '@payloadcms/storage-vercel-blob/client'

export const importMap = {
  '@payloadcms/plugin-multi-tenant/client#TenantField':
    TenantField_1d0591e3cf4f332c83a86da13a0de59a,
  '@payloadcms/richtext-lexical/rsc#RscEntryLexicalCell':
    RscEntryLexicalCell_44fe37237e0ebf4470c9990d8cb7b07e,
  '@payloadcms/richtext-lexical/rsc#RscEntryLexicalField':
    RscEntryLexicalField_44fe37237e0ebf4470c9990d8cb7b07e,
  '@payloadcms/richtext-lexical/rsc#LexicalDiffComponent':
    LexicalDiffComponent_44fe37237e0ebf4470c9990d8cb7b07e,
  '@payloadcms/richtext-lexical/client#InlineToolbarFeatureClient':
    InlineToolbarFeatureClient_e70f5e05f09f93e00b997edb1ef0c864,
  '@payloadcms/richtext-lexical/client#FixedToolbarFeatureClient':
    FixedToolbarFeatureClient_e70f5e05f09f93e00b997edb1ef0c864,
  '@payloadcms/richtext-lexical/client#ParagraphFeatureClient':
    ParagraphFeatureClient_e70f5e05f09f93e00b997edb1ef0c864,
  '@payloadcms/richtext-lexical/client#UnderlineFeatureClient':
    UnderlineFeatureClient_e70f5e05f09f93e00b997edb1ef0c864,
  '@payloadcms/richtext-lexical/client#BoldFeatureClient':
    BoldFeatureClient_e70f5e05f09f93e00b997edb1ef0c864,
  '@payloadcms/richtext-lexical/client#ItalicFeatureClient':
    ItalicFeatureClient_e70f5e05f09f93e00b997edb1ef0c864,
  '@payloadcms/richtext-lexical/client#LinkFeatureClient':
    LinkFeatureClient_e70f5e05f09f93e00b997edb1ef0c864,
  '@/components/ColorPicker#default': default_55a7d1ebef7afeed563b856ae2e2cbf4,
  '@payloadcms/richtext-lexical/client#HeadingFeatureClient':
    HeadingFeatureClient_e70f5e05f09f93e00b997edb1ef0c864,
  '@payloadcms/richtext-lexical/client#HorizontalRuleFeatureClient':
    HorizontalRuleFeatureClient_e70f5e05f09f93e00b997edb1ef0c864,
  '@payloadcms/richtext-lexical/client#BlocksFeatureClient':
    BlocksFeatureClient_e70f5e05f09f93e00b997edb1ef0c864,
  '@payloadcms/plugin-seo/client#OverviewComponent':
    OverviewComponent_a8a977ebc872c5d5ea7ee689724c0860,
  '@payloadcms/plugin-seo/client#MetaTitleComponent':
    MetaTitleComponent_a8a977ebc872c5d5ea7ee689724c0860,
  '@payloadcms/plugin-seo/client#MetaImageComponent':
    MetaImageComponent_a8a977ebc872c5d5ea7ee689724c0860,
  '@payloadcms/plugin-seo/client#MetaDescriptionComponent':
    MetaDescriptionComponent_a8a977ebc872c5d5ea7ee689724c0860,
  '@payloadcms/plugin-seo/client#PreviewComponent':
    PreviewComponent_a8a977ebc872c5d5ea7ee689724c0860,
  '@/fields/slug/SlugComponent#SlugComponent': SlugComponent_92cc057d0a2abb4f6cf0307edf59f986,
  '@/collections/Pages/components/DuplicatePageFor#DuplicatePageFor':
    DuplicatePageFor_8f1d8961a356bec6784e5c591c016925,
  '@payloadcms/richtext-lexical/client#UnorderedListFeatureClient':
    UnorderedListFeatureClient_e70f5e05f09f93e00b997edb1ef0c864,
  '@payloadcms/richtext-lexical/client#OrderedListFeatureClient':
    OrderedListFeatureClient_e70f5e05f09f93e00b997edb1ef0c864,
  '@/collections/Users/components/UserStatusCell#UserStatusCell':
    UserStatusCell_bcfd328e5e7c9f1261310753bec8f6ee,
  '@/collections/Users/components/InviteUser#InviteUser':
    InviteUser_6042b6804e11048cd4fbe6206cbc2b0f,
  '@/collections/Users/components/ResendInviteButton#ResendInviteButton':
    ResendInviteButton_e262b7912e5bdc08a1a83eb2731de735,
  '@/collections/Roles/components/CollectionsField#CollectionsField':
    CollectionsField_49c0311020325b59204cc21d2f536b8d,
  '@/collections/Roles/components/RulesCell#RulesCell': RulesCell_649699f5b285e7a5429592dc58fd6f0c,
  '@/fields/navLink/components/LinkLabelDescription#LinkLabelDescription':
    LinkLabelDescription_cc2cf53f1598892c0c926f3cb616a721,
  '@/collections/Settings/components/AvalancheCenterName#AvalancheCenterName':
    AvalancheCenterName_acb7f1a03857e27efe1942bb65ab80ad,
  '@/collections/Settings/components/USFSLogoDescription#USFSLogoDescription':
    USFSLogoDescription_d2eea91290575f9a545768dce25713f4,
  '@/globals/Diagnostics/components/DiagnosticsDisplay#DiagnosticsDisplay':
    DiagnosticsDisplay_eee0393496e2f0e3400424e01efca1c6,
  '@/components/LogoutButton#LogoutButton': LogoutButton_db9ac62598c46d0f1db201f6af05442e,
  '@/components/Icon/AvyFxIcon#AvyFxIcon': AvyFxIcon_5698f736c9797d81d0dacf1b1321e327,
  '@/components/Logo/AvyFxLogo#AvyFxLogo': AvyFxLogo_f711e8d8656c7552b63fe9abc7b36dc4,
  '@payloadcms/plugin-multi-tenant/rsc#GlobalViewRedirect':
    GlobalViewRedirect_d6d5f193a167989e2ee7d14202901e62,
  '@/components/ViewTypeAction#default': default_cb0ad5752e1389a2a940bb73c2c0e7d2,
  '@/components/BeforeDashboard#default': default_1a7510af427896d367a49dbf838d2de6,
  '@/components/TenantSelector/TenantSelector#default': default_2aead22399b7847b21b134dc4a7931e0,
  '@payloadcms/plugin-multi-tenant/rsc#TenantSelectionProvider':
    TenantSelectionProvider_d6d5f193a167989e2ee7d14202901e62,
  '@/providers/ViewTypeProvider#ViewTypeProvider':
    ViewTypeProvider_1dd5649a8d943d1e5c4f21c0e3cc22f0,
  '@payloadcms/storage-vercel-blob/client#VercelBlobClientUploadHandler':
    VercelBlobClientUploadHandler_16c82c5e25f430251a3e3ba57219ff4e,
  '@payloadcms/plugin-sentry/client#AdminErrorBoundary':
    AdminErrorBoundary_e5a9e14bdbe97e70ba60697217fe7688,
  '@/views/AcceptInvite#AcceptInvite': AcceptInvite_a090ee9cb5b31ae357daa74987d3109a,
}
