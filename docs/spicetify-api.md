# Spicetify API Reference

This reference combines a live scan of this machine's Spotify renderer with
[the project's declarations](../src/types/spicetify.d.ts). It describes the
objects actually exposed by this installation, not just the declared API.

## Snapshot and Scope

| Item | Observed value |
| --- | --- |
| Captured at (UTC) | 2026-10-25T23:31:00.196Z |
| Spicetify | 2.46.3 |
| Spotify | 1.2.90.451 |
| Renderer | `https://xpui.app.spotify.com/index.html` |
| Inspection | Chromium DevTools Protocol on localhost port 9222 |

The scan inspected property descriptors and immediate prototypes. It did not
invoke Spicetify methods or getters, send Spotify API requests, change playback,
or collect account, session, token, playlist, or track values. Large translation
and icon dictionaries were not expanded. This is an inventory, not a functional
test: an exposed function may still require initialization, permissions, a
subscription, the correct React providers, or an enabled Spotify feature.

Evidence labels used below:

- **Observed:** the property or method name exists in the captured renderer.
- **Declared:** signatures and behavior described by the local TypeScript file.
- **Inferred:** an undocumented internal object's likely responsibility, based
  on its name and observed members. Arguments, results, and behavior are not
  verified for these entries.

All names below are relative to `Spicetify` unless a longer path is shown.
Spotify and Spicetify updates can change this surface. Check availability at
the point of use, especially for internal APIs and lazily initialized state.

## Top-Level Exports

Every top-level property observed in the snapshot is listed here, including
functions, accessors, bundled libraries, and implementation details.

| Export | Kind | Responsibility and evidence |
| --- | --- | --- |
| `Player` | Object | Playback controls, timing, volume, modes, and events. Observed and declared; see below. |
| `Queue` | Accessor | Current track, queued tracks, history, and revision according to the declarations. Getter presence observed; returned value deliberately not inspected. |
| `addToQueue` | Function | Add context-track objects to the prioritized queue. Observed and declared. |
| `removeFromQueue` | Function | Remove context-track objects from the queue. Observed and declared. |
| `CosmosAsync` | Accessor | Async Cosmos request/subscription interface according to the declarations. Getter presence observed; returned object deliberately not inspected. |
| `GraphQL` | Object | GraphQL definitions, context, and request handling. Observed and declared. |
| `Platform` | Object | Spotify's internal services, configuration, navigation, and platform metadata. Observed; local type is `any`. See the catalog below. |
| `URI` | Function/class | Parse, construct, compare, and classify Spotify URIs. Observed and declared. |
| `React` | Object | Spotify's bundled React runtime, including components, hooks, and element factories. Observed; locally typed `any`. |
| `ReactJSX` | Object | JSX runtime exposing `Fragment`, `jsx`, and `jsxs`. Observed; absent from the local declarations. |
| `ReactDOM` | Object | React DOM rendering, roots, hydration, and portals. Observed; locally typed `any`. |
| `ReactDOMServer` | Object | React-to-string/static-markup rendering and stream exports. Names observed; locally typed `any`. Do not assume every stream export works in this renderer. |
| `ReactComponent` | Object | Spotify UI components and providers. Observed and partially declared; see below. |
| `ReactHook` | Object | Spotify integration hooks. `DragHandler` and `useExtractedColor` observed. |
| `ReactQuery` | Object | Query caching and async React state library. Observed; locally typed `any`. |
| `ReactFlipToolkit` | Object | Layout/FLIP animation helpers: `Flipper`, `Flipped`, and `spring`. Observed and declared. |
| `classnames` | Function | Compose conditional CSS class names. Observed and declared. |
| `Menu` | Object | Register profile-menu items and submenus using `Item` and `SubMenu`. Observed and declared. |
| `ContextMenu` | Object | Register context-menu items and submenus using `Item` and `SubMenu`. Observed and declared. |
| `ContextMenuV2` | Object | Inferred newer context-menu registration/rendering machinery. Observed; not locally declared. |
| `Topbar` | Object | Add a top-bar `Button`. Observed and declared. |
| `Playbar` | Object | Add playback-bar `Button` and `Widget` controls. Observed and declared. |
| `PopupModal` | Object | Display and hide modal content using `display` and `hide`. Observed and declared. |
| `showNotification` | Function | Display a transient notification. Observed and declared. |
| `Snackbar` | Object | Observed snackbar manager instance with notification queue methods. Purpose inferred; not locally declared. |
| `Tippy` | Function | Tooltip library with `setDefaultProps`, `defaultProps`, and `currentInput`. Observed; locally typed `any`. |
| `TippyProps` | Object | Tooltip defaults/lifecycle hooks: `delay`, `animation`, `render`, `onShow`, `onMount`, and `onHide`. Observed; locally typed `any`. |
| `SVGIcons` | Object | Dictionary of SVG icon markup. Presence observed; the local `Icon` union is not an exhaustive runtime inventory. |
| `Keyboard` | Object | Keyboard shortcut registration and key constants. Observed and declared. |
| `Mousetrap` | Function | Bundled low-level keyboard library, including `bind`, `unbind`, `trigger`, and `reset`. Observed and declared. |
| `LocalStorage` | Object | String storage wrapper exposing `get`, `set`, `remove`, and `clear`. Observed and declared. |
| `AppTitle` | Object | Set, read, reset, or subscribe to the application title. Observed and declared. |
| `Config` | Object | Spicetify version/theme/configuration metadata. Observed and partially declared. |
| `Locale` | Object | Inferred localization/translation dictionary. Presence observed; contents omitted and not locally declared. |
| `Color` | Function/class | Parse, convert, and manipulate colors. Observed and declared. |
| `colorExtractor` | Function | Extract artwork colors for a Spotify URI. Observed and declared. |
| `extractColorPreset` | Function | Inferred artwork color-preset extraction helper. Observed singular name; local types declare a different, plural name. |
| `getAudioData` | Function | Fetch track audio-analysis data according to the declarations. Presence observed; endpoint availability not tested. |
| `Events` | Object | Inferred initialization signals named `webpackLoaded` and `platformLoaded`. Observed; signal shapes not verified. |
| `expFeatureOverride` | Function | Inferred experimental-feature override helper. Observed; no local signature. Avoid calling without inspecting its implementation. |
| `test` | Function | Undocumented function. Presence observed; purpose and signature unknown. |
| `_platform` | Object | Internal platform bootstrap object with metadata and `get...` service accessors. Observed; prefer the exposed `Platform` services. |
| `_reservedPanelIds` | Object | Inferred built-in panel ID map. Observed even though the declared `Panel` namespace was absent. |
| `_renderNavLinks` | Function | Inferred internal navigation-link rendering helper. Observed; no supported contract established. |
| `_getStyledClassName` | Function | Inferred internal styled-class lookup helper. Observed; no supported contract established. |

## Playback and Queue

### Player

The following operations are both observed and declared:

| Area | Members | Declared behavior |
| --- | --- | --- |
| Playback | `play`, `pause`, `togglePlay`, `isPlaying`, `next`, `back` | Resume, pause, toggle, inspect playback, or change tracks. |
| Play a URI | `playUri(uri, context?, options?)` | Play a track or context; returns `Promise<void>`. Context and options are typed `any`. |
| Position | `seek`, `getProgress`, `getProgressPercent`, `getDuration` | Progress/duration are milliseconds; progress percent is a fraction from 0 to 1. `seek` accepts milliseconds or a fraction according to the declaration. |
| Relative seek | `skipBack(amount?)`, `skipForward(amount?)` | Amount is milliseconds; declared default is 15000. |
| Volume | `setVolume`, `getVolume`, `increaseVolume`, `decreaseVolume` | Volume is a fraction from 0 to 1. |
| Mute | `getMute`, `setMute`, `toggleMute` | Inspect or update mute state. |
| Shuffle | `getShuffle`, `setShuffle`, `toggleShuffle` | Inspect or update shuffle state. |
| Repeat | `getRepeat`, `setRepeat`, `toggleRepeat` | 0 = off, 1 = repeat context, 2 = repeat track. |
| Saved track | `getHeart`, `toggleHeart` | Inspect/toggle the track's saved state. |
| Formatting | `formatTime(milliseconds)` | Convert a duration to `mm:ss`. |
| Events | `addEventListener`, `removeEventListener`, `dispatchEvent`, `eventListeners` | Observe and dispatch player events. Prefer registration methods over editing the listener registry. |

`setHeart` and `origin` were also observed, but are not locally declared. Their
signatures and meaning were not established by this scan.

Declared events include `songchange`, `onplaypause`, `onprogress`, and
`appchange`. Register and remove the same callback reference. The local types
also declare `Player.data: PlayerState`, but `data` was **not** an own or
immediate-prototype property in this snapshot. Do not assume it exists before
playback initialization or on every client version.

```ts
const onSongChange = () => {
  console.log(Spicetify.Player.getDuration());
};

Spicetify.Player.addEventListener("songchange", onSongChange);
Spicetify.Player.removeEventListener("songchange", onSongChange);
```

### Queue

`Queue` is getter-backed. Its return value was not evaluated during inspection.
The following shape is **declared**, not independently verified in this scan:

| Property | Declared meaning |
| --- | --- |
| `track` | Current queue-track entry. |
| `nextTracks` | Upcoming queue-track entries. |
| `prevTracks` | Previous queue-track entries. |
| `queueRevision` | Queue revision identifier. |
| Entry's `contextTrack` | Track object containing `uri`, optional `uid`, and optional metadata. |
| Entry's `provider` | Track source, such as `queue` or `context`. |

`addToQueue(tracks)` and `removeFromQueue(tracks)` are declared to accept
`ContextTrack[]` and return `Promise<void>`. These are track objects, not an
array of URI strings. Metadata is `Partial<Record<string, string>>`, so values
such as duration may be strings. A URI identifies a recording; a queue UID
distinguishes occurrences of that recording.

The existing [DJ session implementation](../src/components/dj-session/index.tsx)
reads `Queue.track.contextTrack`, selects upcoming entries with
`provider === "queue"`, and listens for `queue_update` through
`Platform.PlayerAPI._events`. That event path is an internal dependency, not a
typed public contract. The scan observed `_events`, but did not test event
delivery. The current track/queue can be unavailable; guard reads accordingly.

## Requests and Data

### CosmosAsync

The top-level getter exists, but was not invoked. These signatures come only
from the project's declarations:

| Method | Declared contract |
| --- | --- |
| `head(url, headers?)` | Promise of response headers. |
| `get`, `post`, `put`, `patch`, `del` | `(url, body?, headers?)`; promise of response body. |
| `request`, `resolve` | `(method, url, body?, headers?)`; promise of `{ body, headers, status, uri? }`. |
| `sub` | `(url, callback, onError?, body?, headers?)`; subscription-style interface. |
| `postSub` | `(url, body, callback, onError?)`; POST/subscription-style interface. |

Declared methods include `GET`, `HEAD`, `POST`, `PUT`, `PATCH`, `DELETE`, and
`SUB`. Error fields are `code`, `error`, `message`, and optional `stack`.
Do not assume a subscription's cleanup contract from these broad declarations.
Endpoint permissions, response schemas, and current service availability were
not tested. Do not log authentication headers or session objects.

### GraphQL

Observed members: `Definitions`, `Context`, `Handler`, and `Request`.

- `Definitions`: collection of available operation definitions; names vary by
  client version. Individual definitions were not enumerated in this reference.
- `Request(definition, variables?, context?)`: declared to execute an operation
  using the preinitialized context and return `Promise<any>`.
- `Handler(context)`: declared factory for a request function with a context.
- `Context`: request context object. Its values were not inspected.

The locally declared `QueryDefinitions`, `MutationDefinitions`, and
`ResponseDefinitions` were not observed. An operation being listed in the
type-level `Query` union does not prove the runtime definition exists. Inspect
the actual definition and variables before using an operation; mutations can
modify user data.

### URI

Use `URI.fromString(value)` or `URI.from(value)` to parse Spotify identifiers.
The declarations give `from` a nullable result. Use predicates such as
`isTrack`, `isAlbum`, `isArtist`, `isPlaylistV2`, `isShow`, `isEpisode`, and
`isLocalTrack` to classify them. The runtime also exposes
`isPlaylistV1OrV2` and many additional predicates absent from older typings.

Observed factories include `trackURI`, `albumURI`, `artistURI`,
`playlistV2URI`, `folderURI`, `showURI`, `episodeURI`, `imageURI`,
`searchURI`, `profileURI`, and `socialSessionURI`. Other observed utilities
include `Type`, `isSameIdentity`, `idToHex`, and `hexToId`.

Instance methods declared by the project include `toURI`, `toString`,
`toURLPath`, `toURL`, `getPath`, and `clone`. These instance methods were not
tested or verified by constructing an instance during the scan. Not every
historical factory in the declaration exists in this runtime.

### Audio and Colors

| Export | Contract and caveats |
| --- | --- |
| `getAudioData(uri?)` | Declared audio analysis for a specified/current track. Not all tracks have data; presence does not establish endpoint access or availability of tempo/BPM. |
| `colorExtractor(uri)` | Declared promise of `DESATURATED`, `LIGHT_VIBRANT`, `PROMINENT`, `VIBRANT`, and `VIBRANT_NON_ALARMING` colors for artwork associated with a URI. |
| `extractColorPreset` | Observed function, but no matching local signature. Do not silently apply the declaration for `extractColorPresets` to it. |
| `Color` | Observed static factories: `fromRGBA`, `fromRGB`, `fromHex`, `fromHSV`, `fromHSL`, `fromInt`, `fromCSS`, and `parse`; constants `BLACK`, `WHITE`, and `CSSFormat`. |

`Color` instance methods declared locally include `contrastAdjust`, `toCSS`,
`toString`, and `stringify`; instances hold RGB, HSL, HSV, and alpha values.
The declaration's plural `extractColorPresets` promises presets with
`colorRaw`, `colorLight`, `colorDark`, and `isFallback`; the plural export was
not observed, so that signature is not a verified runtime contract.

## UI and Bundled Libraries

### ReactComponent

The following names were observed. The group descriptions describe intended
roles, not verified prop contracts for undocumented components.

| Area | Observed exports |
| --- | --- |
| Providers | `PlatformProvider`, `RemoteConfigProvider`, `StoreProvider` |
| Navigation | `Router`, `Routes`, `Route`, `Navigation` |
| Typography/icons | `TextComponent`, `IconComponent` |
| Menus | `Menu`, `MenuItem`, `MenuSubMenuItem`, `ContextMenu`, `RightClickMenu` |
| Entity menus | `PodcastShowMenu`, `TrackMenu`, `ArtistMenu`, `AlbumMenu`, `PlaylistMenu` |
| Inputs/actions | `ButtonPrimary`, `ButtonSecondary`, `ButtonTertiary`, `Slider`, `Dropdown`, `Toggle`, `Chip` |
| Feedback/layout | `TooltipWrapper`, `ConfirmDialog`, `Snackbar`, `Cards`, `ScrollableContainer` |

Local prop interfaces document some of these, including text/icon styling,
menu item leading/trailing icons, tooltip labels, confirmation callbacks, and
slider drag callbacks. Several components are typed `any`; that is not a
guarantee that arbitrary props are accepted.

`PanelSkeleton`, `PanelContent`, and `PanelHeader` are declared but were not
observed. Do not mix hooks from one React instance with a renderer using
another; use compatible instances and the providers expected by Spotify's
components. Library exposure does not guarantee version compatibility with
the dependencies bundled by this extension.

### ReactHook and ReactQuery

- `DragHandler(uris?, label?, contextUri?, sectionIndex?, dropOriginUri?)`:
  declared hook producing an `onDragStart` handler for Spotify drag-and-drop.
- `useExtractedColor(uri, fallbackColor?, variant?)`: declared color hook with
  variants `colorRaw`, `colorLight`, and `colorDark`. The declaration requires a
  compatible `QueryClientProvider`; do not assume its linked React Query v3
  documentation matches the installed runtime.
- `usePanelState`: declared, but not observed.

`ReactQuery` exposes `PersistQueryClientProvider`, `QueryClient`,
`QueryClientProvider`, `notifyManager`, `useMutation`, `useQuery`,
`useQueryClient`, `useInfiniteQuery`, and `useSuspenseQuery`. The last was an
own property with value type `undefined`, not a callable hook in this snapshot.
Do not infer the library's exact version from these names alone.

`ReactFlipToolkit` supplies layout animations. `classnames` composes CSS class
names. `ReactDOM` includes both root-based and legacy rendering APIs;
prefer the rendering approach already used by the extension.

### Menus, Controls, and Notifications

- `Menu.Item` / `Menu.SubMenu`: profile-menu registrations; declared classes
  support registration/deregistration and item state.
- `ContextMenu.Item` / `ContextMenu.SubMenu`: context-sensitive registrations;
  local declarations describe callbacks and display predicates. Deregister
  items when an extension/component no longer owns them.
- `ContextMenuV2`: observed `Item`, `ItemSubMenu`, `registerItem`,
  `unregisterItem`, `renderItems`, `parseProps`, and `_context`. Contracts are
  not locally declared; treat as internal.
- `Topbar.Button`, `Playbar.Button`, `Playbar.Widget`: declared classes for
  adding controls to Spotify chrome. Consult their declarations for constructor
  argument order and lifecycle methods.
- `PopupModal.display(content)` / `hide()`: modal presentation. The declared
  content object includes a title and HTML element/string content.
- `showNotification(message, isError?, msTimeout?)`: declared notification
  helper; timeout is milliseconds.
- `Snackbar`: observed instance methods include `enqueueSnackbar`,
  `enqueueCustomSnackbar`, and `closeSnackbar`. Avoid manipulating its queue or
  React internals directly; prefer the declared notification helper.
- `Tippy` / `TippyProps`: tooltip library and shared defaults. Changing shared
  defaults may affect other extensions.
- `SVGIcons`: icon-name-to-SVG dictionary. Runtime keys can exceed the local
  `Icon` union.

### Storage, Keyboard, and Configuration

`LocalStorage.get(key)` returns a string or null according to the declarations;
`set(key, value)` stores a string, and `remove(key)` deletes an entry. Serialize
structured values explicitly and namespace extension keys. `clear()` is a
broad destructive operation; do not assume its scope is this extension.

`Keyboard` exposes `KEYS`, `registerShortcut`, `registerIsolatedShortcut`,
`registerImportantShortcut`, `_deregisterShortcut`,
`deregisterImportantShortcut`, and `changeShortcut`. Use the local key/modifier
types when registering shortcuts. `Mousetrap` is the lower-level alternative.

`AppTitle.set(title)` is declared to return a promise of a cleanup handle;
`get()` returns a promise of the title, `reset()` resets it, and `sub(callback)`
returns an object with `clear()` for unsubscribing.

`Config` contains `version`, `current_theme`, `color_scheme`, `extensions`,
`custom_apps`, and the additionally observed `check_spicetify_update`.
Only version metadata was read. `Locale` was observed as a dictionary but its
values were not collected.

## Platform Catalog

`Platform` is `any` in the project's types. Every direct property observed in
the snapshot is listed in the following tables. Method names are examples
observed on the object or its immediate prototype, not exhaustive signatures.
**All responsibilities in these tables are inferred**, except where an
existing project call site is explicitly mentioned.

Internal APIs may perform network requests, change account/library data,
transfer playback, or shut down Spotify. Their presence does not mean the
current account or device supports the feature. Never call a method merely
to discover what it does.

### Platform Metadata and Infrastructure

| Entry | Likely responsibility / observed members |
| --- | --- |
| `version` | Client version string; used for this snapshot's Spotify version. |
| `container` | Host/container metadata. |
| `operatingSystem` | Operating-system metadata. |
| `isDeveloperMode` | Developer-mode state. |
| `enableCastConnect` | Cast/Connect configuration flag. |
| `initialUser` | Bootstrap user state; values not inspected. |
| `initialProductState` | Bootstrap product/entitlement state; values not inspected. |
| `username` | Account identifier; value not inspected. |
| `logout` | Function likely logging out the user; not invoked. |
| `ServiceWorkerMessenger` | Promise-like service-worker messenger entry; `then`, `catch`, `finally` observed. Resolution not awaited. |
| `Registry` | Dependency/service registry: `registerValue`, `registerFactory`, `resolve`, `resolveNoThrow`. |
| `Session` | Session state/credentials boundary; values not inspected. |
| `Transport` | Connection/authentication transport: `connect`, `disconnect`, `isConnected`, `isAuthenticated`, `forceTokenRefresh`. |
| `EventSender` | Event/telemetry infrastructure: `buildEvent`, `flush`, `initSendingEvents`. |
| `Translations` | Translation infrastructure; no methods cataloged. |
| `FeatureFlags` | Feature-flag state; values not inspected. |
| `History` | Navigation history: `push`, `replace`, `go`, `goBack`, `goForward`, `listen`, `block`. |
| `AdManagers` | Advertising infrastructure; no methods cataloged. |
| `RemoteConfiguration` | Configuration values/builders: `getValue`, `toJSON`, `toBuilder`. |
| `RemoteConfigurationWithLocalOverrides` | Configuration plus local overrides; same observed accessor/builder methods. |
| `GraphQLLoader` | GraphQL loading infrastructure; no methods cataloged. |
| `PlatformData` | Platform metadata/state; values not inspected. |
| `SEOExperiments` | SEO-related experiments; values not inspected. |
| `RequestBuilder` | Internal request construction: `build`, `resetPendingRequests`. |
| `UBILogger` | UI interaction logging: `emitEvent`, `formatUiNavigateEvent`, `getEvents`. |
| `UBIAppStateMonitor` | App/page lifecycle telemetry: `startTrackingPage`, `endTrackingPage`, `onStateChange`. |
| `UBIPageManager` | Page/focus logging lifecycle: `startPage`, `startFallbackPage`, `handleFocusChange`. |

### Platform User, Storage, and Client Services

| Entry | Likely responsibility / observed members |
| --- | --- |
| `UserAPI` | Current user lookup: `getUser`. |
| `ProductStateAPI` | Product/entitlement state: `getValues`, `getCachedValues`, `subValues`, `setValues`. |
| `AuthorizationAPI` | Authorization state/events: `getState`, `getEvents`, `tryAuthorize`, `onTokenChanged`. |
| `LocalStorageAPI` | Internal namespaced storage: `createNamespacedKey`, `getItem`, `setItem`, `clearItem`. |
| `IndexedDbAPI` | IndexedDB storage: `openDb`, `getItem`, `setItem`, `deleteItem`. |
| `SettingsAPI` | Settings service; no immediate methods cataloged. |
| `RemoteConfigDebugAPI` | Debug configuration overrides: `getProperties`, `setOverride`, `clearOverrides`. |
| `UpdateAPI` | Client updates: `getVersionInfo`, `subscribe`, `prepareUpdate`, `applyUpdate`. |
| `NativeAPI` | Native window integration: `setWindowButtonsVisibility`. |
| `ZoomAPI` | Interface zoom: `getZoomLevel`, `setZoomLevel`, `zoomIn`, `zoomOut`. |
| `FocusMainWindowAPI` | Bring Spotify to the foreground: `canFocusMainWindow`, `focusMainWindow`. |
| `ControlMessageAPI` | Native menu/window messages: `enableMenuItem`, `disableMenuItem`, `setTitlebarHeight`, `notifyViewLoaded`. |
| `ClipboardAPI` | Clipboard operations: `copy`, `paste`. |
| `LifecycleAPI` | Client lifecycle: `restart`, `shutdown`. |
| `OSNotificationsAPI` | Native notifications: `showToast`, `getAvailability`, `openNotificationsSetting`. |
| `DesktopLogsAPI` | Desktop log location/opening: `getLogFolder`, `openFolder`. |
| `DeepLinkAPI` | Deep-link handling: `onDeepLinkOpen`. |
| `UrlDispenserServiceClient` | Short-link service: `getShortUrl`. |
| `ExternalAccessoryAPI` | Accessory lookup: `lookup`, `sendLookupRequest`. |
| `PubSubAPI` | Subscription transport: `subscribe`, `createSubscription`, `cancelSubscription`, `getEvents`. |
| `ActionStoreAPI` | Deferred/stored actions: `storeAction`, `triggerActions`, `cleanActions`. |
| `AgentTimelineAPI` | Agent-related timeline/live events: `getTimeline`, `subscribeLive`, `unsubscribeLive`, `abort`. Product behavior not established. |

### Platform Playback, Audio, and Devices

| Entry | Likely responsibility / observed members |
| --- | --- |
| `PlayerAPI` | Playback orchestration/state/events: `play`, `pause`, `resume`, `getState`, `getEvents`. The project's queue listener uses its observed private `_events` field. |
| `PlaybackAPI` | Lower-level playback information/volume: `getPlaybackInfo`, `getVolume`, `setVolume`, `getFiles`. |
| `StandalonePlayerCoordinatorAPI` | Independent player instances: `createStandalonePlayerInstance`, `deleteStandalonePlayerInstance`. |
| `ShuffleAPI` | Shuffle modes: `getAvailableShuffleModes`, `getShuffle`, `setShuffle`. |
| `ContextualShuffleAPI` | Contextual/smart-shuffle settings: `getContextualShuffleMode`, `setContextualShuffleMode`. |
| `SmartShuffleEligibilityAPI` | Smart-shuffle eligibility: `getEligibility`. |
| `EqualizerAPI` | Equalizer support, enablement, and bands: `isSupported`, `getFilters`, `setFilterGain`, `setEnabledState`. |
| `AudioOutputDevicesAPI` | Local output devices: `getDefaultDevice`, `getDevices`, `getEvents`. |
| `SingAlongAPI` | Sing-along/vocal controls: `setVocalVolume`, `setStatus`, `getStatus`, `getCapabilities`. |
| `VideoAPI` | Video quality, subtitles, picture-in-picture, and presentation: `getPictureInPictureState`, `getSubtitleLanguages`, `getCapabilities`. |
| `ForceVolumeAPI` | Special volume behavior: `enable`, `disable`, `toggle`, `isEnabled`, `onVolumeChange`. Exact policy unknown. |
| `MidiAPI` | MIDI device profiles/connections: `registerDeviceProfile`, `connect`, `disconnect`, `getConnectedDevices`. |
| `ConnectAPI` | Spotify Connect orchestration: `getState`, `getEvents`, `transferPlayback`, `pullToLocal`, `transferToRemote`. |
| `ConnectDiscoveryAPI` | Active Connect discovery: `startActiveDiscovery`. |
| `ConnectTransferAPI` | Playback transfer between devices: `pullToLocalDevice`, `transferPlayback`, `transferToRemote`. |
| `ConnectDeviceManagementAPI` | Connect device login/incarnation management: `logout`, `setPreferredIncarnation`, `checkDeviceId`. |
| `ConnectRestrictionsAPI` | Connect restrictions: `restrict`, `getRestrictionState`. |
| `ConnectRestrictionStateAPI` | Restriction-state interface: `restrict`, `getRestrictionState`; do not assume it is identical to the preceding entry. |
| `ConnectDevicesAPI` | Connect device list and active device: `getConnectState`, `getActiveDevice`, `getDevices`. |
| `SuperConnectAPI` | Observed entry, but no immediate methods cataloged. Purpose not established beyond its name. |
| `StudioInstallerAPI` | Observed entry, but no immediate methods cataloged. Purpose not established beyond its name. |

### Platform Library, Playlists, and Content

| Entry | Likely responsibility / observed members |
| --- | --- |
| `CollectionPlatformAPI` | Collection membership and changes: `get`, `subscribe`, `add`, `remove`, `contains`. |
| `LibraryAPI` | Saved content and played state: `getTracks`, `add`, `remove`, `contains`, `markAsPlayed`. |
| `YourLibraryTagsAPI` | Library filter tags: `streamTagFilters`. |
| `RootlistAPI` | Sidebar playlist/folder tree: `getContents`, `createFolder`, `renameFolder`, `moveFolder`, `removeFolder`. Project code also uses `createPlaylist`. |
| `PlaylistAPI` | Playlist metadata/content edits: `getPlaylist`, `getContents`, `getMetadata`, `add`, `move`, `remove`. Project code uses `add`. |
| `PlaylistPermissionsAPI` | Playlist access/collaborators: `getPermissionGrant`, `getMembers`, `setMemberPermission`, `setBasePermission`. |
| `PlaylistResyncAPI` | Playlist synchronization: `resync`, `maybeResync`. |
| `ListPlatformAPI` | General list content and modifications: `getList`, `getListContents`, `find`, `add`, `move`, `remove`. |
| `CurationAPI` | Curation contexts/order/membership: `getCurationContexts`, `getAvailableSortOrders`, `curateItems`, `isCurated`. |
| `AssistedCurationAPI` | Curation suggestions from recent playback: `getRecentlyPlayedTracks`. |
| `PlaylistMixingAPI` | Playlist transitions/mixing: `getAutoTransitionForTrackPair`, `getCustomTransitionForTrackPair`, `setTransitionForTrack`, `playTransition`. Other observed methods include transition previews and style lookups; see below. |
| `PlayabilityAPI` | Playability state/cache/subscriptions: `subscribeToPlayability`, `getCachedPlayability`, `setCachedPlayability`. |
| `OfflineAPI` | Downloads/cache: `getDownloads`, `addDownload`, `removeDownload`, `removeAllDownloads`, `removeCache`. |
| `LocalFilesAPI` | Local file sources/settings: `getSources`, `browseForFolder`, `addFolder`, `removeFolder`, `setIsEnabled`. |
| `ShowAPI` | Show/book metadata, contents, playback filters, and ratings: `getMetadata`, `getBookContents`, `getContents`, `getEpisodeOrChapter`. |
| `AudiobookCappingAPI` | Audiobook usage/limit state: `getCappingStatus`. |
| `SegmentsAPI` | Segment/artist lookup: `getSegments`, `getArtists`. Exact segment model not established. |
| `ReportAPI` | Content reporting: `getReportURL`, `isURIReportable`, `canReportPlaylist`. |
| `FeedbackAPI` | Context-specific track bans/feedback: `addContextTrackBan`, `removeContextTrackBan`, `getEvents`. |
| `MagpieAPI` | Playlist-operation/metadata-refresh integration: `onPlaylistOperation`, `setRefreshMetadata`, `getEvents`. Broader role unknown. |

### Platform History and Social Features

| Entry | Likely responsibility / observed members |
| --- | --- |
| `RecentsAPI` | Recent content: `getContents`, `getCapabilities`. |
| `PlayHistoryAPI` | Playback history: `getContents`, `getEvents`, `getCapabilities`. |
| `RecentlyPlayedAPI` | Recently played contexts/events: `getContexts`, `getEvents`, `startListening`. |
| `ResumptionProgressAPI` | Resume-position subscriptions: `subscribe`. |
| `BuddyFeedAPI` | Friend listening activity: `subscribeToBuddyActivity`, `fetchFriendActivity`, `fetchFriendActivityByUsername`. |
| `FollowAPI` | User following: `isFollowing`, `followUsers`, `unfollowUsers`. |
| `PrivateSessionAPI` | Private-listening state: `subscribeToPrivateSession`, `setPrivateSession`. |
| `SocialConnectAPI` | Jam/social sessions: `getCurrentSession`, `createSession`, `joinSession`, `leaveSession`, `deleteSession`. |
| `JamDevicesAPI` | Jam device discovery/list merging: `getJamDevices`, `combineJamsWithEntities`, `mergeJamsWithEntities`. |
| `UserCommentsAPI` | Comments, replies, and reactions: `getComments`, `addComment`, `deleteComment`, `getCommentReplies`, `addCommentReaction`. |

## Particularly Relevant to This Project

- **Queue/session display:** `Queue`, `Player`, and the internal
  `Platform.PlayerAPI` event emitter are already used by
  [the session component](../src/components/dj-session/index.tsx).
- **Saving sessions:** `Platform.RootlistAPI.createPlaylist`,
  `Platform.RootlistAPI.createFolder`, and `Platform.PlaylistAPI.add` are used
  by [the queue view](../src/components/show-queue/index.tsx). These call sites
  are better signature examples than assuming a Web API-compatible contract.
- **Tempo:** [the track-info API](../src/api/track-info.ts) batch-fetches
  audio features (up to 100 ids per request) from the internal
  `spclient.wg.spotify.com/audio-attributes/v1/audio-features` endpoint and
  caches them in this extension's own `spicetify-dj` IndexedDB database. The
  endpoint is internal and undocumented; it may change without notice.
- **Mixing research:** `Platform.PlaylistMixingAPI` was exposed. Beyond the
  methods above, observed names include `playTransitionPreview`,
  `stopTransitionPreview`, `isTransitionPreviewActive`,
  `getTransitionPreviewState`, `getTransitionPreviewProgress`,
  `subscribeToPreviewState`, `getMaxTransitionLength`, and
  `invalidateTransitionCache`. These suggest transition preview/state features,
  but their inputs, units, eligibility, and behavior were not tested.
- **Hardware research:** `Platform.MidiAPI` exists, but device access,
  permissions, profile schemas, and integration with Spotify playback were not
  tested. No MIDI connection was opened.

## Differences From the Project Types

The declaration file is useful documentation, but is not a runtime manifest.

| Difference | Consequence |
| --- | --- |
| `Platform` is declared `any` | The internal catalog above supplies observed names, not TypeScript safety. |
| `Queue` and `CosmosAsync` are accessors | A descriptor scan confirms the getter, not its return value or readiness. |
| Declared `Player.data` absent in snapshot | Guard state reads; initialization/version differences remain possible. |
| Observed `Player.setHeart` and `Player.origin` undeclared | Inspect contracts before adding local types or using them. |
| Observed `extractColorPreset`; declared `extractColorPresets` absent | Do not use the plural name without a runtime check or assume identical signatures. |
| Declared `Panel` namespace absent | Its registration/rendering APIs cannot be assumed available. `_reservedPanelIds` alone is not a replacement. |
| Declared `ReactHook.usePanelState` absent | Do not call it on this installation without checking. |
| Declared panel components absent from `ReactComponent` | Avoid relying on `PanelSkeleton`, `PanelContent`, or `PanelHeader`. |
| GraphQL exposes only `Definitions`, `Context`, `Handler`, `Request` | Do not assume the three declared definition subsets exist. |
| `BridgeAPI`, `CosmosAPI`, `LiveAPI`, `getAblumArtColors` absent | These declarations are deprecated; the misspelled artwork helper is not available here. |
| Declared `getFontStyle` absent | Presence in types does not make it callable. |
| Runtime has additional exports | Examples: `ReactJSX`, `ContextMenuV2`, `Snackbar`, `Events`, `Locale`, and experimental/internal helpers. |
| Type aliases/interfaces are compile-time only | `Icon`, `PlayerState`, `ContextTrack`, `ProvidedTrack`, `ContextOption`, `Variant`, `SemanticColor`, and color interfaces are not runtime objects. |
| Queue entry type is spelled `QeueuTrack` | This is the actual local type name, not a separate runtime export. |

## Refreshing the Inventory

For external inspection, fully quit Spotify and launch it with
`spotify --remote-debugging-port=9222`. The target list is available at
`http://127.0.0.1:9222/json/list`. Enabling DevTools alone does not necessarily
open this endpoint. Remote debugging allows control of the renderer; keep it
local and relaunch without the flag when finished.

Alternatively, this snippet can be evaluated in Spotify's DevTools console. It
returns names and types, including the immediate prototype methods of
`Platform` entries, without reading getter values or invoking Spotify methods:

```js
(() => {
  const inspect = (value) => {
    if (value === null || !["object", "function"].includes(typeof value)) {
      return [];
    }

    const descriptors = Object.getOwnPropertyDescriptors(value);
    const prototype = Object.getPrototypeOf(value);
    const builtins = [Object.prototype, Function.prototype, Array.prototype];

    if (prototype && !builtins.includes(prototype)) {
      for (const [name, descriptor] of Object.entries(
        Object.getOwnPropertyDescriptors(prototype),
      )) {
        if (!(name in descriptors)) descriptors[name] = descriptor;
      }
    }

    return Object.entries(descriptors)
      .filter(([name]) => ![
        "constructor", "prototype", "length", "name", "caller", "arguments",
      ].includes(name))
      .map(([name, descriptor]) => ({
        name,
        type: "value" in descriptor ? typeof descriptor.value : "accessor",
      }));
  };

  return Object.entries(Object.getOwnPropertyDescriptors(Spicetify)).map(
    ([name, descriptor]) => ({
      name,
      type: "value" in descriptor ? typeof descriptor.value : "accessor",
      members: ["Locale", "SVGIcons"].includes(name)
        ? []
        : inspect(descriptor.value),
      ...(name === "Platform" ? {
        entries: Object.entries(
          Object.getOwnPropertyDescriptors(descriptor.value),
        ).map(([entry, child]) => ({
          name: entry,
          type: "value" in child ? typeof child.value : "accessor",
          members: inspect(child.value),
        })),
      } : {}),
    }),
  );
})();
```

This intentionally leaves getter results, deeply nested objects, and method
behavior unverified. Inspect a specific implementation before documenting its
arguments or calling a state-changing internal API.