const fs = require('fs');
const path = require('path');

const FRANCE_FILE = path.join(__dirname, '../src/lib/games/blindpoint/data/lieux_france.json');
const MONDE_FILE = path.join(__dirname, '../src/lib/games/blindpoint/data/lieux_monde.json');
const CASTLES_FILE = path.join(__dirname, '../src/lib/games/blindpoint/data/castles.json');
const MONUMENTS_FILE = path.join(__dirname, '../src/lib/games/blindpoint/data/monuments.json');

const FRANCE_META = {
  castle_chambord: {
    category: 'chateau',
    yearBuilt: 1519,
    funFact: "Chef-d'œuvre de la Renaissance voulu par François Ier, célèbre pour son escalier monumental à double hélice pensé par Léonard de Vinci où deux personnes montent sans jamais se croiser."
  },
  castle_chenonceau: {
    category: 'chateau',
    yearBuilt: 1513,
    funFact: "Surnommé le 'Château des Dames' (Katherine Briçonnet, Diane de Poitiers, Catherine de Médicis), sa célèbre galerie à arcades enjambe gracieusement les eaux du Cher."
  },
  castle_carcassonne: {
    category: 'forteresse',
    yearBuilt: 1260,
    funFact: "La plus vaste cité médiévale fortifiée d'Europe encore habitée, protégée par une double enceinte de 3 kilomètres et 52 tours sauvées de la démolition par Viollet-le-Duc."
  },
  castle_mont_saint_michel: {
    category: 'abbaye',
    yearBuilt: 708,
    funFact: "Merveille de l'Occident érigée sur un îlot rocheux ceinturé par les plus fortes marées d'Europe continentale, pèlerinage millénaire dédié à l'archange saint Michel."
  },
  castle_versailles: {
    category: 'chateau',
    yearBuilt: 1661,
    funFact: "Symbole absolu du rayonnement du Roi-Soleil, sa légendaire Galerie des Glaces compte 357 miroirs et fut le théâtre de la proclamation de l'Empire allemand en 1871 et du traité de paix en 1919."
  },
  castle_haut_koenigsbourg: {
    category: 'forteresse',
    yearBuilt: 1147,
    funFact: "Perché sur un éperon rocheux à 757 m d'altitude dominant la plaine d'Alsace, ce nid d'aigle médiéval fut restauré au début du XXe siècle par l'empereur Guillaume II."
  },
  castle_fontainebleau: {
    category: 'chateau',
    yearBuilt: 1137,
    funFact: "Demeure des souverains français pendant plus de huit siècles, c'est dans la cour du Cheval Blanc que Napoléon Ier fit ses poignants adieux à sa garde impériale en 1814."
  },
  castle_chantilly: {
    category: 'chateau',
    yearBuilt: 1560,
    funFact: "Écrin des ducs d'Aumale abritant la deuxième collection de peintures anciennes de France après le Louvre, ainsi que de monumentales Grandes Écuries princières."
  },
  castle_vaux_le_vicomte: {
    category: 'chateau',
    yearBuilt: 1658,
    funFact: "Chef-d'œuvre classique né de l'alliance de Le Vau, Le Brun et Le Nôtre pour Nicolas Fouquet, dont la fête d'inauguration trop somptueuse précipita l'arrestation par Louis XIV."
  },
  castle_pierrefonds: {
    category: 'forteresse',
    yearBuilt: 1396,
    funFact: "Château fort médiéval démantelé au XVIIe siècle, entièrement réinventé sous Napoléon III par Viollet-le-Duc en une forteresse idéale et décor de cinéma féerique."
  },
  castle_amboise: {
    category: 'chateau',
    yearBuilt: 1492,
    funFact: "Résidence des rois Charles VIII et François Ier dominant la Loire ; sa chapelle Saint-Hubert abrite la sépulture présumée de Léonard de Vinci, décédé au Clos Lucé voisin."
  },
  castle_blois: {
    category: 'chateau',
    yearBuilt: 1230,
    funFact: "Résidence favorite de 7 rois et 10 reines de France, réunissant quatre façades aux styles architecturaux distincts (Gothique, Renaissance italienne, Classique) autour d'une même cour."
  },
  castle_cheverny: {
    category: 'chateau',
    yearBuilt: 1624,
    funFact: "Célèbre pour avoir inspiré à Hergé le château de Moulinsart du capitaine Haddock (en lui retirant ses deux ailes latérales), il est resté dans la même famille depuis plus de six siècles."
  },
  castle_villandry: {
    category: 'chateau',
    yearBuilt: 1536,
    funFact: "Dernier des grands châteaux de la Renaissance bâtis sur la Loire, mondialement réputé pour ses 6 hectares de jardins géométriques étagés et son potager décoratif Renaissance."
  },
  castle_azay_le_rideau: {
    category: 'chateau',
    yearBuilt: 1518,
    funFact: "Décrit par Honoré de Balzac comme 'un diamant taillé à facettes serti par l'Indre', ce joyau de la Renaissance semble flotter directement sur les eaux calmes de la rivière."
  },
  castle_chateau_gaillard: {
    category: 'forteresse',
    yearBuilt: 1196,
    funFact: "Forteresse imprenable édifiée en seulement deux ans par Richard Cœur de Lion au-dessus des falaises de la Seine pour barrer la route de Rouen au roi Philippe Auguste."
  },
  castle_angers: {
    category: 'forteresse',
    yearBuilt: 1230,
    funFact: "Impressionnante forteresse de schiste et calcaire aux 17 tours bicolores, gardienne de la monumentale Tenture de l'Apocalypse, la plus grande tapisserie médiévale au monde (104 mètres)."
  },
  castle_saumur: {
    category: 'chateau',
    yearBuilt: 1200,
    funFact: "Surnommé le 'Château d'Amour' par le roi René et immortalisé dans les Très Riches Heures du duc de Berry, il domine majestueusement le confluent de la Loire et du Thouet."
  },
  castle_peyrepertuse: {
    category: 'forteresse',
    yearBuilt: 1020,
    funFact: "L'un des plus spectaculaires 'châteaux cathares', gigantesque vaisseau de pierre perché sur une crête calcaire à 800 m d'altitude surnommé la 'Carcassonne céleste'."
  },
  castle_queribus: {
    category: 'forteresse',
    yearBuilt: 1000,
    funFact: "Dernier bastion de la résistance cathare à capituler face aux armées royales en 1255, juché sur un piton rocheux vertigineux dominant la plaine du Roussillon."
  },
  castle_montsegur: {
    category: 'forteresse',
    yearBuilt: 1204,
    funFact: "Bâti au sommet d'un pog vertigineux à 1 207 m d'altitude, ce haut lieu du catharisme fut le théâtre d'un siège héroïque achevé en 1244 par le bûcher de plus de 200 croyants."
  },
  castle_foix: {
    category: 'forteresse',
    yearBuilt: 987,
    funFact: "Fier château comtal coiffé de trois hautes tours dominant la vallée de l'Ariège, berceau de Gaston Fébus et demeure historique des comtes de Foix-Béarn."
  },
  castle_castelnaud: {
    category: 'forteresse',
    yearBuilt: 1100,
    funFact: "Forteresse médiévale suspendue au-dessus de la Dordogne, fief anglais durant la guerre de Cent Ans faisant face à son rival français Beynac, aujourd'hui musée de la guerre au Moyen Âge."
  },
  castle_beynac: {
    category: 'forteresse',
    yearBuilt: 1115,
    funFact: "Campé au sommet d'une falaise vertigineuse de 150 mètres surplombant la Dordogne, ce donjon austère fut l'une des quatre baronnies historiques du Périgord."
  },
  castle_bonaguil: {
    category: 'forteresse',
    yearBuilt: 1271,
    funFact: "Véritable traité d'architecture militaire médiévale avec ses 13 tours, pont-levis et barbacane, achevé au début du XVIe siècle à l'époque où l'artillerie à poudre rendait ces châteaux obsolètes."
  },
  castle_murol: {
    category: 'forteresse',
    yearBuilt: 1150,
    funFact: "Forteresse auvergnate dressée sur un cône de basalte volcanique face au massif du Sancy, réputée pour ses reconstitutions immersives de la vie chevaleresque."
  },
  castle_baux_de_provence: {
    category: 'forteresse',
    yearBuilt: 950,
    funFact: "Nid d'aigle taillé dans la roche calcaire des Alpilles, fief des fiers seigneurs des Baux qui prétendaient descendre du roi mage Balthazar et en portaient l'étoile à 16 branches."
  },
  castle_tarascon: {
    category: 'chateau',
    yearBuilt: 1400,
    funFact: "Élégante résidence princière du roi René d'Anjou dressée au bord du Rhône, mêlant un aspect militaire défensif austère à un intérieur gothique raffiné orné de graffitis de prisonniers."
  },
  castle_chateau_d_if: {
    category: 'forteresse',
    yearBuilt: 1524,
    funFact: "Forteresse insulaire bâtie par François Ier sur un îlot de l'archipel du Frioul à Marseille, immortalisée par Alexandre Dumas comme la redoutable prison d'Edmond Dantès (Le Comte de Monte-Cristo)."
  },
  castle_palais_des_papes: {
    category: 'religieux',
    yearBuilt: 1335,
    funFact: "Plus grand palais gothique d'Occident (15 000 m²), siège de la papauté au XIVe siècle où résidèrent neuf souverains pontifes avant le retour à Rome."
  },
  castle_citadelle_besancon: {
    category: 'forteresse',
    yearBuilt: 1668,
    funFact: "Chef-d'œuvre d'ingénierie militaire de Sébastien Le Prestre de Vauban classé à l'UNESCO, ceinturant un méandre parfait du Doubs sur plus de 11 hectares."
  },
  castle_citadelle_belfort: {
    category: 'forteresse',
    yearBuilt: 1687,
    funFact: "Place forte imprenable fortifiée par Vauban, au pied de laquelle trône le colossal Lion de grès rose sculpté par Auguste Bartholdi célébrant la résistance héroïque face aux Prussiens en 1870."
  },
  castle_citadelle_blaye: {
    category: 'forteresse',
    yearBuilt: 1685,
    funFact: "Véritable ville fortifiée fermant l'estuaire de la Gironde, élément clé du 'Verrou Vauban' conçu pour protéger Bordeaux des incursions des flottes ennemies."
  },
  castle_fort_boyard: {
    category: 'forteresse',
    yearBuilt: 1801,
    funFact: "Vaisseau de pierre posé en pleine mer entre l'île d'Aix et l'île d'Oléron, ordonné par Napoléon pour verrouiller la rade de Rochefort, devenu arène de jeu télévisée mondialement connue."
  },
  castle_chateau_vincennes: {
    category: 'forteresse',
    yearBuilt: 1361,
    funFact: "Plus haut donjon de plaine médiéval d'Europe (52 mètres), résidence royale fortifiée où naquirent ou moururent plusieurs rois de France, et prison d'État illustre (Diderot, Mirabeau)."
  },
  castle_compiegne: {
    category: 'chateau',
    yearBuilt: 1751,
    funFact: "Avec Versailles et Fontainebleau, l'une des trois plus grandes résidences royales françaises, lieu de villégiature et des 'Séries de Compiègne' sous Napoléon III et l'impératrice Eugénie."
  },
  castle_rambouillet: {
    category: 'chateau',
    yearBuilt: 1368,
    funFact: "Résidence royale puis présidentielle au cœur d'une forêt de 20 000 hectares, où François Ier rendit son dernier souffle en 1547 et où Marie-Antoinette possédait une Laiterie d'apparat."
  },
  castle_chateaubriant: {
    category: 'chateau',
    yearBuilt: 1050,
    funFact: "Forteresse stratégique des Marches de Bretagne réunissant un château fort médiéval austère et un élégant logis Renaissance bâti pour Jean de Laval et Françoise de Foix."
  },
  castle_fougeres: {
    category: 'forteresse',
    yearBuilt: 1020,
    funFact: "Plus grande forteresse médiévale d'Europe dans son état de conservation, gardienne des Marches de Bretagne entourée par les eaux du Nançon et flanquée de 13 tours défensives."
  },
  castle_josselin: {
    category: 'chateau',
    yearBuilt: 1008,
    funFact: "Résidence des ducs de Rohan depuis plus de neuf siècles, présentant côté rivière un rempart féodal imprenable à tours rondes et côté cour une somptueuse façade Renaissance en granit sculpté."
  },
  castle_suscinio: {
    category: 'chateau',
    yearBuilt: 1218,
    funFact: "Résidence de chasse et d'été des ducs de Bretagne ceinturée de douves au bord de l'océan Atlantique, célèbre pour son extraordinaire pavement médiéval de plus de 30 000 carreaux vernissés."
  },
  castle_chinon: {
    category: 'forteresse',
    yearBuilt: 954,
    funFact: "Forteresse médiévale longue de 500 mètres dominant la Vienne où mourut le roi d'Angleterre Henri II Plantagenêt et où Jeanne d'Arc rencontra pour la première fois le futur Charles VII en 1429."
  },
  castle_valencay: {
    category: 'chateau',
    yearBuilt: 1540,
    funFact: "Propriété de Charles-Maurice de Talleyrand, le 'diable boiteux' de la diplomatie européenne, qui y reçut les princes du monde entier avec les festins raffinés du chef Antonin Carême."
  },
  castle_usse: {
    category: 'chateau',
    yearBuilt: 1462,
    funFact: "Avec ses multiples tourelles blanches, toits d'ardoise et lucarnes sculptées bordant la forêt de Chinon, il inspira directement à Charles Perrault le conte de 'La Belle au bois dormant'."
  },
  castle_langeais: {
    category: 'chateau',
    yearBuilt: 1465,
    funFact: "Théâtre en 1491 du mariage secret entre Charles VIII et Anne de Bretagne qui scella le rattachement définitif du duché de Bretagne au royaume de France."
  },
  castle_fort_la_latte: {
    category: 'forteresse',
    yearBuilt: 1340,
    funFact: "Forteresse maritime bretonne posée sur un cap rocheux battu par les vents de la Manche face au cap Fréhel, accessible uniquement par deux ponts-levis consécutifs."
  },
  castle_vitre: {
    category: 'forteresse',
    yearBuilt: 1060,
    funFact: "Verrou défensif des Marches de Bretagne dressé sur un éperon de schiste, remarquable par son plan triangulaire et ses imposantes toitures coniques en poivrière."
  },
  castle_sedan: {
    category: 'forteresse',
    yearBuilt: 1424,
    funFact: "Plus vaste château fort d'Europe avec ses 35 000 m² répartis sur 7 niveaux et ses murailles atteignant jusqu'à 27 mètres d'épaisseur, berceau du maréchal de Turenne."
  },
  castle_chateaudun: {
    category: 'chateau',
    yearBuilt: 1170,
    funFact: "Propriété de Jean de Dunois, fidèle compagnon d'armes de Jeanne d'Arc, il possède un donjon circulaire du XIIe siècle de 31 mètres et une splendide Sainte-Chapelle gothique."
  },
  castle_sullysurlatour: {
    category: 'chateau',
    yearBuilt: 1395,
    funFact: "Porte d'entrée orientale des châteaux de la Loire, demeure historique du grand ministre de Henri IV, Maximilien de Béthune duc de Sully, entourée de douves profondes alimentées par la Loire."
  },
  landmark_tour_eiffel: {
    category: 'monument',
    yearBuilt: 1889,
    funFact: "Prouesse d'ingénierie de fer puddlé de 330 mètres érigée pour l'Exposition universelle de 1889, qui resta la plus haute structure artificielle du monde pendant quatre décennies."
  },
  landmark_pont_du_gard: {
    category: 'antiquite',
    yearBuilt: 50,
    funFact: "Chef-d'œuvre de l'architecture romaine antique à trois niveaux d'arches enjambant le Gardon, partie centrale d'un aqueduc de 50 km qui alimentait Nîmes en eau courante."
  },
  landmark_arenes_nimes: {
    category: 'antiquite',
    yearBuilt: 90,
    funFact: "Amphithéâtre romain le mieux conservé au monde, capable d'accueillir 24 000 spectateurs dans l'Antiquité pour des combats de gladiateurs et de fauves."
  },
  landmark_cathedrale_strasbourg: {
    category: 'religieux',
    yearBuilt: 1176,
    funFact: "Chef-d'œuvre du gothique en grès rose des Vosges dont la flèche unique de 142 mètres en fit le plus haut édifice du monde chrétien de 1647 à 1874, abritant une horloge astronomique légendaire."
  },
  landmark_viaduc_millau: {
    category: 'civil',
    yearBuilt: 2004,
    funFact: "Ouvrage d'art record conçu par Michel Virlogeux et Norman Foster, viaduc à haubans le plus haut du monde culminant à 343 mètres au-dessus des gorges du Tarn."
  },
  landmark_carnac_alignements: {
    category: 'antiquite',
    yearBuilt: -4500,
    funFact: "Plus grande concentration mégalithique au monde avec près de 3 000 menhirs dressés en lignes parallèles sur plus de 4 kilomètres à travers les landes morbihannaises."
  },
  landmark_phare_cordouan: {
    category: 'civil',
    yearBuilt: 1611,
    funFact: "Surnommé le 'Versailles des mers', plus ancien phare de France encore en activité en pleine mer à l'embouchure de la Gironde, abritant un appartement royal et une chapelle ornée de vitraux."
  },
  landmark_grotte_lascaux: {
    category: 'antiquite',
    yearBuilt: -18000,
    funFact: "Surnommée la 'Chapelle Sixtine de l'art pariétal', découverte par hasard par quatre adolescents en 1940, elle abrite près de 2 000 représentations d'animaux peintes au Paléolithique supérieur."
  }
};

