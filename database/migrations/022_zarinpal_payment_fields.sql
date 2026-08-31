/*
  Zarinpal payment hardening.

  The existing durable checkout row remains the source of truth for the
  customer-facing amount. These fields retain the exact gateway amount and
  payment lifecycle timestamps needed for callback retries and reconciliation.
*/
SET XACT_ABORT ON;
BEGIN TRANSACTION;

IF OBJECT_ID(N'Commerce.SecureCheckoutSessions', N'U') IS NULL
  THROW 50000, 'Commerce.SecureCheckoutSessions is required before migration 022.', 1;

IF COL_LENGTH(N'Commerce.SecureCheckoutSessions', N'gateway_amount') IS NULL
  ALTER TABLE Commerce.SecureCheckoutSessions ADD gateway_amount BIGINT NULL;

IF COL_LENGTH(N'Commerce.SecureCheckoutSessions', N'payment_requested_at') IS NULL
  ALTER TABLE Commerce.SecureCheckoutSessions ADD payment_requested_at DATETIME2(3) NULL;

IF COL_LENGTH(N'Commerce.SecureCheckoutSessions', N'payment_verified_at') IS NULL
  ALTER TABLE Commerce.SecureCheckoutSessions ADD payment_verified_at DATETIME2(3) NULL;

IF COL_LENGTH(N'Commerce.SecureCheckoutSessions', N'payment_failed_at') IS NULL
  ALTER TABLE Commerce.SecureCheckoutSessions ADD payment_failed_at DATETIME2(3) NULL;

IF COL_LENGTH(N'Commerce.SecureCheckoutSessions', N'payment_cancelled_at') IS NULL
  ALTER TABLE Commerce.SecureCheckoutSessions ADD payment_cancelled_at DATETIME2(3) NULL;

COMMIT TRANSACTION;
