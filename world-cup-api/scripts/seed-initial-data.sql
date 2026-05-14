-- Base reference data (teams, team_stats, team_history)

-- Upsert qualified World Cup teams
INSERT INTO teams (teamId, name, groupName, footballAssociation, rating, coach, captain, strategy)
VALUES
  ('aus', 'Australia', 'AFC', 'AFC', 78, 'Tony Popovic', 'Mathew Ryan', 'ATTACK'),
  ('irn', 'Iran', 'AFC', 'AFC', 79, 'Amir Ghalenoei', 'Mehdi Taremi', 'COUNTER_ATTACK'),
  ('irq', 'Iraq', 'AFC', 'AFC', 74, 'Graham Arnold', 'Jalal Hassan', 'DEFENSE'),
  ('jpn', 'Japan', 'AFC', 'AFC', 82, 'Hajime Moriyasu', 'Wataru Endo', 'POSSESSION'),
  ('jor', 'Jordan', 'AFC', 'AFC', 72, 'Jamal Sellami', 'Musa Al-Taamari', 'COUNTER_ATTACK'),
  ('qat', 'Qatar', 'AFC', 'AFC', 71, 'Julen Lopetegui', 'Hassan Al-Haydos', 'DEFENSE'),
  ('sau', 'Saudi Arabia', 'AFC', 'AFC', 75, 'Georgios Donis', 'Salem Al-Dawsari', 'DEFENSE'),
  ('kor', 'South Korea', 'AFC', 'AFC', 81, 'Hong Myung-bo', 'Son Heung-min', 'ATTACK'),
  ('uzb', 'Uzbekistan', 'AFC', 'AFC', 73, 'Fabio Cannavaro', 'Eldor Shomurodov', 'COUNTER_ATTACK'),

  ('alg', 'Algeria', 'CAF', 'CAF', 79, 'Vladimir Petković', 'Riyad Mahrez', 'ATTACK'),
  ('cpv', 'Cape Verde', 'CAF', 'CAF', 70, 'Bubista', 'Ryan Mendes', 'COUNTER_ATTACK'),
  ('drc', 'DR Congo', 'CAF', 'CAF', 72, 'Sébastien Desabre', 'Chancel Mbemba', 'DEFENSE'),
  ('egy', 'Egypt', 'CAF', 'CAF', 80, 'Hossam Hassan', 'Mohamed Salah', 'ATTACK'),
  ('gha', 'Ghana', 'CAF', 'CAF', 77, 'Otto Addo', 'Thomas Partey', 'ATTACK'),
  ('civ', 'Ivory Coast', 'CAF', 'CAF', 79, 'Emerse Faé', 'Franck Kessie', 'ATTACK'),
  ('mar', 'Morocco', 'CAF', 'CAF', 84, 'Mohamed Ouahbi', 'Achraf Hakimi', 'ATTACK'),
  ('sen', 'Senegal', 'CAF', 'CAF', 82, 'Pape Thiaw', 'Sadio Mane', 'ATTACK'),
  ('rsa', 'South Africa', 'CAF', 'CAF', 72, 'Hugo Broos', 'Percy Tau', 'DEFENSE'),
  ('tun', 'Tunisia', 'CAF', 'CAF', 75, 'Sami Trabelsi', 'Youssef Msakni', 'DEFENSE'),

  ('can', 'Canada', 'CONCACAF', 'CONCACAF', 78, 'Jesse Marsch', 'Alphonso Davies', 'ATTACK'),
  ('cuw', 'Curacao', 'CONCACAF', 'CONCACAF', 67, 'Dick Advocaat', 'Leandro Bacuna', 'COUNTER_ATTACK'),
  ('hai', 'Haiti', 'CONCACAF', 'CONCACAF', 66, 'Sébastien Migné', 'Duckens Nazon', 'COUNTER_ATTACK'),
  ('mex', 'Mexico', 'CONCACAF', 'CONCACAF', 80, 'Javier Aguirre', 'Edson Alvarez', 'ATTACK'),
  ('pan', 'Panama', 'CONCACAF', 'CONCACAF', 73, 'Thomas Christiansen', 'Anibal Godoy', 'DEFENSE'),
  ('usa', 'United States', 'CONCACAF', 'CONCACAF', 82, 'Mauricio Pochettino', 'Christian Pulisic', 'ATTACK'),

  ('arg', 'Argentina', 'CONMEBOL', 'CONMEBOL', 93, 'Lionel Scaloni', 'Lionel Messi', 'COUNTER_ATTACK'),
  ('bra', 'Brazil', 'CONMEBOL', 'CONMEBOL', 92, 'Carlo Ancelotti', 'Marquinhos', 'ATTACK'),
  ('col', 'Colombia', 'CONMEBOL', 'CONMEBOL', 84, 'Néstor Lorenzo', 'James Rodriguez', 'ATTACK'),
  ('ecu', 'Ecuador', 'CONMEBOL', 'CONMEBOL', 79, 'Sebastián Beccacece', 'Enner Valencia', 'DEFENSE'),
  ('par', 'Paraguay', 'CONMEBOL', 'CONMEBOL', 77, 'Gustavo Alfaro', 'Gustavo Gomez', 'DEFENSE'),
  ('uru', 'Uruguay', 'CONMEBOL', 'CONMEBOL', 84, 'Marcelo Bielsa', 'Federico Valverde', 'COUNTER_ATTACK'),

  ('nzl', 'New Zealand', 'OFC', 'OFC', 71, 'Darren Bazeley', 'Chris Wood', 'COUNTER_ATTACK'),

  ('aut', 'Austria', 'UEFA', 'UEFA', 80, 'Ralf Rangnick', 'David Alaba', 'ATTACK'),
  ('bel', 'Belgium', 'UEFA', 'UEFA', 85, 'Rudi Garcia', 'Kevin De Bruyne', 'ATTACK'),
  ('bih', 'Bosnia and Herzegovina', 'UEFA', 'UEFA', 72, 'Sergej Barbarez', 'Edin Dzeko', 'DEFENSE'),
  ('cro', 'Croatia', 'UEFA', 'UEFA', 82, 'Zlatko Dalić', 'Luka Modric', 'ATTACK'),
  ('cze', 'Czech Republic', 'UEFA', 'UEFA', 78, 'Miroslav Koubek', 'Tomas Soucek', 'DEFENSE'),
  ('eng', 'England', 'UEFA', 'UEFA', 89, 'Thomas Tuchel', 'Harry Kane', 'BALANCED'),
  ('fra', 'France', 'UEFA', 'UEFA', 91, 'Didier Deschamps', 'Kylian Mbappe', 'ATTACK'),
  ('ger', 'Germany', 'UEFA', 'UEFA', 88, 'Julian Nagelsmann', 'Ilkay Gundogan', 'ATTACK'),
  ('ned', 'Netherlands', 'UEFA', 'UEFA', 86, 'Ronald Koeman', 'Virgil van Dijk', 'ATTACK'),
  ('nor', 'Norway', 'UEFA', 'UEFA', 81, 'Ståle Solbakken', 'Martin Odegaard', 'ATTACK'),
  ('por', 'Portugal', 'UEFA', 'UEFA', 87, 'Roberto Martínez', 'Bruno Fernandes', 'ATTACK'),
  ('sco', 'Scotland', 'UEFA', 'UEFA', 77, 'Steve Clarke', 'Andrew Robertson', 'DEFENSE'),
  ('esp', 'Spain', 'UEFA', 'UEFA', 89, 'Luis de la Fuente', 'Alvaro Morata', 'POSSESSION'),
  ('swe', 'Sweden', 'UEFA', 'UEFA', 79, 'Graham Potter', 'Emil Forsberg', 'DEFENSE'),
  ('sui', 'Switzerland', 'UEFA', 'UEFA', 80, 'Murat Yakin', 'Granit Xhaka', 'DEFENSE'),
  ('tur', 'Turkey', 'UEFA', 'UEFA', 80, 'Vincenzo Montella', 'Hakan Calhanoglu', 'ATTACK')
