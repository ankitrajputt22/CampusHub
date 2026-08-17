# Campus Hub Final Database Schema

Phase 24 finalizes the database design around one rule: the backend owns identity, college scope, marketplace ownership, payment state, trust score, moderation state, and audit history. The frontend can request actions, but protected identifiers such as `user_id`, `seller_id`, `buyer_id`, `college_id`, payment status, role, and trust score are derived or verified on the server.

The project uses Flyway migrations with MySQL-compatible SQL, `BIGINT AUTO_INCREMENT` primary keys, foreign keys for important relationships, status fields for business lifecycle, and URL/storage-key columns for files instead of binary blobs.

## Canonical module map

| Module | Canonical table/view | Current physical source | Notes |
| --- | --- | --- | --- |
| Users/Auth | `users` | `users` | Students, admins, and super admins. Passwords are BCrypt hashes only. |
| Colleges | `colleges` | `colleges` | Active colleges are shown during signup and browsing. |
| OTP | `otp_verifications` | `otp_verifications` | Stores hashed OTPs, attempt counts, resend count, expiry, and status. |
| Sessions | `refresh_tokens` | `refresh_tokens` | Stores token hashes only, plus device/IP/user-agent metadata. |
| Login security | `login_attempts` | `login_attempts` | Used for audit/rate-limit visibility. |
| Profile privacy | `user_privacy_settings` | View over `profile_privacy_settings` | Preserves existing profile implementation while exposing final naming. |
| User preferences | `user_notification_preferences` | `user_notification_preferences` | Notification channel and event preferences. |
| User settings | `user_settings` | `user_settings` | Theme, language, marketplace defaults, and safety reminders. |
| Categories | `categories` | `categories` | Canonical global marketplace categories managed by super admins. |
| Listings | `listings` | `listings` | Seller and college are derived from authenticated user. Soft deletion uses status plus timestamps. |
| Listing images | `listing_images` | `listing_images` | Stores image URLs/storage names, not binary files. |
| Wishlist | `wishlist` | View over `wishlist_items` | One row per authenticated user/listing pair. |
| Orders | `orders` | View over `marketplace_orders` | Buyer/seller/listing/payment lifecycle is backend controlled. |
| Order history | `order_status_history` | `order_status_history` | Tracks order status transitions. |
| Payments | `payments` | `payments` | Razorpay IDs and verified payment state only; no card data or secrets. |
| Payment attempts | `payment_attempts` | `payment_attempts` | Tracks checkout/verification attempts. |
| Reviews | `reviews` | View over `seller_reviews` | Reviews are tied to completed orders and can be moderated. |
| Rating summary | `user_rating_summary` | `user_rating_summary` | Derived aggregate for fast seller/profile reads. |
| Notifications | `notifications` | `notifications` | User-facing notifications separate from source events. |
| Reports | `reports` | `reports` | Report queue records independent of moderation actions. |
| Report evidence | `report_evidence` | `report_evidence` | Optional evidence metadata; files remain external. |
| Moderation | `moderation_actions` | `moderation_actions` | Moderator decisions linked to reports. |
| Audit | `audit_logs` | View over `admin_audit_logs` | Canonical append-only audit surface for admin actions. |
| Support | `support_tickets` | `support_tickets` | Public and authenticated support requests. |
| Support replies | `support_ticket_replies` | `support_ticket_replies` | User/admin/guest replies and internal notes. |
| Support attachments | `support_ticket_attachments` | `support_ticket_attachments` | Stores attachment metadata only. |
| Support history | `support_ticket_status_history` | `support_ticket_status_history` | Ticket status transitions. |
| Chat | `conversations` | View over `chat_conversations` | Buyer-seller conversations derived from listing/order relationships. |
| Chat participants | `conversation_participants` | View over `chat_conversation_participants` | Participant state, mute/archive, unread count. |
| Chat messages | `chat_messages` | `chat_messages` | Soft deletion and read status. |
| Chat reports | `chat_message_reports` | `chat_message_reports` | Message-level reporting. |
| Trust score | `trust_scores` | `trust_scores` | Current score and component scores; backend calculated. |
| Trust history | `trust_score_history` | `trust_score_history` | Recalculation and event history. |
| Trust penalties | `trust_score_penalties` | `trust_score_penalties` | Active/expired penalty records. |
| Super admin settings | `platform_settings` | `platform_settings` | Safe feature flags and numeric/string limits. |
| Deactivation | `account_deactivation_requests` | `account_deactivation_requests` | User account lifecycle requests and admin review state. |
| Legal acceptance | `user_legal_acceptances` | `user_legal_acceptances` | Optional versioned acceptance records. |
| Schema registry | `schema_table_registry` | `schema_table_registry` | Documents canonical/physical mapping inside the database. |

## Security and privacy decisions

- `users.password_hash` stores BCrypt hashes only.
- `otp_verifications.otp_hash` stores hashed OTP values only.
- `refresh_tokens.token_hash` stores hashed refresh tokens only.
- Razorpay secrets remain environment variables; payment tables store only order/payment IDs, signatures, status, and failure/refund metadata.
- File uploads store URLs or storage keys, never binary payloads.
- Important business data uses statuses and history tables instead of hard delete.
- Marketplace ownership is protected by deriving seller, buyer, college, and order relationships from JWT/database state.
- Trust scores and penalties are backend-calculated/admin-moderated; clients cannot submit final score values.

## Compatibility notes

Some earlier phases already shipped working table names such as `marketplace_orders`, `wishlist_items`, `seller_reviews`, and `profile_privacy_settings`. Phase 24 keeps those tables because backend entities already use them, then exposes canonical names through views and the schema registry. This avoids breaking local data while giving the project a stable final naming contract for future work.
