USE SmartEHR_Demo;
GO
IF COL_LENGTH(N'dbo.MedicalDocument', N'DocumentName') IS NULL
BEGIN
  ALTER TABLE dbo.MedicalDocument ADD DocumentName nvarchar(255) NULL;
END;
GO
