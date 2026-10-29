# Feature Specification: Fruit Growing Notices

**Feature Branch**: `002-fruit-growing-notices`

**Created**: 2026-10-15

**Status**: Draft

**Input**: User description: "new tab to notice of fruits, were have somes pages to talk about fruits, harvest date, if have some problem with weather or insects etc..."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Review information by fruit (Priority: P1)

As a user keeping track of fruit growing, I want a new tab with a page for each fruit so that
harvest dates and growing notices are easy to find together.

**Why this priority**: The new area and fruit-specific pages are the entry point to all of the
requested information.

**Independent Test**: Open the new tab, select a fruit, and confirm its harvest information and
notices appear on that fruit's page.

**Acceptance Scenarios**:

1. **Given** the user is on any existing app page, **When** they open the Growing Notes tab,
   **Then** they see an overview of the fruits and can open an individual fruit page.
2. **Given** a fruit has a harvest date and growing notices, **When** the user opens that
   fruit's page, **Then** both are shown with their dates and notice categories.
3. **Given** a fruit has no harvest date or notices, **When** the user opens its page,
   **Then** clear empty states explain how to add information.

### User Story 2 - Track harvest dates (Priority: P2)

As a user, I want to record a planned harvest date and later record when the fruit was
harvested so that I can keep its harvest schedule up to date.

**Why this priority**: Harvest dates are a core piece of the requested fruit information and
need to be manageable independently of issue notices.

**Independent Test**: Add or change a planned harvest date for a fruit, mark it harvested with
an actual date, and confirm the fruit page reflects the updated dates and status.

**Acceptance Scenarios**:

1. **Given** a fruit without a planned harvest date, **When** the user enters a valid date,
   **Then** the date appears on that fruit's page.
2. **Given** a fruit with a planned harvest date, **When** the user changes or removes it,
   **Then** the page reflects the change.
3. **Given** a planned harvest, **When** the user records that it was harvested and supplies
   the actual date, **Then** the page distinguishes the actual date from the planned date.

### User Story 3 - Record weather and insect notices (Priority: P2)

As a user, I want to add dated notes about weather or insect problems for a fruit so that I
can review what was observed over time.

**Why this priority**: Dated, fruit-specific notices capture the problems named in the
request without requiring external reports or automated diagnosis.

**Independent Test**: Add a weather notice and an insect notice to a fruit, then verify both
appear on its page in newest-first order with their category and date.

**Acceptance Scenarios**:

1. **Given** a fruit page, **When** the user adds a notice with a date, category, and
   description, **Then** the notice appears on that fruit's page.
2. **Given** multiple notices for a fruit, **When** the user views the list, **Then** notices
   are ordered newest first.
3. **Given** a notice, **When** the user edits or removes it, **Then** the displayed notice
   reflects that change or is no longer listed.

### User Story 4 - Keep growing notes between visits (Priority: P3)

As a user, I want my harvest dates and notices to remain available when I return on the same
device so that I do not have to re-enter them.

**Why this priority**: Retaining user-entered information makes the tracker useful over time,
after the core pages and record actions are available.

**Independent Test**: Save a harvest date and notice, reload the app in the same browser
profile, and confirm they remain.

**Acceptance Scenarios**:

1. **Given** saved harvest dates and notices, **When** the user reloads the app in the same
   browser profile, **Then** the records are restored.
2. **Given** no saved growing information, **When** the user opens the Growing Notes tab,
   **Then** the overview shows an empty or not-yet-recorded state without implying that
   information exists.
3. **Given** the browser cannot retain changes, **When** the user saves a record, **Then** the
   app clearly explains that the change may not be available after leaving or reloading.

### Edge Cases

- A harvest date or notice date is missing or invalid.
- A fruit has no harvest date, no notices, or only one kind of notice.
- Several notices have the same date; their relative order remains stable.
- A planned date is changed after it has passed, or the actual harvest date differs from it.
- A notice description contains only whitespace.
- A user attempts to save while local persistence is unavailable or full.
- The user removes a harvest date or notice and then reloads the page.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The application MUST provide a Growing Notes tab in the existing navigation and
  allow users to return to the existing shopping pages.
- **FR-002**: The Growing Notes overview MUST list each fruit in the existing storefront
  catalog and provide access to a page for that fruit.
- **FR-003**: Each fruit page MUST show that fruit's harvest information and its dated growing
  notices.
- **FR-004**: Users MUST be able to add, change, and remove a planned harvest date for a
  fruit.
- **FR-005**: Users MUST be able to mark a planned harvest as completed and record its actual
  harvest date separately from its planned date.
- **FR-006**: Users MUST be able to create, edit, and remove a dated notice for a fruit.
- **FR-007**: Each notice MUST have a category of weather, insects, or general growing note,
  and a non-empty description.
- **FR-008**: Fruit notices MUST be displayed newest first; notices with the same date MUST
  remain in a consistent relative order.
- **FR-009**: The application MUST validate dates and required notice descriptions and clearly
  explain invalid or incomplete entries without silently saving them.
- **FR-010**: The application MUST retain harvest information and notices on the user's device
  across reloads when local persistence is available.
- **FR-011**: If local persistence is unavailable or a save fails, the application MUST tell
  the user that changes may not be retained.
- **FR-012**: The new pages and controls MUST remain usable on desktop and mobile, provide
  meaningful accessible names, and support keyboard operation.
- **FR-013**: The feature MUST be limited to user-entered growing notes and harvest dates; it
  MUST NOT present itself as a live weather service, pest diagnosis, treatment
  recommendation, or automated alert.

### Key Entities *(include if feature involves data)*

- **Fruit Growing Record**: Information associated with one fruit in the storefront catalog,
  including its planned harvest date and whether a harvest has been recorded.
- **Harvest Record**: A fruit's planned harvest date and, when completed, its actual harvest
  date.
- **Growing Notice**: A dated, user-entered description associated with a fruit and categorized
  as weather, insects, or a general growing note.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can open the Growing Notes tab and reach a selected fruit's information
  page in no more than two selections.
- **SC-002**: A user can enter and save a harvest date or growing notice in under one minute.
- **SC-003**: All saved harvest dates and notices are restored after reload when local
  persistence is available.
- **SC-004**: Users can distinguish planned and actual harvest dates and identify a notice's
  fruit, category, and date from its displayed page.
- **SC-005**: Users receive a clear message for every invalid date, incomplete notice, or
  failed save tested.

## Assumptions

- "Pages to talk about fruits" means an overview and a separate information page for each
  fruit, rather than public discussion threads or communication between users.
- The tracker covers the fruit products already listed in the storefront catalog; adding
  custom fruit types is outside this feature.
- A harvest has one planned date and may have one actual date. Dates are entered by the user.
- Weather and insect information is manually entered by the user. Live weather data, pest
  identification, treatment advice, and push notifications are outside the requested scope.
- Records are available only in the current browser profile and are not shared or synchronized.
- This feature expands the current storefront-only project scope and overlaps its stated
  exclusion of inventory management. Before implementation, the product owner must explicitly
  approve the scope change by updating the project governance or narrowing the feature; this
  specification does not silently amend those constraints.
