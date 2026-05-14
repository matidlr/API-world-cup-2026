-- Curated rivalry matrix for team_rivals.
-- Source: teacher-defined historical rivalries for TP context.

DELETE FROM team_rivals;

WITH rivalry_matrix(teamId, rivalTeamId) AS (
  VALUES
  -- ==================== AFC ====================
  ('aus', 'jpn'), ('aus', 'kor'), ('aus', 'irn'), ('aus', 'sau'), ('aus', 'nzl'),
  ('irn', 'aus'), ('irn', 'sau'), ('irn', 'irq'), ('irn', 'kor'), ('irn', 'jpn'),
  ('irq', 'irn'), ('irq', 'sau'), ('irq', 'jor'), ('irq', 'qat'),
  ('jpn', 'aus'), ('jpn', 'kor'), ('jpn', 'irn'), ('jpn', 'sau'),
  ('jor', 'irq'), ('jor', 'qat'), ('jor', 'sau'), ('jor', 'irn'),
  ('qat', 'jor'), ('qat', 'sau'), ('qat', 'irn'), ('qat', 'irq'),
  ('sau', 'irn'), ('sau', 'aus'), ('sau', 'jpn'), ('sau', 'kor'), ('sau', 'qat'),
  ('kor', 'jpn'), ('kor', 'aus'), ('kor', 'irn'), ('kor', 'sau'),
  ('uzb', 'irn'), ('uzb', 'sau'), ('uzb', 'jpn'), ('uzb', 'kor'),

  -- ==================== CAF ====================
  ('alg', 'mar'), ('alg', 'egy'), ('alg', 'tun'), ('alg', 'sen'), ('alg', 'civ'),
  ('cpv', 'sen'), ('cpv', 'gha'), ('cpv', 'civ'), ('cpv', 'mar'),
  ('drc', 'sen'), ('drc', 'gha'), ('drc', 'civ'), ('drc', 'mar'),
  ('egy', 'alg'), ('egy', 'mar'), ('egy', 'tun'), ('egy', 'sen'), ('egy', 'gha'),
  ('gha', 'egy'), ('gha', 'civ'), ('gha', 'sen'), ('gha', 'mar'),
  ('civ', 'gha'), ('civ', 'sen'), ('civ', 'mar'), ('civ', 'alg'), ('civ', 'tun'),
  ('mar', 'alg'), ('mar', 'egy'), ('mar', 'tun'), ('mar', 'sen'), ('mar', 'civ'),
  ('sen', 'mar'), ('sen', 'civ'), ('sen', 'gha'), ('sen', 'egy'), ('sen', 'alg'),
  ('rsa', 'mar'), ('rsa', 'sen'), ('rsa', 'gha'), ('rsa', 'civ'),
  ('tun', 'alg'), ('tun', 'egy'), ('tun', 'mar'), ('tun', 'civ'),

  -- ==================== CONCACAF ====================
  ('can', 'usa'), ('can', 'mex'), ('can', 'pan'),
  ('cuw', 'hai'), ('cuw', 'usa'), ('cuw', 'mex'),
  ('hai', 'cuw'), ('hai', 'usa'), ('hai', 'mex'),
  ('mex', 'usa'), ('mex', 'can'), ('mex', 'pan'), ('mex', 'bra'),
  ('pan', 'mex'), ('pan', 'usa'), ('pan', 'can'),
  ('usa', 'mex'), ('usa', 'can'), ('usa', 'pan'),

  -- ==================== CONMEBOL ====================
  ('arg', 'bra'), ('arg', 'uru'), ('arg', 'eng'), ('arg', 'ned'), ('arg', 'fra'), ('arg', 'ger'),
  ('bra', 'arg'), ('bra', 'uru'), ('bra', 'col'), ('bra', 'mex'), ('bra', 'ger'), ('bra', 'fra'),
  ('col', 'bra'), ('col', 'arg'), ('col', 'ecu'), ('col', 'par'),
  ('ecu', 'col'), ('ecu', 'bra'), ('ecu', 'arg'), ('ecu', 'uru'),
  ('par', 'col'), ('par', 'bra'), ('par', 'arg'), ('par', 'uru'),
  ('uru', 'arg'), ('uru', 'bra'), ('uru', 'par'), ('uru', 'col'), ('uru', 'ned'),

  -- ==================== OFC ====================
  ('nzl', 'aus'), ('nzl', 'jpn'), ('nzl', 'kor'),

  -- ==================== UEFA ====================
  ('aut', 'ger'), ('aut', 'sui'), ('aut', 'cro'), ('aut', 'ned'),
  ('bel', 'ned'), ('bel', 'fra'), ('bel', 'ger'), ('bel', 'por'), ('bel', 'eng'),
  ('bih', 'cro'), ('bih', 'tur'),
  ('cro', 'bih'), ('cro', 'ger'), ('cro', 'fra'), ('cro', 'eng'), ('cro', 'arg'), ('cro', 'esp'),
  ('cze', 'ger'), ('cze', 'ned'), ('cze', 'esp'), ('cze', 'eng'),
  ('eng', 'ger'), ('eng', 'arg'), ('eng', 'fra'), ('eng', 'ned'), ('eng', 'cro'), ('eng', 'sco'),
  ('fra', 'ger'), ('fra', 'arg'), ('fra', 'eng'), ('fra', 'bel'), ('fra', 'esp'), ('fra', 'por'),
  ('ger', 'eng'), ('ger', 'ned'), ('ger', 'fra'), ('ger', 'arg'), ('ger', 'bra'), ('ger', 'esp'),
  ('ned', 'ger'), ('ned', 'arg'), ('ned', 'bra'), ('ned', 'eng'), ('ned', 'fra'), ('ned', 'bel'),('ned', 'esp'),
  ('nor', 'swe'), ('nor', 'ger'), ('nor', 'eng'),
  ('por', 'esp'), ('por', 'fra'), ('por', 'bel'), ('por', 'ger'), ('por', 'eng'),
  ('sco', 'eng'), ('sco', 'ger'), ('sco', 'ned'),
  ('esp', 'por'), ('esp', 'fra'), ('esp', 'ger'), ('esp', 'eng'), ('esp', 'cro'),('esp', 'ned'),
  ('swe', 'nor'), ('swe', 'ger'), ('swe', 'eng'),
  ('sui', 'ger'), ('sui', 'fra'), ('sui', 'aut'), ('sui', 'ned'),
  ('tur', 'ger'), ('tur', 'por'), ('tur', 'cro'), ('tur', 'esp')
)
INSERT INTO team_rivals (teamId, rivalTeamId, lastUpdate)
SELECT rivalries.teamId, rivalries.rivalTeamId, datetime('now')
FROM (
  SELECT DISTINCT teamId, rivalTeamId
  FROM rivalry_matrix
  WHERE teamId <> rivalTeamId
) AS rivalries
JOIN teams source_team ON source_team.teamId = rivalries.teamId
JOIN teams rival_team ON rival_team.teamId = rivalries.rivalTeamId;
