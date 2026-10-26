## Actual changes in JSON snapshots

Adds four nullable `text` columns:

- `media._objectkey`
- `documents._objectkey`
- `shared_media._objectkey`
- `users.reset_password_requested_at`

## What caused these changes

The Payload 3.88 → 3.90 upgrade. 3.90.0's security release adds both fields upstream:

- `_objectKey` is injected by `@payloadcms/plugin-cloud-storage` on every collection using `clientUploads`. New client uploads are stored at `<prefix>/<_objectKey>/<filename>`. Existing rows keep a null key and resolve to `<prefix>/<filename>` as before.
- `resetPasswordRequestedAt` is added to auth collections to throttle forgot-password requests.

## Conclusion

`up()` is four `ALTER TABLE ... ADD` statements and nothing else. No table is recreated and there is no `PRAGMA foreign_keys=OFF`, so the libSQL cascade-delete issue in `docs/migration-safety.md` does not apply. `pnpm migrate:check` flags all four lines on the `ALTER` keyword alone.

No backfill is needed: a null `_objectKey` means "no key segment", which is exactly how existing blobs are laid out.
