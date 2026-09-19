# PocketBinder Rebuild — Setup Guide

## 1. Where these files go

Your project uses Expo Router, so routes live under `app/`. Copy this
structure into your existing project, **overwriting** the old versions:

```
app/
  _layout.tsx
  index.tsx
  calendar.tsx
  schedule.tsx
  settings.tsx
  courses/
    _layout.tsx
    index.tsx
    [id].tsx
lib/
  types.ts
  theme.ts
  storage.ts
  hooks.ts
  fileOpen.ts
components/
  UI.tsx
  CustomPickers.tsx
  Modals.tsx
app.json
```

**Important:** your old project had a single `app/courses.tsx` file. Courses
is now a folder (`app/courses/`) so it can have its own list page + detail
sub-page, per your request to use sub-pages where it makes sense. **Delete
the old `app/courses.tsx` file** — if both it and the `app/courses/` folder
exist at the same time, Expo Router will throw a route-conflict error.

## 2. Install the packages this rebuild needs

Run this from your project root:

```
npx expo install expo-image-picker expo-file-system expo-document-picker expo-sharing
```

`expo-image-picker` is new (used for the ID photo and could be reused for
course-related photos later). Everything else you likely already had, but
running `expo install` (not plain `npm install`) makes sure the versions
match your Expo SDK.

**You can remove `@react-native-community/datetimepicker`** — the custom
date/time pickers in `components/CustomPickers.tsx` replace it everywhere,
so there's no need to keep the native module around (one less thing that can
break an Android build). I already removed it from the `plugins` array in
the included `app.json`.

## 3. Your app icon / splash image

You said you'll design the logo yourself later — the config is ready for it.
Drop these files in when you have them (same paths as before, nothing to
rename):

```
assets/images/icon.png
assets/images/android-icon-foreground.png
assets/images/android-icon-background.png
assets/images/android-icon-monochrome.png
assets/images/splash-icon.png
assets/images/favicon.png
```

I updated the splash and adaptive-icon **background color** to `#FFF7EC`
(the new app's cream background) so the loading screen matches the rest of
the app instead of plain white — that was bug #1 (no logo showed because the
image file was likely missing/blank; the config itself was fine).

## 4. Naming the built APK `PocketBinder.apk`

This is a native Android Gradle setting, not something in the `.tsx`/`app.json`
files. In `android/app/build.gradle`, add this near the bottom of the file
(outside the `android { }` block):

```gradle
android.applicationVariants.all { variant ->
    variant.outputs.all { output ->
        outputFileName = "PocketBinder.apk"
    }
}
```

Note: if you ever build **both** debug and release APKs in the same command,
they'll both be named `PocketBinder.apk` and the second one will overwrite
the first in the output folder. If that becomes an issue, use
`"PocketBinder-${variant.buildType.name}.apk"` instead to get
`PocketBinder-debug.apk` / `PocketBinder-release.apk`.

If you don't have an `android/` folder yet (i.e. you've only been using
`npx expo run:android` and Expo generates it on the fly), run
`npx expo prebuild` once first so `android/app/build.gradle` exists to edit.

## 5. What changed, mapped to your original list

**Bugs:**
1. Splash logo — was an asset/config issue, not code; splash background now matches the app so a missing image is at least less jarring, and the plugin config is confirmed correct for when you add the real icon.
2. File reading — `lib/fileOpen.ts` now copies picked files into permanent app storage (not just cache), stores the real MIME type, and opens them through the OS share sheet with proper error handling instead of failing silently.
3. Calendar row jump — `app/calendar.tsx` wraps the calendar in a fixed-height container (`CALENDAR_HEIGHT = 360`) so 5-row and 6-row months take the same space.
4. Schedule autofill — `components/Modals.tsx` (`ScheduleFormModal.applyCourse`) now reads the *actual* `CourseItem` fields (`code`, `instructorName`, `roomLocation`). The old code was reading fields that didn't exist on the object at all, which is why it silently produced blanks.
5. ID card live-editing — `IdEditModal` (and every other modal) now uses a local draft state that's only committed to real storage on Save, and is reset from the real data every time the modal opens, so Cancel is a true cancel.

