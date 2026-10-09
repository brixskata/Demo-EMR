USE SmartEHR_Demo;
GO

IF COL_LENGTH(N'dbo.CodeChartAccessActivity', N'PerformedByUserId') IS NULL
  ALTER TABLE dbo.CodeChartAccessActivity ADD PerformedByUserId int NULL;
IF COL_LENGTH(N'dbo.CodeChartAccessActivity', N'TargetDemoAccountId') IS NULL
  ALTER TABLE dbo.CodeChartAccessActivity ADD TargetDemoAccountId int NULL;
IF COL_LENGTH(N'dbo.CodeChartAccessActivity', N'PermissionBefore') IS NULL
  ALTER TABLE dbo.CodeChartAccessActivity ADD PermissionBefore varchar(20) NULL;
IF COL_LENGTH(N'dbo.CodeChartAccessActivity', N'PermissionAfter') IS NULL
  ALTER TABLE dbo.CodeChartAccessActivity ADD PermissionAfter varchar(20) NULL;
IF COL_LENGTH(N'dbo.CodeChartAccessActivity', N'DocumentId') IS NULL
  ALTER TABLE dbo.CodeChartAccessActivity ADD DocumentId int NULL;
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_CodeChartAccessActivity_PerformedBy')
  ALTER TABLE dbo.CodeChartAccessActivity ADD CONSTRAINT FK_CodeChartAccessActivity_PerformedBy FOREIGN KEY (PerformedByUserId) REFERENCES dbo.AppUser(UserId);
IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_CodeChartAccessActivity_TargetAccount')
  ALTER TABLE dbo.CodeChartAccessActivity ADD CONSTRAINT FK_CodeChartAccessActivity_TargetAccount FOREIGN KEY (TargetDemoAccountId) REFERENCES dbo.DemoAccount(DemoAccountId);
IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_CodeChartAccessActivity_Document')
  ALTER TABLE dbo.CodeChartAccessActivity ADD CONSTRAINT FK_CodeChartAccessActivity_Document FOREIGN KEY (DocumentId) REFERENCES dbo.MedicalDocument(DocumentId);
GO
