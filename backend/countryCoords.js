/**
 * Every country (ISO 3166-1 alpha-2) with capital/primary city coordinates.
 * Used for map annotations when QA model returns a country name.
 * Code -> { lat, lng }; name/capital -> code in COUNTRY_NAME_TO_CODE.
 */
const COUNTRY_COORDS = {
  ad: { lat: 42.5063, lng: 1.5218 },   // Andorra la Vella
  ae: { lat: 24.4539, lng: 54.3773 },   // Abu Dhabi
  af: { lat: 34.5553, lng: 69.2075 },  // Kabul
  ag: { lat: 17.1253, lng: -61.8450 }, // St. John's
  al: { lat: 41.3275, lng: 19.8187 },  // Tirana
  am: { lat: 40.1872, lng: 44.5152 },  // Yerevan
  ao: { lat: -8.8383, lng: 13.2344 },  // Luanda
  ar: { lat: -34.6037, lng: -58.3816 },// Buenos Aires
  at: { lat: 48.2082, lng: 16.3738 },  // Vienna
  au: { lat: -35.2809, lng: 149.13 },  // Canberra
  az: { lat: 40.4093, lng: 49.8671 },  // Baku
  ba: { lat: 43.8516, lng: 18.3867 },  // Sarajevo
  bb: { lat: 13.0975, lng: -59.6115 }, // Bridgetown
  bd: { lat: 23.8103, lng: 90.4125 },  // Dhaka
  be: { lat: 50.8503, lng: 4.3517 },   // Brussels
  bf: { lat: 12.3714, lng: -1.5197 },  // Ouagadougou
  bg: { lat: 42.6977, lng: 23.3219 },  // Sofia
  bh: { lat: 26.2285, lng: 50.5860 },  // Manama
  bi: { lat: -3.3822, lng: 29.3644 },  // Gitega
  bj: { lat: 6.4969, lng: 2.6289 },    // Porto-Novo
  bn: { lat: 4.9031, lng: 114.9398 },  // Bandar Seri Begawan
  bo: { lat: -16.5000, lng: -68.1500 },// La Paz
  br: { lat: -15.8267, lng: -47.9218 },// Brasília
  bs: { lat: 25.0479, lng: -77.3554 }, // Nassau
  bt: { lat: 27.4728, lng: 89.6390 },  // Thimphu
  bw: { lat: -24.6533, lng: 25.9087 }, // Gaborone
  by: { lat: 53.9045, lng: 27.5615 },  // Minsk
  bz: { lat: 17.2510, lng: -88.7590 }, // Belmopan
  ca: { lat: 45.4215, lng: -75.6972 }, // Ottawa
  cd: { lat: -4.3217, lng: 15.3125 },  // Kinshasa
  cf: { lat: 4.3947, lng: 18.5582 },   // Bangui
  cg: { lat: -4.2634, lng: 15.2429 },  // Brazzaville
  ch: { lat: 46.9480, lng: 7.4474 },   // Bern
  ci: { lat: 5.3600, lng: -4.0083 },   // Yamoussoukro
  cl: { lat: -33.4489, lng: -70.6693 },// Santiago
  cm: { lat: 3.8480, lng: 11.5021 },   // Yaoundé
  cn: { lat: 39.9042, lng: 116.4074 }, // Beijing
  co: { lat: 4.7110, lng: -74.0721 },  // Bogotá
  km: { lat: -11.6455, lng: 43.2533 }, // Moroni
  cr: { lat: 9.9281, lng: -84.0907 },  // San José
  cu: { lat: 23.1136, lng: -82.3666 }, // Havana
  cv: { lat: 14.9330, lng: -23.5133 }, // Praia
  cy: { lat: 35.1856, lng: 33.3823 },  // Nicosia
  cz: { lat: 50.0755, lng: 14.4378 },  // Prague
  de: { lat: 52.5200, lng: 13.4050 },  // Berlin
  dj: { lat: 11.5721, lng: 43.1456 },  // Djibouti
  dk: { lat: 55.6761, lng: 12.5683 },  // Copenhagen
  dm: { lat: 15.4150, lng: -61.3710 }, // Roseau
  do: { lat: 18.4861, lng: -69.9312 }, // Santo Domingo
  dz: { lat: 36.7538, lng: 3.0588 },   // Algiers
  ec: { lat: -0.1807, lng: -78.4678 }, // Quito
  eg: { lat: 30.0444, lng: 31.2357 },  // Cairo
  ee: { lat: 59.4370, lng: 24.7536 },  // Tallinn, Estonia
  er: { lat: 15.3229, lng: 38.9251 },  // Asmara
  es: { lat: 40.4168, lng: -3.7038 },  // Madrid
  et: { lat: 9.0320, lng: 38.7469 },   // Addis Ababa
  fi: { lat: 60.1699, lng: 24.9384 },  // Helsinki
  fj: { lat: -18.1248, lng: 178.4501 },// Suva
  fm: { lat: 6.9248, lng: 158.1620 },  // Palikir
  fr: { lat: 48.8566, lng: 2.3522 },   // Paris
  ga: { lat: 0.4162, lng: 9.4673 },    // Libreville
  gb: { lat: 51.5074, lng: -0.1278 },  // London
  gd: { lat: 12.1165, lng: -61.6790 }, // St. George's
  ge: { lat: 41.7151, lng: 44.8271 },  // Tbilisi
  gh: { lat: 5.6037, lng: -0.1870 },   // Accra
  gm: { lat: 13.4549, lng: -16.5790 }, // Banjul
  gn: { lat: 9.6412, lng: -13.5784 },  // Conakry
  gq: { lat: 3.7504, lng: 8.7371 },    // Malabo
  gr: { lat: 37.9838, lng: 23.7275 },  // Athens
  gt: { lat: 14.6349, lng: -90.5069 }, // Guatemala City
  gw: { lat: 11.8636, lng: -15.5977 }, // Bissau
  gy: { lat: 6.8013, lng: -58.1551 },  // Georgetown
  hk: { lat: 22.3193, lng: 114.1694 }, // Hong Kong
  hn: { lat: 14.0723, lng: -87.1921 }, // Tegucigalpa
  hr: { lat: 45.8150, lng: 15.9819 },  // Zagreb
  ht: { lat: 18.5944, lng: -72.3074 }, // Port-au-Prince
  hu: { lat: 47.4979, lng: 19.0402 },  // Budapest
  id: { lat: -6.2088, lng: 106.8456 }, // Jakarta
  ie: { lat: 53.3498, lng: -6.2603 },  // Dublin
  il: { lat: 31.7683, lng: 35.2137 },  // Jerusalem
  in: { lat: 28.6139, lng: 77.2090 },  // New Delhi
  iq: { lat: 33.3152, lng: 44.3661 },  // Baghdad
  ir: { lat: 35.6892, lng: 51.3890 },  // Tehran
  is: { lat: 64.1466, lng: -21.9426 }, // Reykjavik
  it: { lat: 41.9028, lng: 12.4964 },  // Rome
  jm: { lat: 18.0179, lng: -76.8099 }, // Kingston
  jo: { lat: 31.9454, lng: 35.9284 },  // Amman
  jp: { lat: 35.6762, lng: 139.6503 }, // Tokyo
  ke: { lat: -1.2921, lng: 36.8219 },  // Nairobi
  kg: { lat: 42.8746, lng: 74.5698 },  // Bishkek
  kh: { lat: 11.5564, lng: 104.9282 }, // Phnom Penh
  ki: { lat: -1.4512, lng: 173.0698 }, // Tarawa
  kn: { lat: 17.3578, lng: -62.7829 }, // Basseterre, Saint Kitts and Nevis
  kp: { lat: 39.0392, lng: 125.7625 }, // Pyongyang
  kr: { lat: 37.5665, lng: 126.9780 }, // Seoul
  kw: { lat: 29.3759, lng: 47.9774 },  // Kuwait City
  kz: { lat: 51.1694, lng: 71.4491 },  // Nur-Sultan (Astana)
  la: { lat: 17.9757, lng: 102.6331 }, // Vientiane
  lb: { lat: 33.8938, lng: 35.5018 },  // Beirut
  lc: { lat: 13.9094, lng: -60.9789 }, // Castries
  li: { lat: 47.1410, lng: 9.5209 },   // Vaduz
  lk: { lat: 6.9271, lng: 79.8612 },   // Colombo
  lr: { lat: 6.3156, lng: -10.8074 },  // Monrovia
  ls: { lat: -29.3100, lng: 27.4786 }, // Maseru
  lt: { lat: 54.6872, lng: 25.2797 },  // Vilnius
  lu: { lat: 49.6116, lng: 6.1319 },   // Luxembourg
  lv: { lat: 56.9496, lng: 24.1052 },  // Riga
  ly: { lat: 32.8872, lng: 13.1913 },  // Tripoli
  ma: { lat: 34.0209, lng: -6.8416 },  // Rabat
  mc: { lat: 43.7384, lng: 7.4246 },   // Monaco
  md: { lat: 47.0105, lng: 28.8638 },  // Chișinău
  me: { lat: 42.4304, lng: 19.2594 },  // Podgorica
  mg: { lat: -18.8792, lng: 47.5079 }, // Antananarivo
  mh: { lat: 7.0897, lng: 171.3803 },  // Majuro
  mk: { lat: 41.9973, lng: 21.4280 },  // Skopje
  ml: { lat: 12.6392, lng: -8.0029 },  // Bamako
  mm: { lat: 19.7633, lng: 96.0785 },  // Naypyidaw
  mn: { lat: 47.8864, lng: 106.9057 }, // Ulaanbaatar
  mr: { lat: 18.0735, lng: -15.9582 }, // Nouakchott
  mt: { lat: 35.8997, lng: 14.5147 },  // Valletta
  mu: { lat: -20.1609, lng: 57.5012 }, // Port Louis
  mv: { lat: 4.1755, lng: 73.5093 },  // Malé
  mw: { lat: -13.9626, lng: 33.7741 }, // Lilongwe
  mx: { lat: 19.4326, lng: -99.1332 }, // Mexico City
  my: { lat: 3.1390, lng: 101.6869 },  // Kuala Lumpur
  mz: { lat: -25.9692, lng: 32.5732 }, // Maputo
  na: { lat: -22.5609, lng: 17.0658 }, // Windhoek
  ne: { lat: 13.5137, lng: 2.1098 },   // Niamey
  ng: { lat: 9.0765, lng: 7.3986 },    // Abuja
  ni: { lat: 12.1364, lng: -86.2514 }, // Managua
  nl: { lat: 52.3676, lng: 4.9041 },   // Amsterdam
  no: { lat: 59.9139, lng: 10.7522 },  // Oslo
  np: { lat: 27.7172, lng: 85.3240 },  // Kathmandu
  nr: { lat: -0.5228, lng: 166.9315 }, // Yaren
  nz: { lat: -41.2866, lng: 174.7762 },// Wellington
  om: { lat: 23.5880, lng: 58.3829 },  // Muscat
  pa: { lat: 8.9824, lng: -79.5199 },  // Panama City
  pe: { lat: -12.0464, lng: -77.0428 },// Lima
  pg: { lat: -9.4780, lng: 147.1500 }, // Port Moresby
  ph: { lat: 14.5995, lng: 120.9842 }, // Manila
  pk: { lat: 33.6844, lng: 73.0479 },  // Islamabad
  pl: { lat: 52.2297, lng: 21.0122 },  // Warsaw
  pt: { lat: 38.7223, lng: -9.1393 },  // Lisbon
  pw: { lat: 7.5149, lng: 134.5825 },  // Ngerulmud
  py: { lat: -25.2637, lng: -57.5759 },// Asunción
  qa: { lat: 25.2854, lng: 51.5310 },  // Doha
  ro: { lat: 44.4268, lng: 26.1025 },  // Bucharest
  rs: { lat: 44.7866, lng: 20.4489 },  // Belgrade
  ru: { lat: 55.7558, lng: 37.6173 },  // Moscow
  rw: { lat: -1.9536, lng: 30.0606 },  // Kigali
  sa: { lat: 24.7136, lng: 46.6753 },  // Riyadh
  sb: { lat: -9.4333, lng: 159.9500 }, // Honiara
  sc: { lat: -4.6191, lng: 55.4513 },  // Victoria
  sd: { lat: 15.5007, lng: 32.5599 },  // Khartoum
  se: { lat: 59.3293, lng: 18.0686 },  // Stockholm
  sg: { lat: 1.3521, lng: 103.8198 },   // Singapore
  si: { lat: 46.0569, lng: 14.5058 },  // Ljubljana
  sk: { lat: 48.1486, lng: 17.1077 },  // Bratislava
  sl: { lat: 8.4657, lng: -13.2317 },  // Freetown
  sm: { lat: 43.9424, lng: 12.4578 },  // San Marino
  sn: { lat: 14.7167, lng: -17.4677 }, // Dakar
  so: { lat: 2.0469, lng: 45.3182 },   // Mogadishu
  sr: { lat: 5.8520, lng: -55.2038 },  // Paramaribo
  ss: { lat: 4.8594, lng: 31.5713 },   // Juba
  st: { lat: 0.3365, lng: 6.7273 },    // São Tomé
  sv: { lat: 13.6929, lng: -89.2182 }, // San Salvador
  sy: { lat: 33.5138, lng: 36.2765 },  // Damascus
  sz: { lat: -26.3054, lng: 31.1367 }, // Mbabane
  td: { lat: 12.1348, lng: 15.0557 },  // N'Djamena
  tg: { lat: 6.1375, lng: 1.2123 },    // Lomé
  th: { lat: 13.7563, lng: 100.5018 }, // Bangkok
  tj: { lat: 38.5598, lng: 68.7738 },  // Dushanbe
  tl: { lat: -8.5569, lng: 125.5603 }, // Dili
  tm: { lat: 37.9601, lng: 58.3261 },  // Ashgabat
  tn: { lat: 36.8065, lng: 10.1815 },  // Tunis
  to: { lat: -21.1393, lng: -175.2049 },// Nukuʻalofa
  tr: { lat: 39.9334, lng: 32.8597 },  // Ankara
  tt: { lat: 10.6549, lng: -61.5089 }, // Port of Spain
  tv: { lat: -8.5172, lng: 179.1962 }, // Funafuti
  tw: { lat: 25.0330, lng: 121.5654 }, // Taipei
  tz: { lat: -6.1630, lng: 35.7516 },  // Dodoma
  ua: { lat: 50.4501, lng: 30.5234 },  // Kyiv
  ug: { lat: 0.3476, lng: 32.5825 },   // Kampala
  us: { lat: 38.9072, lng: -77.0369 }, // Washington DC
  uy: { lat: -34.9011, lng: -56.1645 },// Montevideo
  uz: { lat: 41.2995, lng: 69.2401 },  // Tashkent
  va: { lat: 41.9029, lng: 12.4534 },  // Vatican City
  vc: { lat: 13.2528, lng: -61.1971 }, // Kingstown
  ve: { lat: 10.4806, lng: -66.9036 }, // Caracas
  vn: { lat: 21.0285, lng: 105.8542 }, // Hanoi
  vu: { lat: -17.7333, lng: 168.3273 },// Port Vila
  ws: { lat: -13.8507, lng: -171.7514 },// Apia
  ye: { lat: 15.3694, lng: 44.1910 },  // Sana'a
  za: { lat: -25.7479, lng: 28.2293 }, // Pretoria
  zm: { lat: -15.3875, lng: 28.3228 }, // Lusaka
  zw: { lat: -17.8292, lng: 31.0522 }, // Harare
  // Common territories / alternate codes
  ps: { lat: 31.9474, lng: 35.2272 },  // Ramallah (Palestine)
  xk: { lat: 42.6629, lng: 21.1655 },  // Pristina (Kosovo)
};

