# Graph Report - Beeper  (2026-06-15)

## Corpus Check
- 75 files · ~123,538 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 243 nodes · 229 edges · 11 communities detected
- Extraction: 85% EXTRACTED · 15% INFERRED · 0% AMBIGUOUS · INFERRED: 35 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]

## God Nodes (most connected - your core abstractions)
1. `createClient()` - 22 edges
2. `trackPagerEvent()` - 9 edges
3. `createServiceClient()` - 7 edges
4. `trackPageView()` - 4 edges
5. `nextStep()` - 3 edges
6. `nextStep()` - 3 edges
7. `GET()` - 3 edges
8. `PATCH()` - 3 edges
9. `GET()` - 3 edges
10. `PATCH()` - 3 edges

## Surprising Connections (you probably didn't know these)
- `run()` --calls--> `createClient()`  [INFERRED]
  scratch\check_sate_baba.js → src\lib\supabase\server.ts
- `GET()` --calls--> `createClient()`  [INFERRED]
  src\app\api\admin\infra-usage\route.ts → src\lib\supabase\server.ts
- `POST()` --calls--> `createClient()`  [INFERRED]
  src\app\api\ads\charge-view\route.ts → src\lib\supabase\server.ts
- `POST()` --calls--> `createClient()`  [INFERRED]
  src\app\api\ads\track\route.ts → src\lib\supabase\server.ts
- `POST()` --calls--> `createClient()`  [INFERRED]
  src\app\api\ads\update\route.ts → src\lib\supabase\server.ts

## Communities

### Community 0 - "Community 0"
Cohesion: 0.07
Nodes (20): GET(), PATCH(), GET(), POST(), POST(), GET(), GET(), GET() (+12 more)

### Community 1 - "Community 1"
Cohesion: 0.12
Nodes (13): parseBrowser(), parseOS(), trackPagerEvent(), acquireWakeLock(), handleConfirm(), handleDismissAlarm(), handleOffline(), handleOnline() (+5 more)

### Community 2 - "Community 2"
Cohesion: 0.12
Nodes (2): handleVisibilityChange(), requestWakeLock()

### Community 3 - "Community 3"
Cohesion: 0.16
Nodes (7): handleSubmit(), initMap(), loadLeaflet(), nextStep(), validateStep1(), validateStep2(), validateStep3()

### Community 4 - "Community 4"
Cohesion: 0.16
Nodes (7): handleSubmit(), initMap(), loadLeaflet(), nextStep(), validateStep1(), validateStep2(), validateStep3()

### Community 5 - "Community 5"
Cohesion: 0.18
Nodes (2): handleSaveLocation(), updateMerchant()

### Community 6 - "Community 6"
Cohesion: 0.22
Nodes (2): handleClose(), hasSettingsChanged()

### Community 7 - "Community 7"
Cohesion: 0.36
Nodes (4): createImage(), getCroppedImg(), handleConfirmCrop(), handleValueChange()

### Community 9 - "Community 9"
Cohesion: 0.43
Nodes (4): checkSession(), handleLogin(), handleSubmit(), resolveRedirect()

### Community 10 - "Community 10"
Cohesion: 0.33
Nodes (4): getWebhookToken(), getSupabase(), POST(), GET()

### Community 11 - "Community 11"
Cohesion: 0.83
Nodes (3): parseBrowser(), parseOS(), trackPageView()

## Knowledge Gaps
- **Thin community `Community 2`** (17 nodes): `callSession()`, `challengeMfa()`, `createSession()`, `doneSession()`, `getWaitTime()`, `goOffline()`, `goOnline()`, `handleLogout()`, `handleOpenQr()`, `handleUpgrade()`, `handleVisibilityChange()`, `openSettings()`, `pagerUrl()`, `requestWakeLock()`, `syncLoyverse()`, `toggleStore()`, `page.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 5`** (12 nodes): `async()`, `checkIsSuspectedSelfReferral()`, `deleteAd()`, `handleApproveAd()`, `handleApproveAdvertiser()`, `handleRejectAd()`, `handleRejectAdvertiser()`, `handleSaveAd()`, `handleSaveLocation()`, `toggleAdActive()`, `updateMerchant()`, `page.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 6`** (10 nodes): `disableMfa()`, `enrollMfa()`, `handleClose()`, `handleLogoUpload()`, `hasSettingsChanged()`, `registerAsPartner()`, `saveSettings()`, `toggleSection()`, `verifyMfa()`, `SettingsModal.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `createClient()` connect `Community 0` to `Community 10`, `Community 11`?**
  _High betweenness centrality (0.034) - this node is a cross-community bridge._
- **Why does `trackPageView()` connect `Community 11` to `Community 0`?**
  _High betweenness centrality (0.005) - this node is a cross-community bridge._
- **Why does `GET()` connect `Community 10` to `Community 0`?**
  _High betweenness centrality (0.004) - this node is a cross-community bridge._
- **Are the 21 inferred relationships involving `createClient()` (e.g. with `run()` and `GET()`) actually correct?**
  _`createClient()` has 21 INFERRED edges - model-reasoned connections that need verification._
- **Are the 6 inferred relationships involving `trackPagerEvent()` (e.g. with `handleVisibilityChange()` and `handleOnline()`) actually correct?**
  _`trackPagerEvent()` has 6 INFERRED edges - model-reasoned connections that need verification._
- **Are the 6 inferred relationships involving `createServiceClient()` (e.g. with `GET()` and `PATCH()`) actually correct?**
  _`createServiceClient()` has 6 INFERRED edges - model-reasoned connections that need verification._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.07 - nodes in this community are weakly interconnected._