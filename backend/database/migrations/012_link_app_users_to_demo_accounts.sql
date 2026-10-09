USE SmartEHR_Demo;
GO

IF COL_LENGTH(N'dbo.AppUser', N'DemoAccountId') IS NULL
BEGIN
  ALTER TABLE dbo.AppUser ADD DemoAccountId int NULL CONSTRAINT FK_AppUser_DemoAccount REFERENCES dbo.DemoAccount(DemoAccountId);
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'UX_AppUser_DemoAccountId' AND object_id = OBJECT_ID(N'dbo.AppUser'))
BEGIN
  CREATE UNIQUE INDEX UX_AppUser_DemoAccountId ON dbo.AppUser(DemoAccountId) WHERE DemoAccountId IS NOT NULL;
END;
GO
