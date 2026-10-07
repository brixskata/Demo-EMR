USE SmartEHR_Demo;
GO
IF COL_LENGTH(N'dbo.Admission', N'EncounterNumber') IS NULL
BEGIN
  ALTER TABLE dbo.Admission ADD EncounterNumber varchar(40) NULL;
END;
GO
;WITH NumberedAdmissions AS (
  SELECT AdmissionId, ROW_NUMBER() OVER (ORDER BY AdmissionId) AS RowNumber
  FROM dbo.Admission
  WHERE EncounterNumber IS NULL
)
UPDATE a
SET EncounterNumber = CONCAT('ENC-2026-', RIGHT('000000' + CONVERT(varchar(6), 183 + n.RowNumber), 6))
FROM dbo.Admission a
JOIN NumberedAdmissions n ON n.AdmissionId = a.AdmissionId;
GO
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.Admission') AND name = N'EncounterNumber' AND is_nullable = 0)
BEGIN
  ALTER TABLE dbo.Admission ALTER COLUMN EncounterNumber varchar(40) NOT NULL;
END;
GO
IF NOT EXISTS (SELECT 1 FROM sys.key_constraints WHERE name = N'UQ_Admission_EncounterNumber')
BEGIN
  ALTER TABLE dbo.Admission ADD CONSTRAINT UQ_Admission_EncounterNumber UNIQUE (EncounterNumber);
END;
GO