**Recommendations:**
1. Rebuilt from scratch around one data layer (`lib/storage.ts`) and one set of shared UI/modal components — no screen duplicates load/save/CRUD logic anymore.
2. Courses uses a real sub-page (`app/courses/[id].tsx`) for its list→detail flow; everything else uses modals, all defined once in `components/Modals.tsx`.
3. New shared design system in `lib/theme.ts` — warm cream background, one accent color, pastel category tags, "sticker" shadows instead of flat cards. Every screen pulls from the same tokens.
4. All CRUD operations for every entity live in `lib/storage.ts`.
5. Settings now has profile + accent color, a week-start preference, JSON export/import backup, a "Clear All Data" danger zone, and an About section.
6. Splash/icon config wired up (see #3 above); APK naming covered in section 4 above.
7. Custom calendar-grid date picker and scroll-wheel time picker in `components/CustomPickers.tsx`, replacing the native OS dialogs everywhere.
8. `lib/hooks.ts` (`useLiveData`) keeps every screen in sync: it reloads on focus **and** instantly whenever any other mounted screen changes the same data, so there's no manual refresh needed after any add/edit/delete.
9. See below.

## 7. Round 2 — fixes after first real-device testing

A lot of this round was restoring functionality that shouldn't have been dropped in the first rebuild, plus fixing genuine new bugs (including two caused by Expo SDK 54 deprecating parts of `expo-file-system`).

**Regressions restored:**
- **Home to-do list** — to-dos are now a real global list again (`lib/storage.ts` → `TodosStore`, `@pocketbinder_todos`), not nested inside each course. Home has the status filter dropdown back (All / Upcoming / Missed / Completed) and its own "add to-do" button, with an optional "fill from a course" picker.
- **Course profile photo** — restored on the course detail page (tap the circle avatar at the top) and shown as the course's badge image in the Courses list.
- **Course detail tabs** — To-dos / Files / Links are now three tabs instead of one long stacked scroll.
- **Calendar → link to a course** — restored as an optional field on Add/Edit Event.
- **Calendar → view all upcoming** — restored as a "See all upcoming" link in the header that opens a full list of every future event, not just the selected day.

**Real bugs fixed:**
- **File upload/read crash** — `expo-file-system`'s root import deprecated `copyAsync`/`writeAsStringAsync` in SDK 54 and they now throw instead of just warning. Both `lib/fileOpen.ts` and `app/settings.tsx` now import from `expo-file-system/legacy`, which keeps the classic API working. No new package needed — it's the same `expo-file-system` you already have, just a different import path.
- **Links not opening** (`Could not open URL 'cvsu.edu.ph'`) — Android requires a full scheme. `lib/links.ts` now normalizes any saved URL to include `https://` if missing, both when a link is saved and defensively again when opened.
- **`ImagePicker.MediaTypeOptions` deprecation warning** — switched to the new `mediaTypes: ['images']` array syntax everywhere `expo-image-picker` is used.
- **Time picker didn't scroll** — the original wheel-style `FlatList` picker was replaced with a plain up/down stepper (tap to increment/decrement hour and minute, AM/PM toggle). Less fancy, but it actually works reliably, which matters more.
- **Birthday picker unusable for old dates** — `DateField` now has a "tap the month/year label" quick year-jump grid, instead of requiring dozens of taps on the month arrow to reach e.g. 2000.
- **Accent color did nothing** — the color was being saved but nothing ever read it. Added `lib/AccentContext.tsx`, a small React context that loads the saved accent and updates live the moment Settings is saved; `Button`, `FAB`, `SelectField`, `SwitchRow`, the tab bar, and every "+" icon now pull from it instead of a hardcoded color.
- **"Week starts on Monday" did nothing** — now actually threaded through: the Calendar screen's `firstDay` prop, the custom date picker's day grid/header, and the new Schedule weekly grid's column order all respect it.
- **Oversized Preferences card** — `Card` now accepts a `compact` prop for sections that only hold one row.

**Schedule page rebuilt as a real weekly grid** — `app/schedule.tsx` is now a spreadsheet-style timetable: a fixed time-label column down the left, day columns across the top (in Sun–Sat or Mon–Sun order per your week-start setting), and each class rendered as a colored block sized to its actual time span. Tap a block to edit, long-press to delete. The course-autofill logic inside the Add/Edit Schedule form is unchanged from before — only the surrounding page layout changed.

No new npm packages are required for this round — everything is a code/import fix on packages you already installed.


- **Test on a real device or emulator after installing the new packages** — `expo-image-picker` needs a rebuild (`npx expo run:android` or a new dev client), not just a Metro reload, since it's a native module.
- **Android permissions:** `expo-image-picker` will prompt for photo library access automatically; no manifest changes needed with the Expo config plugin, but double check `android/app/src/main/AndroidManifest.xml` after prebuild if you've hand-edited it before.
- **Old AsyncStorage data:** the storage keys are unchanged (`@pocketbinder_courses`, etc.) except courses now always has `files`/`links`/`todos` arrays — if you have real data saved from the old version missing those, the app treats missing arrays as empty, so nothing should crash, but it's worth clearing storage once during testing (Settings → Clear All Data) to start clean.
- **App icon design:** whenever you make the actual icon/splash image, keep it simple enough to read at small sizes — the adaptive icon foreground especially gets cropped into a circle/rounded-square by Android.
- **Optional polish (not required):** if you want the "modern" feel to go a step further, a rounded Google Font like Baloo 2 or Fredoka via `@expo-google-fonts/...` would fit the visual direction well — happy to wire that in if you want it later.