ON CONFLICT(teamId) DO UPDATE SET
  name = excluded.name,
  groupName = excluded.groupName,
  footballAssociation = excluded.footballAssociation,
  rating = excluded.rating,
  coach = excluded.coach,
  captain = excluded.captain,
  strategy = excluded.strategy,
  lastUpdate = datetime('now');

-- Set default formation from selected strategy (can be changed later via API)
UPDATE teams
SET formation = CASE strategy
  WHEN 'DEFENSE' THEN '5-4-1'
  WHEN 'COUNTER_ATTACK' THEN '4-4-2'
  WHEN 'PENALTIES' THEN '4-1-4-1'
  WHEN 'BALANCED' THEN '4-2-3-1'
  WHEN 'POSSESSION' THEN '4-3-3'
  ELSE '4-3-3'
END,
lastUpdate = datetime('now');

DELETE FROM team_tactics_defaults;

INSERT INTO team_tactics_defaults (teamId, defaultStrategy, defaultFormation)
SELECT teamId, strategy, formation
FROM teams;

-- Refresh stats based on rating
DELETE FROM team_stats;

INSERT INTO team_stats (teamId, attack, defense, midfield, overall)
SELECT
  teamId,
  CASE WHEN rating + 2 > 99 THEN 99 ELSE rating + 2 END,
  CASE WHEN rating - 4 < 60 THEN 60 ELSE rating - 4 END,
  CASE WHEN rating - 2 < 60 THEN 60 ELSE rating - 2 END,
  rating
