# User Management Admin Panel — Design

**Dato:** 2026-02-23
**Branch:** feature/user-management

## Formål

Giv admin fuldt overblik over og styring af brugere: søgning, filtrering, tags til segmenteret markedsføring, entitlement-administration, og engagement-indsigt. Erstatter Zenler's People-sektion med en løsning tilpasset FamilyMind's datamodel.

## Bruger-statusser (beregnet, ikke gemt)

| Status   | Definition                                                    |
|----------|---------------------------------------------------------------|
| Trial    | Har konto, ingen betalt entitlement                           |
| Aktiv    | Aktiv betalt entitlement + aktivitet inden for 14 dage        |
| Inaktiv  | Aktiv betalt entitlement, ingen aktivitet i 14+ dage          |
| Churned  | Alle entitlements udløbet/annulleret                          |

## Nye Prisma-modeller

### AdminTag
```prisma
model AdminTag {
  id        String    @id @default(uuid()) @db.Uuid
  name      String    @unique
  color     String    @default("#6B7280") // hex farve til badge
  createdAt DateTime  @default(now())
  users     UserTag[]
}
```

### UserTag (many-to-many)
```prisma
model UserTag {
  id        String   @id @default(uuid()) @db.Uuid
  userId    String   @db.Uuid
  tagId     String   @db.Uuid
  createdAt DateTime @default(now())

  user User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  tag  AdminTag @relation(fields: [tagId], references: [id], onDelete: Cascade)

  @@unique([userId, tagId])
  @@index([userId])
  @@index([tagId])
}
```

### User-model ændringer
```prisma
// Tilføj til User:
lastActiveAt DateTime? // Opdateres via middleware/server action ved aktivitet
tags         UserTag[]
```

## Sider og routes

### 1. Brugerliste — `/admin/users`

**Layout:**
- Stats-kort øverst (klikbare som filtre): Total brugere, Aktive, Trial, Nye (7d), Churned
- Søgefelt (navn/email)
- Filter-toolbar: Rolle, Status, Tags, Forløb — som dropdowns
- Tabel med kolonner: Checkbox, Navn, Email, Status (badge), Tags, Sidst aktiv
- Bulk-action toolbar (vises når 1+ valgt): Tilføj tag, Fjern tag, Send email, Eksportér
- Paginering

**Søgning:** Case-insensitive ILIKE på navn og email.

**Filtre:**
- Rolle: USER / ADMIN
- Status: Trial / Aktiv / Inaktiv / Churned
- Tags: Multi-select dropdown med oprettede tags
- Forløb: Dropdown med alle journeys, filtrerer brugere med aktiv UserJourney

### 2. Brugerdetalje — `/admin/users/[id]`

**Header (altid synlig):**
- Navn, email, oprettelsesdato
- Status-badge
- Rolle-dropdown (USER/ADMIN)
- Tags med fjern-knap + tilføj-dropdown

**Tabs:**

#### Oversigt
- Summary-kort: Abonnement (produkt, pris, startdato), Engagement (aktive forløb, check-ins, community-indlæg)
- Aktivitetstidslinje: Kronologisk feed af brugerens handlinger (forløb-start, check-ins, community-aktivitet, kontoskabelse)

#### Køb & Abonnement
- Tabel over entitlements: Produkt, Kilde (SUBSCRIPTION/PURCHASE/GIFT/B2B_LICENSE), Status, Pris, Startdato, Udløb
- Actions: Giv adgang (opretter GIFT entitlement), Revoke, Se Stripe-detaljer (link)

#### Forløb
- Aktive journeys med fremdriftslinje (dag X af Y)
- Afsluttede journeys med completedAt
- Check-in historik per forløb

#### Community
- Kohorter brugeren er medlem af
- Antal indlæg og svar
- Eventuelle bans

#### Notifikationer
- Sendte emails (fra UserNotificationLog)
- In-app notifikationer (fra Notification)
- Tidslinje med type, dato, læst/ulæst

### 3. Tag-administration — `/admin/settings/tags`

- Liste over tags med navn og farve
- Opret ny tag (navn + farvevælger)
- Rediger/slet tag
- Vis antal brugere per tag

## Nav-ændring

Tilføj til admin sidebar i layout.tsx:
```typescript
{ href: '/admin/users', label: 'Brugere', icon: Users }
```

Placeres øverst i navigationen (det vigtigste admin-værktøj).

## Service layer

### Ny: `lib/services/admin-user.service.ts`
- `listUsers(filters, pagination, search)` — henter brugere med status-beregning, tags, entitlements
- `getUserDetail(userId)` — fuld brugerdetalje med alle relationer
- `updateUserRole(userId, role)` — ændrer rolle
- `getUserActivity(userId)` — samler aktivitetstidslinje fra flere tabeller
- `exportUsers(filters)` — CSV-eksport

### Ny: `lib/services/admin-tag.service.ts`
- `listTags()` — alle tags med bruger-antal
- `createTag(name, color)` — opret tag
- `updateTag(id, name, color)` — rediger
- `deleteTag(id)` — slet (cascade fjerner UserTag relationer)
- `addTagToUsers(tagId, userIds)` — bulk-tilføj
- `removeTagFromUsers(tagId, userIds)` — bulk-fjern

### Udvidelse: `lib/services/entitlement.service.ts`
- `grantAccess(userId, productId)` — opretter GIFT entitlement
- Eksisterende `revokeEntitlement()` genbruges

## Bulk-actions

### Tilføj/fjern tags
- Vælg brugere via checkboxes → vælg tag fra dropdown → bekræft
- Server action med $transaction for atomisk operation

### Send email
- Vælg brugere → skriv emne + besked → send via Resend
- Rate limiting: max 100 emails per batch
- Vis bekræftelse med antal modtagere før afsendelse

## Tracking af lastActiveAt

Opdater `User.lastActiveAt` ved:
- Sidevisning i dashboard/journeys (via server component)
- Check-in submission
- Community-indlæg/svar

Implementeres som en letvægts server action kaldt fra relevante sider.

## Fravalgt (YAGNI)

- Adressefelter (digitalt produkt, ingen brug)
- Password-administration (Supabase auth)
- Funnels/Live tabs (Zenler-specifikt)
- Bruger-impersonation
- Avanceret analytics/grafer (kan komme senere)