/** Country/city name (normalized) -> ISO 2-letter code. Longest keys first for substring match. */
function buildCountryNameToCode() {
  const map = Object.create(null);
  const entries = [
    ["united states of america", "us"], ["united states", "us"], ["united kingdom", "gb"], ["united arab emirates", "ae"],
    ["united states", "us"], ["usa", "us"], ["u.s.a.", "us"], ["u.s.", "us"], ["america", "us"],
    ["washington", "us"], ["new york", "us"], ["california", "us"], ["britain", "gb"], ["great britain", "gb"],
    ["england", "gb"], ["london", "gb"], ["uk", "gb"], ["germany", "de"], ["berlin", "de"], ["france", "fr"],
    ["paris", "fr"], ["japan", "jp"], ["japanese", "jp"], ["tokyo", "jp"], ["china", "cn"], ["chinese", "cn"],
    ["beijing", "cn"], ["india", "in"], ["indian", "in"], ["new delhi", "in"], ["mumbai", "in"],
    ["australia", "au"], ["australian", "au"], ["sydney", "au"], ["canberra", "au"], ["melbourne", "au"],
    ["canada", "ca"], ["canadian", "ca"], ["ottawa", "ca"], ["toronto", "ca"], ["brazil", "br"],
    ["brazilian", "br"], ["brasilia", "br"], ["russia", "ru"], ["russian", "ru"], ["moscow", "ru"],
    ["south korea", "kr"], ["north korea", "kp"], ["korea", "kr"], ["korean", "kr"], ["seoul", "kr"],
    ["pyongyang", "kp"], ["italy", "it"], ["italian", "it"], ["rome", "it"], ["milan", "it"],
    ["spain", "es"], ["madrid", "es"], ["barcelona", "es"], ["ukraine", "ua"], ["kyiv", "ua"], ["kiev", "ua"],
    ["iran", "ir"], ["tehran", "ir"], ["israel", "il"], ["jerusalem", "il"], ["gaza", "il"], ["tel aviv", "il"],
    ["palestine", "ps"], ["west bank", "ps"], ["saudi arabia", "sa"], ["riyadh", "sa"], ["uae", "ae"],
    ["abu dhabi", "ae"], ["dubai", "ae"], ["singapore", "sg"], ["hong kong", "hk"], ["taiwan", "tw"],
    ["taipei", "tw"], ["thailand", "th"], ["bangkok", "th"], ["indonesia", "id"], ["jakarta", "id"],
    ["malaysia", "my"], ["kuala lumpur", "my"], ["philippines", "ph"], ["manila", "ph"],
    ["vietnam", "vn"], ["hanoi", "vn"], ["ho chi minh", "vn"], ["egypt", "eg"], ["cairo", "eg"],
    ["south africa", "za"], ["pretoria", "za"], ["johannesburg", "za"], ["cape town", "za"],
    ["nigeria", "ng"], ["lagos", "ng"], ["abuja", "ng"], ["turkey", "tr"], ["turkish", "tr"], ["ankara", "tr"],
    ["istanbul", "tr"], ["poland", "pl"], ["polish", "pl"], ["warsaw", "pl"], ["greece", "gr"], ["greek", "gr"],
    ["athens", "gr"], ["romania", "ro"], ["bucharest", "ro"], ["netherlands", "nl"], ["dutch", "nl"],
    ["amsterdam", "nl"], ["belgium", "be"], ["brussels", "be"], ["switzerland", "ch"], ["swiss", "ch"],
    ["bern", "ch"], ["geneva", "ch"], ["austria", "at"], ["vienna", "at"], ["sweden", "se"], ["stockholm", "se"],
    ["norway", "no"], ["oslo", "no"], ["ireland", "ie"], ["dublin", "ie"], ["portugal", "pt"], ["lisbon", "pt"],
    ["czech republic", "cz"], ["czechia", "cz"], ["prague", "cz"], ["argentina", "ar"], ["buenos aires", "ar"],
    ["mexico", "mx"], ["mexico city", "mx"], ["colombia", "co"], ["bogota", "co"], ["chile", "cl"],
    ["santiago", "cl"], ["peru", "pe"], ["lima", "pe"], ["venezuela", "ve"], ["caracas", "ve"],
    ["pakistan", "pk"], ["islamabad", "pk"], ["bangladesh", "bd"], ["dhaka", "bd"], ["iraq", "iq"],
    ["baghdad", "iq"], ["syria", "sy"], ["damascus", "sy"], ["lebanon", "lb"], ["beirut", "lb"],
    ["qatar", "qa"], ["doha", "qa"], ["kuwait", "kw"], ["morocco", "ma"], ["rabat", "ma"],
    ["algeria", "dz"], ["algiers", "dz"], ["kenya", "ke"], ["nairobi", "ke"], ["new zealand", "nz"],
    ["wellington", "nz"], ["auckland", "nz"], ["serbia", "rs"], ["belgrade", "rs"], ["hungary", "hu"],
    ["budapest", "hu"], ["lithuania", "lt"], ["vilnius", "lt"], ["latvia", "lv"], ["riga", "lv"],
    ["slovakia", "sk"], ["bratislava", "sk"], ["slovenia", "si"], ["ljubljana", "si"], ["bulgaria", "bg"],
    ["sofia", "bg"], ["afghanistan", "af"], ["kabul", "af"], ["albania", "al"], ["tirana", "al"],
    ["andorra", "ad"], ["angola", "ao"], ["luanda", "ao"], ["antigua and barbuda", "ag"], ["armenia", "am"],
    ["yerevan", "am"], ["azerbaijan", "az"], ["baku", "az"], ["bahamas", "bs"], ["nassau", "bs"],
    ["bahrain", "bh"], ["manama", "bh"], ["barbados", "bb"], ["belarus", "by"], ["minsk", "by"],
    ["belize", "bz"], ["benin", "bj"], ["bhutan", "bt"], ["bolivia", "bo"], ["bosnia and herzegovina", "ba"],
    ["sarajevo", "ba"], ["botswana", "bw"], ["gaborone", "bw"], ["burkina faso", "bf"], ["burundi", "bi"],
    ["cambodia", "kh"], ["phnom penh", "kh"], ["cameroon", "cm"], ["yaounde", "cm"], ["cape verde", "cv"],
    ["central african republic", "cf"], ["chad", "td"], ["comoros", "km"], ["congo", "cg"], ["democratic republic of the congo", "cd"],
    ["costa rica", "cr"], ["cote d'ivoire", "ci"], ["ivory coast", "ci"], ["croatia", "hr"], ["cuba", "cu"],
    ["cyprus", "cy"], ["denmark", "dk"], ["copenhagen", "dk"], ["djibouti", "dj"], ["dominica", "dm"],
    ["dominican republic", "do"], ["ecuador", "ec"], ["quito", "ec"], ["el salvador", "sv"], ["equatorial guinea", "gq"],
    ["eritrea", "er"], ["asmara", "er"], ["estonia", "ee"], ["tallinn", "ee"], ["ethiopia", "et"],
    ["addis ababa", "et"], ["fiji", "fj"], ["finland", "fi"], ["helsinki", "fi"], ["gabon", "ga"], ["libreville", "ga"],
    ["gambia", "gm"], ["banjul", "gm"], ["georgia", "ge"], ["tbilisi", "ge"], ["ghana", "gh"], ["accra", "gh"],
    ["grenada", "gd"], ["guatemala", "gt"], ["guinea", "gn"], ["conakry", "gn"], ["guinea-bissau", "gw"],
    ["guyana", "gy"], ["haiti", "ht"], ["honduras", "hn"], ["iceland", "is"], ["reykjavik", "is"],
    ["jamaica", "jm"], ["jordan", "jo"], ["amman", "jo"], ["kazakhstan", "kz"], ["astana", "kz"], ["nur-sultan", "kz"],
    ["kiribati", "ki"], ["kyrgyzstan", "kg"], ["bishkek", "kg"], ["laos", "la"], ["vientiane", "la"],
    ["lesotho", "ls"], ["liberia", "lr"], ["libya", "ly"], ["liechtenstein", "li"], ["luxembourg", "lu"],
    ["madagascar", "mg"], ["malawi", "mw"], ["maldives", "mv"], ["mali", "ml"], ["bamako", "ml"],
    ["malta", "mt"], ["marshall islands", "mh"], ["mauritania", "mr"], ["mauritius", "mu"], ["micronesia", "fm"],
    ["moldova", "md"], ["monaco", "mc"], ["mongolia", "mn"], ["ulaanbaatar", "mn"], ["montenegro", "me"],
    ["mozambique", "mz"], ["maputo", "mz"], ["myanmar", "mm"], ["burma", "mm"], ["namibia", "na"], ["nauru", "nr"],
    ["nepal", "np"], ["kathmandu", "np"], ["nicaragua", "ni"], ["niger", "ne"], ["niamey", "ne"],
    ["oman", "om"], ["muscat", "om"], ["palau", "pw"], ["panama", "pa"], ["papua new guinea", "pg"],
    ["paraguay", "py"], ["asuncion", "py"], ["puerto rico", "pr"], ["reunion", "re"], ["rwanda", "rw"], ["kigali", "rw"],
    ["saint kitts and nevis", "kn"], ["saint lucia", "lc"], ["saint vincent and the grenadines", "vc"],
    ["samoa", "ws"], ["san marino", "sm"], ["sao tome and principe", "st"], ["senegal", "sn"], ["dakar", "sn"],
    ["seychelles", "sc"], ["sierra leone", "sl"], ["freetown", "sl"], ["solomon islands", "sb"],
    ["somalia", "so"], ["mogadishu", "so"], ["south sudan", "ss"], ["juba", "ss"], ["sri lanka", "lk"],
    ["colombo", "lk"], ["sudan", "sd"], ["khartoum", "sd"], ["suriname", "sr"], ["paramaribo", "sr"],
    ["swaziland", "sz"], ["eswatini", "sz"], ["tajikistan", "tj"], ["dushanbe", "tj"], ["tanzania", "tz"],
    ["dar es salaam", "tz"], ["togo", "tg"], ["lome", "tg"], ["tonga", "to"], ["trinidad and tobago", "tt"],
    ["tunisia", "tn"], ["tunis", "tn"], ["turkmenistan", "tm"], ["ashgabat", "tm"], ["tuvalu", "tv"],
    ["uganda", "ug"], ["kampala", "ug"], ["uruguay", "uy"], ["montevideo", "uy"], ["uzbekistan", "uz"],
    ["tashkent", "uz"], ["vanuatu", "vu"], ["vatican", "va"], ["vatican city", "va"], ["yemen", "ye"], ["sanaa", "ye"],
    ["zambia", "zm"], ["lusaka", "zm"], ["zimbabwe", "zw"], ["harare", "zw"], ["kosovo", "xk"], ["pristina", "xk"],
  ];
  for (const [name, code] of entries) {
    if (!map[name]) map[name] = code;
  }
  return map;
}

const COUNTRY_NAME_TO_CODE = buildCountryNameToCode();

module.exports = { COUNTRY_COORDS, COUNTRY_NAME_TO_CODE };
