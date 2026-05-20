# Graph Report - Beeper  (2026-05-20)

## Corpus Check
- 20 files · ~66,349 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 68 nodes · 58 edges · 4 communities detected
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 3 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]

## God Nodes (most connected - your core abstractions)
1. `initAudio()` - 4 edges
2. `createClient()` - 4 edges
3. `getSupabase()` - 3 edges
4. `acquireWakeLock()` - 3 edges
5. `POST()` - 2 edges
6. `POST()` - 2 edges
7. `GET()` - 2 edges
8. `requestWakeLock()` - 2 edges
9. `handleVisibilityChange()` - 2 edges
10. `hasSettingsChanged()` - 2 edges

## Surprising Connections (you probably didn't know these)
- `POST()` --calls--> `createClient()`  [INFERRED]
  src\app\api\payment\toyyibpay\create\route.ts → src\lib\supabase\server.ts
- `getSupabase()` --calls--> `createClient()`  [INFERRED]
  src\app\api\webhooks\loyverse\route.ts → src\lib\supabase\server.ts
- `GET()` --calls--> `createClient()`  [INFERRED]
  src\app\auth\callback\route.ts → src\lib\supabase\server.ts

## Communities

### Community 1 - "Community 1"
Cohesion: 0.29
Nodes (5): acquireWakeLock(), handleConfirm(), handleVisibilityChange(), initAudio(), playChime()

### Community 2 - "Community 2"
Cohesion: 0.25
Nodes (5): GET(), POST(), getSupabase(), POST(), createClient()

### Community 11 - "Community 11"
Cohesion: 1.0
Nodes (2): closeSettings(), hasSettingsChanged()

### Community 12 - "Community 12"
Cohesion: 1.0
Nodes (2): handleVisibilityChange(), requestWakeLock()

## Knowledge Gaps
- **Thin community `Community 11`** (2 nodes): `closeSettings()`, `hasSettingsChanged()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 12`** (2 nodes): `handleVisibilityChange()`, `requestWakeLock()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Are the 3 inferred relationships involving `createClient()` (e.g. with `POST()` and `getSupabase()`) actually correct?**
  _`createClient()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.11 - nodes in this community are weakly interconnected._