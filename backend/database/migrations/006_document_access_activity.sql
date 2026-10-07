USE SmartEHR_Demo;
GO
IF OBJECT_ID(N'dbo.CodeChartAccessActivity', N'U') IS NOT NULL
BEGIN
  IF EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_CodeChartAccessActivity_Action')
    ALTER TABLE dbo.CodeChartAccessActivity DROP CONSTRAINT CK_CodeChartAccessActivity_Action;
  UPDATE dbo.CodeChartAccessActivity SET Action = 'VIEWED_DOCUMENT' WHERE Action = 'VIEWED_CHART';
  ALTER TABLE dbo.CodeChartAccessActivity ADD CONSTRAINT CK_CodeChartAccessActivity_Action CHECK (Action IN ('GRANTED_ACCESS','CHANGED_PERMISSION','REVOKED_ACCESS','VIEWED_DOCUMENT','UPLOADED_DOCUMENT'));
END;
GO
