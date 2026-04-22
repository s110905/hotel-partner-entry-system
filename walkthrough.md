# Walkthrough: Partner QR Management System

This document provides a comprehensive overview of the Partner block implemented in the Hotel Partner Entry System.

## Project Goal
Allow hotel partners to independently generate and manage guest entry QR codes with precise quota control and automated expiration logic.

## Core Features Implementation

### 1. Executive Dashboard (`PartnerPanel.tsx`)
- **Real-time Statistics**: Integrated 4 summary cards:
    - **Total Certificates**: Total count of generated QR codes.
    - **Total Quota**: Cumulative guest capacity allocated.
    - **Distribution Flow**: Total download count tracking.
    - **Consumption Rate**: Visual progress bar showing actual redemption progress.
- **Glassmorphism UI**: High-end aesthetic with backdrop blurs and subtle glows.

### 2. Intelligent QR Generation (`CreateQRForm.tsx`)
- **Interactive Form**: Inputs for Partner Name and Guest Quota (1-100).
- **Business Logic**: Automatically applies a 7-day validity period from the moment of creation.
- **Success Interaction**: Animated success state with a checkmark overlay after generation.

### 3. QR Lifecycle Card (`QRCard.tsx`)
- **Status Engine**: Dynamic badge system reflecting `Active`, `Partial Used`, `Used Up`, `Expired`, or `Disabled`.
- **QR Engine**: Direct rendering using the `qrcode` library.
- **Download Capability**: PNG export function providing guest-ready images.
- **Detailed Tracking**: Displays Creation Date, Expiry Date, Total Quota, and specific Used Quota.

### 4. Advanced Management List (`QRList.tsx`)
- **Search & Filter**: Real-time filtering by Name/Code and Multi-status toggles.
- **Sorting Engine**: Sort by Newest, Oldest, Capacity, or Urgency (Least Remaining).
- **View Switching**: Toggle between a dense List view and a visual Grid view.

## Modified & New Files
- `web/src/features/partner/PartnerPanel.tsx`: Main dashboard orchestrator.
- `web/src/components/partner/CreateQRForm.tsx`: Creation logic and UI.
- `web/src/components/partner/QRCard.tsx`: Individual QR record visual.
- `web/src/components/partner/QRList.tsx`: List management and filtering.
- `web/src/App.tsx`: Light integration for data flow.
- `web/src/index.css`: Global design tokens and Glassmorphism utilities.

## Demo Instructions

1.  **Launch**: `npm run dev` and navigate to the **Partner** tab.
2.  **Create**: Input a partner name (e.g. "Grand Hotel") and set quota to "4". Click **產生 QR Code**. Observe the success animation.
3.  **Inspect**: Check the card in the list. Verify the "Remaining" and "Expiry" fields (7 days from now).
4.  **Filter**: Toggle different status filters in the toolbar to see the list react.
5.  **Export**: Click **下載憑證** on a card. Check the downloaded PNG file.
6.  **Search**: Type part of a code or name in the search bar.
