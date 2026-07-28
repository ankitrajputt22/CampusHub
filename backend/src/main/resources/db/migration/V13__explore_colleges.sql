ALTER TABLE colleges
    ADD COLUMN city VARCHAR(100) NOT NULL DEFAULT 'India';

ALTER TABLE colleges
    ADD COLUMN state VARCHAR(100) NOT NULL DEFAULT 'India';

ALTER TABLE colleges
    ADD COLUMN logo_url VARCHAR(500);

ALTER TABLE colleges
    ADD COLUMN status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE';

UPDATE colleges
SET status = CASE WHEN active = TRUE THEN 'ACTIVE' ELSE 'INACTIVE' END;

UPDATE colleges SET city = 'New Delhi', state = 'Delhi' WHERE code = 'IITD';
UPDATE colleges SET city = 'Mumbai', state = 'Maharashtra' WHERE code = 'IITB';
UPDATE colleges SET city = 'Kanpur', state = 'Uttar Pradesh' WHERE code = 'IITK';
UPDATE colleges SET city = 'Chennai', state = 'Tamil Nadu' WHERE code = 'IITM';
UPDATE colleges SET city = 'Kharagpur', state = 'West Bengal' WHERE code = 'IITKGP';
UPDATE colleges SET city = 'New Delhi', state = 'Delhi' WHERE code = 'DU';
UPDATE colleges SET city = 'Pilani', state = 'Rajasthan' WHERE code = 'BITSP';
UPDATE colleges SET city = 'Vellore', state = 'Tamil Nadu' WHERE code = 'VIT';

UPDATE colleges SET city = 'Ambedkar Nagar', state = 'Uttar Pradesh'
WHERE code = 'RECABN';
UPDATE colleges SET city = 'Azamgarh', state = 'Uttar Pradesh'
WHERE code = 'RECAZG';
UPDATE colleges SET city = 'Banda', state = 'Uttar Pradesh'
WHERE code = 'RECBANDA';
UPDATE colleges SET city = 'Bijnor', state = 'Uttar Pradesh'
WHERE code = 'RECB';
UPDATE colleges SET city = 'Basti', state = 'Uttar Pradesh'
WHERE code = 'RECBASTI';
UPDATE colleges SET city = 'Gonda', state = 'Uttar Pradesh'
WHERE code = 'RECGONDA';
UPDATE colleges SET city = 'Kannauj', state = 'Uttar Pradesh'
WHERE code = 'RECK';
UPDATE colleges SET city = 'Mainpuri', state = 'Uttar Pradesh'
WHERE code = 'RECMAINPURI';
UPDATE colleges SET city = 'Mirzapur', state = 'Uttar Pradesh'
WHERE code = 'SARECMZP';
UPDATE colleges SET city = 'Pratapgarh', state = 'Uttar Pradesh'
WHERE code = 'RECP';
UPDATE colleges SET city = 'Sonbhadra', state = 'Uttar Pradesh'
WHERE code = 'RECSONBHADRA';

CREATE INDEX idx_colleges_explore
    ON colleges(active, status, name);