FROM teams;

-- Refresh history with enriched titles by confederation
-- Format per title: { org, tournament, count, years[], hosts[] }
DELETE FROM team_history;

INSERT INTO team_history (teamId, titlesJson)
WITH history(teamId, titlesJson) AS (
VALUES

-- ==================== AFC ====================

('aus', '[]'),

('irn', '[]'),

('irq', '[]'),

('jpn', '[
  {"org":"AFC","tournament":"Asian Cup","count":4,"years":["1992","2000","2004","2011"],"hosts":["Japan","Lebanon","China","Qatar"]}
]'),

('jor', '[]'),

('qat', '[
  {"org":"AFC","tournament":"Asian Cup","count":1,"years":["2019"],"hosts":["United Arab Emirates"]}
]'),

('sau', '[
  {"org":"AFC","tournament":"Asian Cup","count":3,"years":["1984","1988","1996"],"hosts":["Singapore","Qatar","UAE"]}
]'),

('kor', '[
  {"org":"AFC","tournament":"Asian Cup","count":2,"years":["1956","1960"],"hosts":["Hong Kong","South Korea"]}
]'),

('uzb', '[]'),

-- ==================== CAF ====================

('alg', '[
  {"org":"CAF","tournament":"Africa Cup of Nations","count":2,"years":["1990","2019"],"hosts":["Algeria","Egypt"]}
]'),

('cpv', '[]'),

('drc', '[
  {"org":"CAF","tournament":"Africa Cup of Nations","count":2,"years":["1968","1974"],"hosts":["Ethiopia","Egypt"]}
]'),

('egy', '[
  {"org":"FIFA","tournament":"World Cup","count":0,"years":[],"hosts":[]},
  {"org":"CAF","tournament":"Africa Cup of Nations","count":7,"years":["1957","1959","1986","1998","2006","2008","2010"],"hosts":["Sudan","Egypt","Egypt","Burkina Faso","Egypt","Ghana","Angola"]}
]'),

('gha', '[
  {"org":"CAF","tournament":"Africa Cup of Nations","count":4,"years":["1963","1965","1978","1982"],"hosts":["Ghana","Tunisia","Ghana","Libya"]}
]'),

('civ', '[
  {"org":"CAF","tournament":"Africa Cup of Nations","count":3,"years":["1992","2015","2023"],"hosts":["Senegal","Equatorial Guinea","Ivory Coast"]}
]'),

('mar', '[
  {"org":"CAF","tournament":"Africa Cup of Nations","count":2,"years":["1976","2025"],"hosts":["Ethiopia","Morocco"]}
]'),

('sen', '[
  {"org":"CAF","tournament":"Africa Cup of Nations","count":2,"years":["2021","2025"],"hosts":["Cameroon","Morocco"]}
]'),

('rsa', '[
  {"org":"CAF","tournament":"Africa Cup of Nations","count":1,"years":["1996"],"hosts":["South Africa"]}
]'),

('tun', '[
  {"org":"CAF","tournament":"Africa Cup of Nations","count":1,"years":["2004"],"hosts":["Tunisia"]}
]'),

-- ==================== CONCACAF ====================

('can', '[]'),

('cuw', '[]'),

('hai', '[]'),

('mex', '[
  {"org":"CONCACAF","tournament":"Gold Cup","count":12,"years":["1965","1971","1977","1993","1996","1998","2003","2009","2011","2015","2019","2023"],"hosts":["Guatemala","Haiti","Mexico","Mexico / USA","United States","United States","Mexico / USA","United States","United States","United States / Canada","United States","United States"]}
]'),

('pan', '[]'),

('usa', '[
  {"org":"CONCACAF","tournament":"Gold Cup","count":6,"years":["1991","2002","2005","2007","2013","2017"],"hosts":["United States","United States","United States","United States","United States","United States"]}
]'),

-- ==================== CONMEBOL ====================

('arg', '[
  {"org":"FIFA","tournament":"World Cup","count":3,"years":["1978","1986","2022"],"hosts":["Argentina","Mexico","Qatar"]},
  {"org":"CONMEBOL","tournament":"Copa América","count":16,"years":["1921","1925","1927","1929","1937","1941","1945","1946","1947","1955","1957","1959","1991","1993","2021","2024"],"hosts":["Argentina","Argentina","Peru","Argentina","Argentina","Chile","Chile","Argentina","Ecuador","Chile","Peru","Argentina","Chile","Ecuador","Brazil","United States"]},
  {"org":"FIFA","tournament":"Confederations Cup","count":1,"years":["1992"],"hosts":["Saudi Arabia"]},
  {"org":"CONMEBOL-UEFA","tournament":"Finalissima","count":2,"years":["1993","2022"],"hosts":["Argentina","England"]},
  {"org":"Other","tournament":"Panamerican Championship","count":1,"years":["1960"],"hosts":["Costa Rica"]}
]'),

('bra', '[
  {"org":"FIFA","tournament":"World Cup","count":5,"years":["1958","1962","1970","1994","2002"],"hosts":["Sweden","Chile","Mexico","United States","South Korea / Japan"]},
  {"org":"CONMEBOL","tournament":"Copa América","count":9,"years":["1919","1922","1949","1989","1997","1999","2004","2007","2019"],"hosts":["Brazil","Brazil","Brazil","Brazil","Bolivia","Paraguay","Peru","Venezuela","Brazil"]}
]'),

('col', '[
  {"org":"CONMEBOL","tournament":"Copa América","count":1,"years":["2001"],"hosts":["Colombia"]}
]'),

('ecu', '[]'),

('par', '[
  {"org":"CONMEBOL","tournament":"Copa América","count":2,"years":["1953","1979"],"hosts":["Peru","Multiple"]}
]'),

('uru', '[
  {"org":"FIFA","tournament":"World Cup","count":2,"years":["1930","1950"],"hosts":["Uruguay","Brazil"]},
  {"org":"CONMEBOL","tournament":"Copa América","count":15,"years":["1916","1917","1920","1923","1924","1926","1935","1942","1956","1959","1967","1983","1987","1995","2011"],"hosts":["Argentina","Uruguay","Chile","Uruguay","Uruguay","Chile","Peru","Uruguay","Uruguay","Ecuador","Uruguay","Multiple","Argentina","Uruguay","Argentina"]}
]'),

-- ==================== OFC ====================

('nzl', '[]'),

-- ==================== UEFA ====================

('aut', '[]'),

('bel', '[]'),

('bih', '[]'),

('cro', '[]'),

('cze', '[]'),

('eng', '[
  {"org":"FIFA","tournament":"World Cup","count":1,"years":["1966"],"hosts":["England"]}
]'),

('fra', '[
  {"org":"FIFA","tournament":"World Cup","count":2,"years":["1998","2018"],"hosts":["France","Russia"]},
  {"org":"UEFA","tournament":"European Championship","count":2,"years":["1984","2000"],"hosts":["France","Belgium / Netherlands"]}
]'),

('ger', '[
  {"org":"FIFA","tournament":"World Cup","count":4,"years":["1954","1974","1990","2014"],"hosts":["Switzerland","West Germany","Italy","Brazil"]},
  {"org":"UEFA","tournament":"European Championship","count":3,"years":["1972","1980","1996"],"hosts":["Belgium","Italy","England"]}
]'),

('ned', '[
  {"org":"UEFA","tournament":"European Championship","count":1,"years":["1988"],"hosts":["West Germany"]}
]'),

('nor', '[]'),

('por', '[
  {"org":"UEFA","tournament":"European Championship","count":1,"years":["2016"],"hosts":["France"]}
]'),

('sco', '[]'),

('esp', '[
  {"org":"FIFA","tournament":"World Cup","count":1,"years":["2010"],"hosts":["South Africa"]},
  {"org":"UEFA","tournament":"European Championship","count":4,"years":["1964","2008","2012","2024"],"hosts":["Spain","Austria / Switzerland","Poland / Ukraine","Germany"]}
]'),

('swe', '[]'),

('sui', '[]'),

('tur', '[]')
)
SELECT teamId, titlesJson
FROM history;
