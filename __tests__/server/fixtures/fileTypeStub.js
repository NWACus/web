// Stub for file-type, a pure ESM package that Jest/SWC can't transform.
// No tests need actual file-type detection.
module.exports = {
  fileTypeFromFile: async () => undefined,
  fileTypeFromBuffer: async () => undefined,
  fileTypeFromStream: async () => undefined,
}
