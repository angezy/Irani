/*
  The old external supplier connections are retired. Keep their rows and
  transaction history for accounting/audit purposes, but prevent them from
  appearing as active fulfillment providers in an existing database.
*/
SET XACT_ABORT ON;
BEGIN TRANSACTION;

IF OBJECT_ID(N'Commerce.Suppliers', N'U') IS NOT NULL
BEGIN
  UPDATE [Commerce].[Suppliers]
  SET [Status] = N'Disabled'
  WHERE UPPER(LTRIM(RTRIM([Code]))) IN (N'CJ', N'HYPERSKU')
     OR LOWER(REPLACE(LTRIM(RTRIM([Name])), N' ', N'')) IN (N'cjdropshipping', N'hypersku');
END;

COMMIT TRANSACTION;
