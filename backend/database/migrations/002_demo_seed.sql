USE SmartEHR_Demo;
GO
IF NOT EXISTS (SELECT 1 FROM dbo.Patient WHERE PatientNumber = 'DEMO-PT-001')
BEGIN
  INSERT dbo.Patient (PatientNumber, FirstName, LastName, DateOfBirth, Sex)
  VALUES ('DEMO-PT-001', 'Kean John Amata', 'Dela Cruz', '1991-04-18', 'Male');
END;
IF NOT EXISTS (SELECT 1 FROM dbo.Patient WHERE PatientNumber = 'DEMO-PT-002')
BEGIN
  INSERT dbo.Patient (PatientNumber, FirstName, LastName, DateOfBirth, Sex)
  VALUES ('DEMO-PT-002', 'Kalix Nomar Valiente', 'Abdurahman', '1987-09-02', 'Male');
END;
IF NOT EXISTS (SELECT 1 FROM dbo.Patient WHERE PatientNumber = 'DEMO-PT-003')
BEGIN
  INSERT dbo.Patient (PatientNumber, FirstName, LastName, DateOfBirth, Sex)
  VALUES ('DEMO-PT-003', 'Amara Elise Navarro', 'Santos', '1996-12-11', 'Female');
END;
GO
IF NOT EXISTS (SELECT 1 FROM dbo.Admission WHERE AdmissionNumber = 'DEMO-ADM-001')
BEGIN
  INSERT dbo.Admission (PatientId, AdmissionNumber, AdmissionDate, DischargeDate, Ward, Status)
  SELECT PatientId, 'DEMO-ADM-001', '2026-09-14T08:20:00Z', '2026-09-18T15:30:00Z', 'North Wing · Room 204', 'Discharged' FROM dbo.Patient WHERE PatientNumber = 'DEMO-PT-001';
END;
IF NOT EXISTS (SELECT 1 FROM dbo.Admission WHERE AdmissionNumber = 'DEMO-ADM-002')
BEGIN
  INSERT dbo.Admission (PatientId, AdmissionNumber, AdmissionDate, DischargeDate, Ward, Status)
  SELECT PatientId, 'DEMO-ADM-002', '2026-05-02T10:00:00Z', '2026-05-05T11:15:00Z', 'South Wing · Room 112', 'Discharged' FROM dbo.Patient WHERE PatientNumber = 'DEMO-PT-001';
END;
IF NOT EXISTS (SELECT 1 FROM dbo.Admission WHERE AdmissionNumber = 'DEMO-ADM-003')
BEGIN
  INSERT dbo.Admission (PatientId, AdmissionNumber, AdmissionDate, DischargeDate, Ward, Status)
  SELECT PatientId, 'DEMO-ADM-003', '2026-09-21T07:45:00Z', NULL, 'East Wing · Room 308', 'Active' FROM dbo.Patient WHERE PatientNumber = 'DEMO-PT-002';
END;
IF NOT EXISTS (SELECT 1 FROM dbo.Admission WHERE AdmissionNumber = 'DEMO-ADM-004')
BEGIN
  INSERT dbo.Admission (PatientId, AdmissionNumber, AdmissionDate, DischargeDate, Ward, Status)
  SELECT PatientId, 'DEMO-ADM-004', '2026-08-07T09:10:00Z', '2026-08-09T14:00:00Z', 'North Wing · Room 216', 'Discharged' FROM dbo.Patient WHERE PatientNumber = 'DEMO-PT-003';
END;
GO
IF NOT EXISTS (SELECT 1 FROM dbo.MedicalDocument)
BEGIN
  INSERT dbo.MedicalDocument (AdmissionId, DocumentType, FileName, DocumentDate, UploadedBy, Status, StoragePath)
  SELECT a.AdmissionId, d.DocumentType, d.FileName, d.DocumentDate, d.UploadedBy, 'ACTIVE', CONCAT('demo://synthetic/', d.FileName)
  FROM (VALUES
    ('DEMO-ADM-001','Medical Certificate','medical-certificate-demo.pdf', '2026-09-14','Records Staff'),
    ('DEMO-ADM-001','Laboratory Result','laboratory-result-demo.pdf', '2026-09-15','Records Staff'),
    ('DEMO-ADM-001','Discharge Summary','discharge-summary-demo.pdf', '2026-09-18','Dr. Demo'),
    ('DEMO-ADM-002','Clinical Notes','clinical-notes-demo.pdf', '2026-05-02','Nurse Demo'),
    ('DEMO-ADM-003','Imaging Result','imaging-result-demo.pdf', '2026-09-22','Records Staff'),
    ('DEMO-ADM-004','Prescription','prescription-demo.pdf', '2026-08-08','Dr. Demo')
  ) d(AdmissionNumber, DocumentType, FileName, DocumentDate, UploadedBy)
  JOIN dbo.Admission a ON a.AdmissionNumber = d.AdmissionNumber;
END;
GO
