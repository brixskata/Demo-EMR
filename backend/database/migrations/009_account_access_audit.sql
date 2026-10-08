USE SmartEHR_Demo;
GO
IF COL_LENGTH(N'dbo.CodeChartAccessActivity', N'ExpiresAt') IS NULL ALTER TABLE dbo.CodeChartAccessActivity ADD ExpiresAt datetime2(3) NULL;
IF COL_LENGTH(N'dbo.CodeChartAccessActivity', N'Reason') IS NULL ALTER TABLE dbo.CodeChartAccessActivity ADD Reason varchar(30) NULL;
IF EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_CodeChartAccessActivity_Action')
  ALTER TABLE dbo.CodeChartAccessActivity DROP CONSTRAINT CK_CodeChartAccessActivity_Action;
ALTER TABLE dbo.CodeChartAccessActivity ADD CONSTRAINT CK_CodeChartAccessActivity_Action CHECK (Action IN ('GRANTED_ACCESS','CHANGED_PERMISSION','REVOKED_ACCESS','EXPIRED_ACCESS','VIEWED_DOCUMENT','UPLOADED_DOCUMENT'));
GO