const MONDE_META = {
  monument_taj_mahal: {
    category: 'monument',
    yearBuilt: 1648,
    funFact: "Mausolée de marbre blanc immaculé bâti par l'empereur moghol Shah Jahan pour immortaliser son épouse bien-aimée Mumtaz Mahal ; sa teinte change selon la lumière du jour."
  },
  monument_machu_picchu: {
    category: 'antiquite',
    yearBuilt: 1450,
    funFact: "Cité sacrée inca perchée à 2 430 m d'altitude sur une crête andine enveloppée de brume, jamais découverte par les conquistadors espagnols et révélée au monde en 1911."
  },
  monument_colisee: {
    category: 'antiquite',
    yearBuilt: 80,
    funFact: "Plus grand amphithéâtre jamais construit dans l'Empire romain, capable d'accueillir jusqu'à 65 000 spectateurs et pouvant être inondé pour des naumachies (batailles navales reconstituées)."
  },
  monument_pyramides_gizeh: {
    category: 'antiquite',
    yearBuilt: -2560,
    funFact: "Seule des Sept Merveilles du monde antique encore debout aujourd'hui ; la grande pyramide de Khéops est composée de 2,3 millions de blocs de calcaire pesant chacun plus de 2 tonnes."
  },
  monument_statue_liberte: {
    category: 'monument',
    yearBuilt: 1886,
    funFact: "Offerte par la France pour le centenaire de la Déclaration d'indépendance américaine, sa structure interne métallique en fer fut conçue par Gustave Eiffel avant sa tour parisienne."
  },
  monument_opera_sydney: {
    category: 'monument',
    yearBuilt: 1973,
    funFact: "Chef-d'œuvre architectural expressionniste de Jørn Utzon dans le port de Sydney, dont les coques de béton en forme de voiles sont recouvertes de plus d'un million de tuiles de céramique suédoises."
  },
  monument_sagrada_familia: {
    category: 'religieux',
    yearBuilt: 1882,
    funFact: "Basilique visionnaire d'Antoni Gaudí à Barcelone dont la construction se poursuit depuis plus de 140 ans, financée uniquement par des dons privés et les billets des visiteurs."
  },
  monument_petra: {
    category: 'antiquite',
    yearBuilt: -300,
    funFact: "Capitale troglodytique des Nabatéens dissimulée au fond d'un étroit défilé rocheux (le Sîq), dont les façades monumentales comme la Khazneh sont taillées directement dans le grès rose du désert."
  },
  monument_grande_muraille: {
    category: 'antiquite',
    yearBuilt: -221,
    funFact: "Plus vaste structure militaire jamais édifiée par l'homme, serpentant sur plus de 21 000 kilomètres à travers montagnes et déserts pour protéger les empires chinois successifs des nomades."
  },
  monument_angkor_wat: {
    category: 'religieux',
    yearBuilt: 1150,
    funFact: "Plus grand monument religieux au monde (162 hectares), chef-d'œuvre de l'architecture khmère figurant le mont Meru, séjour des dieux dans la cosmologie hindoue."
  },
  monument_christ_redempteur: {
    category: 'monument',
    yearBuilt: 1931,
    funFact: "Statue colossale Art déco de 38 mètres de haut dominant la baie de Rio de Janeiro depuis le sommet du Corcovado à 710 mètres d'altitude, sculptée par Paul Landowski."
  },
  monument_acropole_athenes: {
    category: 'antiquite',
    yearBuilt: -447,
    funFact: "Berceau de la démocratie et de la philosophie occidentale surplombant Athènes, couronnée par le Parthénon dédié à la déesse Athéna Parthénos et bâti sous la direction de Périclès et Phidias."
  },
  monument_tour_eiffel: {
    category: 'monument',
    yearBuilt: 1889,
    funFact: "Symbole universel de la France érigé pour le centenaire de la Révolution, ses 18 000 pièces de fer forgé sont assemblées par 2,5 millions de rivets."
  },
  monument_big_ben: {
    category: 'monument',
    yearBuilt: 1859,
    funFact: "Le nom 'Big Ben' désigne originellement la cloche de 13,7 tonnes suspendue dans la tour Elizabeth du palais de Westminster, dont les cadrans sont réglés à l'aide d'anciennes pièces d'un penny."
  },
  monument_sainte_sophie: {
    category: 'religieux',
    yearBuilt: 537,
    funFact: "Joyau byzantin érigé par l'empereur Justinien, qui resta la plus grande cathédrale du monde chrétien pendant près d'un millénaire avant de devenir mosquée puis musée à Istanbul."
  },
  monument_chichen_itza: {
    category: 'antiquite',
    yearBuilt: 600,
    funFact: "Cité sacrée maya au Mexique ; lors des équinoxes de printemps et d'automne, le jeu d'ombre et de lumière sur les marches de la pyramide d'El Castillo donne l'illusion qu'un serpent à plumes descend l'édifice."
  },
  monument_stonehenge: {
    category: 'antiquite',
    yearBuilt: -3000,
    funFact: "Énigmatique cercle de mégalithes dressés dans la plaine de Salisbury en Angleterre, aligné avec une précision millimétrique sur le coucher du soleil au solstice d'hiver et le lever au solstice d'été."
  },
  monument_alhambra: {
    category: 'chateau',
    yearBuilt: 1238,
    funFact: "Chef-d'œuvre absolu de l'art nasride dominant Grenade, ensemble palatial aux cours féeriques (Cour des Lions, Cour des Myrtes) et dentelles de stuc célébrant la poésie andalouse."
  },
  monument_neuschwanstein: {
    category: 'chateau',
    yearBuilt: 1869,
    funFact: "Château romantique de conte de fées érigé dans les Alpes bavaroises pour le roi Louis II de Bavière en hommage aux opéras de Richard Wagner, qui inspira le logo et le château de Walt Disney."
  },
  monument_ile_de_paques: {
    category: 'antiquite',
    yearBuilt: 1250,
    funFact: "Sur l'île de Pâques (Rapa Nui), près de 900 statues monumentales (Moaï) taillées dans le tuf volcanique tournent le dos à l'océan pour veiller sur les villages et ancêtres polynésiens."
  },
  monument_mont_fuji: {
    category: 'nature',
    yearBuilt: 0,
    funFact: "Volcan sacré du Japon culminant à 3 776 mètres au cône enneigé d'une symétrie parfaite, immortalisé par les estampes d'Hokusai et considéré comme un kami (divinité) dans le shintoïsme."
  },
  monument_burj_khalifa: {
    category: 'civil',
    yearBuilt: 2010,
    funFact: "Plus haute structure jamais construite par l'homme, gratte-ciel de 828 mètres de haut dominant Dubaï, dont la forme s'inspire d'une fleur du désert locale (Hymenocallis)."
  },
  monument_kremlin_moscou: {
    category: 'forteresse',
    yearBuilt: 1495,
    funFact: "Cœur politique et historique de la Russie ceinturé de murailles de brique rouge et 20 tours fortifiées, faisant face à la place Rouge et aux dômes multicolores de la cathédrale Saint-Basile."
  },
  monument_pont_golden_gate: {
    category: 'civil',
    yearBuilt: 1937,
    funFact: "Pont suspendu emblématique de San Francisco franchissant le détroit du Golden Gate sur 2,7 km, peint de sa couleur signature 'Orange International' pour percer les épais brouillards du Pacifique."
  },
  monument_chutes_victoria: {
    category: 'nature',
    yearBuilt: 0,
    funFact: "Surnommées 'La fumée qui gronde' (Mosi-oa-Tunya) à la frontière de la Zambie et du Zimbabwe, plus grand rideau d'eau au monde avec 1,7 km de largeur plongeant de 108 m dans une faille rocheuse."
  },
  monument_chutes_iguazu: {
    category: 'nature',
    yearBuilt: 0,
    funFact: "Formées de 275 cascades s'étirant sur 2,7 kilomètres au cœur de la forêt tropicale entre l'Argentine et le Brésil, dominées par la vertigineuse 'Gorge du Diable' de 82 mètres de haut."
  },
  monument_chutes_niagara: {
    category: 'nature',
    yearBuilt: 0,
    funFact: "Ensemble de trois chutes d'eau sur la rivière Niagara entre les États-Unis et le Canada, affichant le débit le plus puissant d'Amérique du Nord avec plus de 2 800 m³ d'eau par seconde."
  },
  monument_mont_saint_michel: {
    category: 'abbaye',
    yearBuilt: 708,
    funFact: "Joyau médiéval de Normandie érigé sur un monticule rocheux dans une baie immense, classé au patrimoine mondial pour son abbaye gothique surnommée 'La Merveille'."
  },
  monument_cite_interdite: {
    category: 'chateau',
    yearBuilt: 1420,
    funFact: "Plus grand complexe palatial au monde avec ses 980 bâtiments et 72 hectares au cœur de Pékin, résidence souveraine de 24 empereurs des dynasties Ming et Qing fermée au public pendant 500 ans."
  },
  monument_kinkaku_ji: {
    category: 'religieux',
    yearBuilt: 1397,
    funFact: "Célèbre 'Pavillon d'Or' zen à Kyoto dont les deux étages supérieurs sont intégralement recouverts de feuilles d'or pur, se reflétant dans les eaux calmes de l'étang miroir (Kyōko-chi)."
  },
  monument_lalibela: {
    category: 'religieux',
    yearBuilt: 1200,
    funFact: "Onze églises médiévales monolithes en Éthiopie taillées d'un seul bloc directement dans la roche volcanique rouge au XIIe siècle, reliées entre elles par des tranchées et catacombes."
  },
  monument_djenn_mosquee: {
    category: 'religieux',
    yearBuilt: 1907,
    funFact: "Plus grand édifice en terre crue (banco) au monde, chef-d'œuvre de l'architecture soudano-sahélienne au Mali dont les murs sont réenduits chaque année par toute la communauté lors d'une fête rituelle."
  },
  monument_table_mountain: {
    category: 'nature',
    yearBuilt: 0,
    funFact: "Montagne au sommet plat caractéristique culminant à 1 086 mètres au-dessus du Cap en Afrique du Sud, souvent recouverte d'une nappe de nuages blancs appelée la 'Nappe de table'."
  },
  monument_tombouctou: {
    category: 'religieux',
    yearBuilt: 1327,
    funFact: "Mosquée et prestigieuse université islamique médiévale de Tombouctou, carrefour intellectuel des caravanes transsahariennes qui abritait des dizaines de milliers de manuscrits précieux."
  },
  monument_teotihuacan: {
    category: 'antiquite',
    yearBuilt: 100,
    funFact: "Gigantesque pyramide mésoaméricaine haute de 65 mètres dominant l'Allée des Morts au Mexique, bâtie par une civilisation préaztèque mystérieuse sans écriture connue."
  },
  monument_tikal: {
    category: 'antiquite',
    yearBuilt: 734,
    funFact: "L'une des plus puissantes cités-États mayas cachée au cœur de la jungle du Guatemala, dont les temples pyramidaux calcaires s'élèvent au-dessus de la canopée tropicale."
  },
  monument_lignes_nazca: {
    category: 'antiquite',
    yearBuilt: -200,
    funFact: "Centaines de géoglyphes géants (colibri, singe, araignée) tracés dans le désert aride du sud du Pérou en retirant les cailloux rougeâtres pour faire apparaître la terre claire, visibles uniquement du ciel."
  },
  monument_salar_uyuni: {
    category: 'nature',
    yearBuilt: 0,
    funFact: "Plus grand désert de sel au monde (plus de 10 000 km²) perché à 3 650 m sur l'Altiplano bolivien, formant lors de la saison des pluies le plus vaste miroir naturel de la Terre."
  },
  monument_tours_petronas: {
    category: 'civil',
    yearBuilt: 1998,
    funFact: "Tours jumelles de 452 mètres à Kuala Lumpur inspirées de motifs géométriques islamiques, reliées au 41e étage par une passerelle à double étage suspendue à 170 mètres du sol."
  },
  monument_borobudur: {
    category: 'religieux',
    yearBuilt: 825,
    funFact: "Plus grand monument bouddhiste au monde sur l'île de Java en Indonésie, pyramide à terrasses étagées ornée de 504 statues du Bouddha et de 72 stupas ajourés en pierre de lave."
  },
  monument_baalbek: {
    category: 'antiquite',
    yearBuilt: 150,
    funFact: "Cité antique romaine au Liban célèbre pour son temple de Bacchus aux proportions titanesques et ses mégalithes pesant près de 1 000 tonnes, parmi les plus lourds déplacés par l'homme."
  },
  monument_persepolis: {
    category: 'antiquite',
    yearBuilt: -515,
    funFact: "Capitale cérémonielle de l'Empire perse achéménide fondée par Darius Ier, chef-d'œuvre de bas-reliefs célébrant les peuples de l'empire avant d'être incendiée par Alexandre le Grand en 330 av. J.-C."
  },
  monument_saint_pierre_rome: {
    category: 'religieux',
    yearBuilt: 1626,
    funFact: "Plus grande église du monde et cœur du Vatican, érigée au-dessus de la tombe supposée de l'apôtre Pierre avec une majestueuse coupole conçue par Michel-Ange."
  },
  monument_chateau_versailles: {
    category: 'chateau',
    yearBuilt: 1661,
    funFact: "Sommet de l'art classique français conçu pour magnifier le règne de Louis XIV, avec ses 800 hectares de jardins féeriques ponctués de bassins animés par les Grandes Eaux."
  },
  monument_tour_de_pise: {
    category: 'monument',
    yearBuilt: 1173,
    funFact: "Campanile en marbre blanc de la cathédrale de Pise célèbre pour son inclinaison involontaire de près de 4 degrés, causée dès le début des travaux par un sol meuble d'argile et de sable."
  },
  monument_porte_brandebourg: {
    category: 'monument',
    yearBuilt: 1791,
    funFact: "Monument néoclassique berlinois inspiré des Propylées d'Athènes, couronné par son quadrige de bronze ; symbole des divisions de la guerre froide puis de la réunification allemande."
  },
  monument_uluru: {
    category: 'nature',
    yearBuilt: 0,
    funFact: "Inselberg de grès sacré pour les peuples aborigènes Anangu au cœur de l'Outback australien, haut de 348 mètres, réputé pour ses spectaculaires changements de teinte rouge au coucher du soleil."
  },
  monument_mont_rushmore: {
    category: 'monument',
    yearBuilt: 1941,
    funFact: "Sculpture monumentale taillée dans le granit des Black Hills du Dakota du Sud, représentant les visages de 18 mètres de haut de quatre présidents américains (Washington, Jefferson, T. Roosevelt, Lincoln)."
  },
  monument_grand_canyon: {
    category: 'nature',
    yearBuilt: 0,
    funFact: "Gorge spectaculaire creusée par le fleuve Colorado en Arizona sur 450 km de long et jusqu'à 1 800 mètres de profondeur, exposant deux milliards d'années d'histoire géologique de la Terre."
  },
  monument_mile_met_york: {
    category: 'civil',
    yearBuilt: 1931,
    funFact: "Gratte-ciel Art déco de 381 mètres (443 m avec flèche) au cœur de Manhattan, construit en un temps record de seulement 13 mois et demi en pleine Grande Dépression."
  }
};

function enrichPack(filePath, metaDict) {
  const items = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  let count = 0;
  items.forEach((item) => {
    const meta = metaDict[item.id];
    if (meta) {
      if (meta.category) item.category = meta.category;
      if (meta.yearBuilt !== undefined) item.yearBuilt = meta.yearBuilt;
      if (meta.funFact) item.funFact = meta.funFact;
      count++;
    }
  });
  fs.writeFileSync(filePath, JSON.stringify(items, null, 2), 'utf8');
  console.log(`✅ Enriched ${count}/${items.length} items in ${path.basename(filePath)}`);
}

function run() {
  enrichPack(FRANCE_FILE, FRANCE_META);
  enrichPack(MONDE_FILE, MONDE_META);

  // Sync to castles.json and monuments.json
  if (fs.existsSync(CASTLES_FILE)) {
    enrichPack(CASTLES_FILE, FRANCE_META);
  }
  if (fs.existsSync(MONUMENTS_FILE)) {
    enrichPack(MONUMENTS_FILE, MONDE_META);
  }
}

run();
