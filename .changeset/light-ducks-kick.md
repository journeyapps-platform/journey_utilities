---
'@journeyapps/db': major
'@journeyapps/parser-schema': major
---

Refactor types and PrimitiveTypes, moving away from `protoype` inheritance and introducing type factories on `Schema.ts` and extending this in `@journeyapps/db` to register extended types.
