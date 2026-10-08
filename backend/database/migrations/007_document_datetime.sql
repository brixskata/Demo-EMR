USE SmartEHR_Demo;
GO

IF EXISTS (
  SELECT 1
  FROM sys.columns c
  INNER JOIN sys.types t ON t.user_type_id = c.user_type_id
  WHERE c.object_id = OBJECT_ID(N'dbo.MedicalDocument')
    AND c.name = N'DocumentDate'
    AND t.name = N'date'
)
BEGIN
  IF EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'dbo.MedicalDocument') AND name = N'IX_MedicalDocument_AdmissionId_Date')
    DROP INDEX IX_MedicalDocument_AdmissionId_Date ON dbo.MedicalDocument;

  ALTER TABLE dbo.MedicalDocument ALTER COLUMN DocumentDate datetime2(3) NOT NULL;

  CREATE INDEX IX_MedicalDocument_AdmissionId_Date ON dbo.MedicalDocument(AdmissionId, DocumentDate DESC);
END;
GO
