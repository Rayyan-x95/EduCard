# EduCard V2 Roadmap

## Introduction

EduCard V1 successfully defined the core user experience for generating sleek, cyberpunk-aesthetic digital business cards. It provided a seamless, zero-friction tool for users to compile their identity vectors into a scannable vCard QR code. 

However, as a purely client-side utility, it fundamentally limits the lifecycle of the user's digital identity. The goal of **EduCard V2** is to evolve this ephemeral generator into a **comprehensive digital identity platform**. By introducing persistent storage, user accounts, and dedicated cloud hosting, V2 will transform EduCard from a single-use utility into an active networking ecosystem where identities can live, adapt, and be shared dynamically.

---

## Current State (V1)

The V1 architecture operates entirely in the browser, providing a fast but stateless experience. Its primary characteristics include:

- **Client-Side Card Generation:** Real-time 3D parallax preview and dynamic styling natively in the browser via React and Tailwind CSS.
- **Local QR Code Generation:** Utilizing the local `qrcode` library to encode bulky raw vCard text strings directly into the matrix.
- **Local Preview & Export:** Relying heavily on DOM-scraping libraries (`html-to-image`, `jspdf`) to rasterize the screen for local downloads.
- **No Backend:** The Python microservice was minimized; the app uses zero network requests aside from initial asset loading.
- **No Persistent Storage:** Data uniquely exists in browser memory. A page refresh completely wipes the user's compiled matrix.

---

## Vision for V2

The long-term vision for EduCard is to become the premier **Digital Identity Ecosystem** for students, developers, and tech professionals. 

Instead of carrying around heavy vCard matrixes in dense QR codes, users will carry lightweight QR codes that link dynamically to cloud-hosted profiles. EduCard will serve as a central hub where users can update their contact details retroactively without having to reprint or regenerate physical or downloaded cards. It will bridge the gap between digital portfolios, physical networking, and modern contact management.

---

## Core Architecture Changes

Transforming into a cloud-native platform requires a fundamental shift from a monolithic Single Page Application (SPA) to a decentralized, database-backed web application. 

Key architectural shifts will include:
- **Introduction of a Backend / BaaS:** Migrating state logic to robust backend services.
- **Database Integration:** Moving from React component state to relational database rows.
- **Cloud Storage:** Offloading large Base64 image payloads to dedicated object storage buckets.
- **CDN Edge Delivery:** Ensuring global, low-latency access to public profiles.
- **URL-Driven Routing:** Generating globally unique, shareable URLs instead of raw vCard strings.

**Proposed Technologies:**
- **Supabase** (Authentication, PostgreSQL, Edge Functions)
- **Cloud Object Storage** (AWS S3 or Supabase Storage for avatars and cover images)
- **Vercel / Cloudflare** (Edge hosting and CDN)

---

## Major Features Planned for V2

### 1. Persistent Card Storage
User inputs will no longer disappear on refresh. Every interaction is saved to a database, allowing users to safely store multiple networking cards (e.g., one for hackathons, one for enterprise interviews).

### 2. Shareable Public Profiles
Cards will transition from local image blobs to dynamic web pages. Each card will be accessible via a unique, clean URL. The QR code will embed this URL rather than raw vCard text, making the QR visually simpler and instantly scannable by older devices.
- **Example Route:** `educard.app/card/johndoe`

### 3. User Authentication
A standardized account system supporting Email/Password and OAuth (GitHub, Google, LinkedIn). Users can claim their custom URLs and securely govern their data payload.

### 4. Dashboard
A centralized control panel where authenticated users can:
- View all active cards.
- Edit live vectors (updating a phone number instantly updates the data on the public URL).
- Regenerate visual assets.
- Delete or temporarily disable access to their ID matrices.

### 5. Social Links
Extended network connections. While V1 supports base networks, V2 will support a dynamic array of vectors (LinkedIn, GitHub, Personal Portfolios, X/Twitter, Discord, etc.), allowing users to attach endless relational data to their public profile.

### 6. Multiple Card Themes
Expanding the Tailwind design system into a persistent theme engine. Users can save custom hex-codes, select from a wider library of "Holo-foils", grid-backgrounds, and typography tokens, all saved to their database profile.

### 7. Analytics
A vital feature for networking. The dashboard will track:
- Total profile views.
- Unique QR code scans.
- Click-through-rates (CTR) on specific social vectors like GitHub or LinkedIn.

### 8. NFC Sharing
Hardware bridge support. Users can write their persistent `educard.app/card/username` URL directly to NDEF-enabled physical NFC tags. Tapping a phone to the physical card will instantly load their dynamic digital matrix.

---

## Technical Architecture (Proposed)

The V2 stack will rely strongly on modern serverless infrastructure to maintain the lightning-fast feel of V1 while adding robust capabilities.

- **Frontend:** **React + Vite** (Migrating gradually to **Next.js** for SEO rendering on the public `/card/:id` routes).
- **Backend / Auth:** **Supabase** (Handling user sessions, JWT routing, and secure API endpoints).
- **Database:** **PostgreSQL** (Managed by Supabase, enforcing strict Row Level Security (RLS)).
- **Storage:** **Supabase Storage** (For global avatar and background cover CDN delivery).
- **Hosting:** **Vercel** (Automatic deployments, edge-caching for blazing-fast profile deliveries).

**Interaction Flow:**
1. A user logs into the React SPA frontend.
2. The frontend requests the user's data from PostgreSQL via the Supabase client.
3. The user uploads a profile picture; it streams directly to Supabase Storage, and the URL is saved to the database.
4. When a stranger scans the generated QR code, they hit Vercel's edge network, which delivers the public Next.js/React profile page instantly.

---

## Database Schema Proposal

A standard relational setup will map Users -> Cards -> Analytics.

```sql
-- Users Table
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  plan_type VARCHAR DEFAULT 'free'
);

-- Cards Table
CREATE TABLE cards (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  slug VARCHAR UNIQUE NOT NULL,       -- e.g., 'johndoe'
  full_name VARCHAR,
  university VARCHAR,
  major VARCHAR,
  bio TEXT,
  avatar_url VARCHAR,
  theme_config JSONB,                 -- Stores colors, fonts, styles
  is_active BOOLEAN DEFAULT true,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Social Links Table
CREATE TABLE social_links (
  id UUID PRIMARY KEY,
  card_id UUID REFERENCES cards(id),
  platform VARCHAR,                   -- 'github', 'linkedin'
  url VARCHAR
);

-- Analytics Table
CREATE TABLE analytics (
  id UUID PRIMARY KEY,
  card_id UUID REFERENCES cards(id),
  event_type VARCHAR,                 -- 'scan', 'view', 'link_click'
  referrer VARCHAR,
  created_at TIMESTAMP DEFAULT NOW()
);