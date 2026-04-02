/**
 * One-off generator: fills CityLandingPage.* keys in es.json and fr.json
 * with localized copy (unique per city via name + regional line).
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');

const locales = {
  es: {
    suffix: ' | cowork24',
    breadcrumbHome: 'Inicio',
    breadcrumbCoworking: 'Coworking en Suiza',
    faqSectionTitle: 'Preguntas frecuentes',
    otherCitiesHeading: 'Coworking en otras ciudades suizas',
    fetchError: 'No hemos podido cargar los anuncios. Inténtalo de nuevo más tarde.',
    listingsHeading: c => `Espacios de coworking en ${c.es}`,
    noListings: 'Aún no hay anuncios en esta zona — explora todos los espacios en cowork24.',
    viewAllListings: 'Ver todos los espacios en esta zona',
    whyTitle: c => `¿Por qué hacer coworking en ${c.es}?`,
    faq1q: c => `¿Cuánto cuesta un pase diario de coworking en ${c.es}?`,
    faq1a:
      'Los precios dependen del espacio y los servicios. En cowork24 cada anuncio muestra las tarifas actuales para comparar.',
    faq2q: c => `¿${c.es} está bien conectada en transporte público?`,
    faq2a: c =>
      `Sí. ${c.areaEs} suele tener buenas conexiones; muchos espacios están cerca de estaciones o nodos importantes.`,
    faq3q: '¿Coworking o alquilar una oficina en Suiza?',
    faq3a:
      'El coworking encaja en equipos flexibles y proyectos cortos; el alquiler tradicional encaja en equipos estables. cowork24 reúne opciones reservables.',
    faq4q: c => `¿Hay espacios cerca del centro o estación en ${c.es}?`,
    faq4a:
      'Sí, muchos operadores eligen ubicaciones céntricas. Usa la búsqueda con mapa para filtrar por barrio.',
    faq5q: '¿Puedo reservar salas de reunión por separado?',
    faq5a:
      'Sí. Muchos anuncios incluyen salas u oficinas por horas; revisa capacidad y precio en cada ficha.',
  },
  fr: {
    suffix: ' | cowork24',
    breadcrumbHome: 'Accueil',
    breadcrumbCoworking: 'Coworking en Suisse',
    faqSectionTitle: 'Questions fréquentes',
    otherCitiesHeading: 'Coworking dans d’autres villes suisses',
    fetchError: 'Impossible de charger les annonces pour le moment. Réessayez plus tard.',
    listingsHeading: c => `Espaces de coworking à ${c.fr}`,
    noListings: 'Pas encore d’annonces dans cette zone — découvrez tous les espaces sur cowork24.',
    viewAllListings: 'Voir tous les espaces dans cette zone',
    whyTitle: c => `Pourquoi travailler en coworking à ${c.fr} ?`,
    faq1q: c => `Combien coûte une journée de coworking à ${c.fr} ?`,
    faq1a:
      'Les tarifs dépendent de l’espace et des services. Sur cowork24, chaque annonce affiche les prix à jour.',
    faq2q: c => `${c.fr} est-elle bien desservie par les transports ?`,
    faq2a: c =>
      `Oui. ${c.areaFr} offre en général de bonnes liaisons ; de nombreux espaces sont proches des gares ou hubs.`,
    faq3q: 'Coworking ou bureau classique en Suisse ?',
    faq3a:
      'Le coworking convient aux équipes flexibles et aux projets courts ; la location classique aux besoins stables. cowork24 regroupe les options réservables.',
    faq4q: c => `Y a-t-il des espaces près du centre ou de la gare à ${c.fr} ?`,
    faq4a:
      'Oui, beaucoup d’opérateurs sont en centre-ville. Utilisez la carte pour filtrer par quartier.',
    faq5q: 'Puis-je réserver des salles de réunion séparément ?',
    faq5a:
      'Oui. Beaucoup d’annonces proposent salles ou bureaux à l’heure ; vérifiez capacité et tarifs sur chaque fiche.',
  },
};

const cities = [
  {
    slug: 'zurich',
    es: 'Zúrich',
    fr: 'Zurich',
    en: 'Zurich',
    areaEs: 'Zúrich y su aglomeración',
    areaFr: 'Zurich et son agglomération',
    metaEs: 'Coworking Zúrich – pases diarios y puestos',
    metaFr: 'Coworking Zurich – bureaux flexibles et journées',
    descEs:
      'Encuentra espacios de coworking en Zúrich y la región: puestos flexibles, salas de reunión y pases diarios en cowork24.',
    descFr:
      'Trouvez des espaces de coworking à Zurich et dans la région : postes flexibles, salles de réunion et journées sur cowork24.',
    introEs:
      'Zúrich es el motor económico de Suiza, con excelente transporte público y ecosistema startup. En cowork24 descubres espacios flexibles de la ciudad a la región de Zúrich.',
    introFr:
      'Zurich est le moteur économique de la Suisse, avec un excellent réseau de transports et une scène startup vivante. Sur cowork24, découvrez des espaces flexibles de la ville à la région.',
    why1Es:
      'Zúrich combina finanzas globales, redes de transporte densas y proximidad a lago y montaña: ideal para equipos que buscan espacio profesional sin arrendamientos largos.',
    why1Fr:
      'Zurich combine finance internationale, transports denses et proximité lac et montagne : idéal pour les équipes qui veulent du professionnel sans baux longs.',
    why2Es:
      'Desde la estación principal hasta los barrios periféricos, cowork24 te ayuda a comparar disponibilidad y reservas con claridad.',
    why2Fr:
      'De la gare aux quartiers périphériques, cowork24 vous aide à comparer disponibilité et réservation en toute transparence.',
  },
  {
    slug: 'bern',
    es: 'Berna',
    fr: 'Berne',
    en: 'Bern',
    areaEs: 'Berna y el Mittelland bernés',
    areaFr: 'Berne et le Mittelland bernois',
    metaEs: 'Coworking Berna – espacios en la capital federal',
    metaFr: 'Coworking Berne – espaces dans la capitale fédérale',
    descEs:
      'Coworking en Berna y el Mittelland: casco histórico UNESCO, instituciones federales y espacios flexibles en cowork24.',
    descFr:
      'Coworking à Berne et dans le Mittelland : vieille ville UNESCO, institutions fédérales et espaces flexibles sur cowork24.',
    introEs:
      'Berna es la capital federal con un centro compacto y buena red de transporte. En cowork24 encuentras coworking desde el casco antiguo hasta el Mittelland.',
    introFr:
      'Berne est la capitale fédérale au centre compact et bien desservi. Sur cowork24, trouvez du coworking de la vieille ville au Mittelland.',
    why1Es:
      'Alta calidad de vida, trayectos cortos y proximidad a gobierno y ONG hacen de Berna un lugar ideal para asociaciones y consultoras.',
    why1Fr:
      'Qualité de vie, trajets courts et proximité des autorités et ONG rendent Berne idéale pour associations et cabinets.',
    why2Es:
      'Desde el casco hasta Wankdorf, cowork24 muestra anuncios comparables sin perder tiempo.',
    why2Fr:
      'Du centre à Wankdorf, cowork24 présente des annonces comparables sans perte de temps.',
  },
  {
    slug: 'basel',
    es: 'Basilea',
    fr: 'Bâle',
    en: 'Basel',
    areaEs: 'Basilea y la región trinacional',
    areaFr: 'Bâle et la région trinationale',
    metaEs: 'Coworking Basilea – Rin y región trinacional',
    metaFr: 'Coworking Bâle – Rhin et région trinationale',
    descEs:
      'Coworking en Basilea y noroeste de Suiza: ciencias de la vida, logística y equipos transfronterizos en cowork24.',
    descFr:
      'Coworking à Bâle et nord-ouest de la Suisse : life sciences, logistique et équipes transfrontalières sur cowork24.',
    introEs:
      'Basilea está en el Rin con conexiones rápidas a Alemania y Francia. En cowork24 encuentras oficinas flexibles para equipos internacionales y creativos.',
    introFr:
      'Bâle est sur le Rhin avec des liaisons rapides vers l’Allemagne et la France. Sur cowork24, des bureaux flexibles pour équipes internationales et créatives.',
    why1Es:
      'Ciencias de la vida, arte y mercado laboral trinacional: el coworking ayuda a proyectos cerca del aeropuerto y ferias.',
    why1Fr:
      'Life sciences, arts et marché du travail trinational : le coworking aide les projets près de l’aéroport et des salons.',
    why2Es:
      'Desde Badischer Bahnhof hasta St. Johann, cowork24 muestra opciones con reservas claras.',
    why2Fr:
      'De la gare allemande à St. Johann, cowork24 propose des options avec réservation claire.',
  },
  {
    slug: 'geneva',
    es: 'Ginebra',
    fr: 'Genève',
    en: 'Geneva',
    areaEs: 'Ginebra y el área internacional',
    areaFr: 'Genève et l’arc international',
    metaEs: 'Coworking Ginebra – ciudad internacional y lago',
    metaFr: 'Coworking Genève – ville internationale et lac',
    descEs:
      'Coworking en Ginebra: espacios multilingües, ONG y oficinas flexibles. Explora cowork24.',
    descFr:
      'Coworking à Genève : espaces multilingues, ONG et bureaux flexibles. Parcourez cowork24.',
    introEs:
      'Ginebra acoge la ONU, finanzas y relojería junto al lago. En cowork24 descubres coworking desde Plainpalais hasta el barrio internacional.',
    introFr:
      'Genève accueille l’ONU, la finance et l’horlogerie au bord du lac. Sur cowork24, du coworking de Plainpalais au quartier international.',
    why1Es:
      'Talento multilingüe e instituciones internacionales exigen espacio flexible para equipos rotativos y visitas.',
    why1Fr:
      'Talents multilingues et institutions internationales demandent de la flexibilité pour équipes tournantes et visiteurs.',
    why2Es:
      'Lago, tranvías y frontera con Francia: elige el espacio según desplazamientos y clientes.',
    why2Fr:
      'Lac, trams et frontière française : choisissez selon trajets et rendez-vous clients.',
  },
  {
    slug: 'lausanne',
    es: 'Lausana',
    fr: 'Lausanne',
    en: 'Lausanne',
    areaEs: 'Lausana y el cantón de Vaud',
    areaFr: 'Lausanne et le canton de Vaud',
    metaEs: 'Coworking Lausana – lago Lemán y EPFL',
    metaFr: 'Coworking Lausanne – Léman et EPFL',
    descEs:
      'Coworking en Lausana y Vaud: innovación, universidades y vida junto al lago en cowork24.',
    descFr:
      'Coworking à Lausanne et dans le Vaud : innovation, universités et vie au bord du lac sur cowork24.',
    introEs:
      'Lausana combina EPFL/UNIL, patrimonio olímpico y viñedos sobre el lago. En cowork24 encuentras espacio flexible para startups y empresas consolidadas.',
    introFr:
      'Lausanne combine EPFL/UNIL, patrimoine olympique et vignobles au-dessus du lac. Sur cowork24, des espaces flexibles pour startups et grands groupes.',
    why1Es:
      'Investigación, deporte y economía lacustre: el coworking conecta campus, ciudad y orilla.',
    why1Fr:
      'Recherche, sport et économie lémanique : le coworking relie campus, ville et rives.',
    why2Es:
      'Desde Flon hasta Renens, cowork24 ayuda a comparar desplazamientos realistas.',
    why2Fr:
      'Du Flon à Renens, cowork24 aide à comparer les temps de trajet.',
  },
  {
    slug: 'lucerne',
    es: 'Lucerna',
    fr: 'Lucerne',
    en: 'Lucerne',
    areaEs: 'Lucerna y Suiza central',
    areaFr: 'Lucerne et la Suisse centrale',
    metaEs: 'Coworking Lucerna – Suiza central y lago',
    metaFr: 'Coworking Lucerne – Suisse centrale et lac',
    descEs:
      'Coworking en Lucerna: turismo, pymes y buena conexión regional en cowork24.',
    descFr:
      'Coworking à Lucerne : tourisme, PME et bonnes liaisons régionales sur cowork24.',
    introEs:
      'Lucerna está entre lagos y montañas con trenes rápidos hacia Zúrich. En cowork24 encuentras espacios para turismo, industria y equipos distribuidos.',
    introFr:
      'Lucerne est entre lacs et montagnes avec des trains rapides vers Zurich. Sur cowork24, des espaces pour tourisme, industrie et équipes distribuées.',
    why1Es:
      'Suiza central equilibra densidad e infraestructura: ideal para equipos entre Zúrich, Berna y Alpes.',
    why1Fr:
      'La Suisse centrale équilibre densité et infrastructure : idéal entre Zurich, Berne et les Alpes.',
    why2Es:
      'Desde la ciudad vieja hasta Kriens, cowork24 detalla servicios y reglas de reserva.',
    why2Fr:
      'De la vieille ville à Kriens, cowork24 détaille services et règles de réservation.',
  },
  {
    slug: 'st-gallen',
    es: 'San Galo',
    fr: 'Saint-Gall',
    en: 'St. Gallen',
    areaEs: 'San Galo y el este de Suiza',
    areaFr: 'Saint-Gall et l’est de la Suisse',
    metaEs: 'Coworking San Galo – este de Suiza',
    metaFr: 'Coworking Saint-Gall – est de la Suisse',
    descEs:
      'Coworking en San Galo: tradición textil, universidad y startups en cowork24.',
    descFr:
      'Coworking à Saint-Gall : tradition textile, université et startups sur cowork24.',
    introEs:
      'San Galo es un hub oriental con universidad reconocida y escena emergente. En cowork24 encuentras oficinas entre el lago de Constanza y Appenzell.',
    introFr:
      'Saint-Gall est un pôle oriental avec une université reconnue et une scène en croissance. Sur cowork24, des bureaux entre le lac de Constance et l’Appenzell.',
    why1Es:
      'Costes competitivos y buen enlace con Zúrich y Austria: el coworking escala sin grandes fijos.',
    why1Fr:
      'Coûts compétitifs et bonnes liaisons vers Zurich et l’Autriche : le coworking scale sans frais fixes élevés.',
    why2Es:
      'Desde el casco hasta Bruggen, cowork24 lista espacios con precios transparentes.',
    why2Fr:
      'Du centre à Bruggen, cowork24 liste des espaces aux tarifs clairs.',
  },
  {
    slug: 'winterthur',
    es: 'Winterthur',
    fr: 'Winterthour',
    en: 'Winterthur',
    areaEs: 'Winterthur y el área de Zúrich',
    areaFr: 'Winterthour et la région zurichoise',
    metaEs: 'Coworking Winterthur – área de Zúrich e innovación',
    metaFr: 'Coworking Winterthour – région zurichoise et innovation',
    descEs:
      'Coworking en Winterthur: innovación, acceso al aeropuerto de Zúrich y espacios flexibles en cowork24.',
    descFr:
      'Coworking à Winterthour : innovation, accès à l’aéroport de Zurich et espaces flexibles sur cowork24.',
    introEs:
      'Winterthur une patrimonio industrial, formación técnica y buen tren a Zúrich. En cowork24 descubres coworking y ecosistema Technopark.',
    introFr:
      'Winterthour mêle patrimoine industriel, formation technique et trains rapides vers Zurich. Sur cowork24, coworking et écosystème Technopark.',
    why1Es:
      'Alquileres más bajos que el centro de Zúrich y buen tren: atractivo para equipos de producto y creativos con aeropuerto.',
    why1Fr:
      'Loyers plus bas que Zurich centre et bon train : attractif pour produit et créatifs avec aéroport.',
    why2Es:
      'Desde la ciudad vieja hasta Töss, cowork24 mapea tamaños y flexibilidad de reserva.',
    why2Fr:
      'De la vieille ville au Töss, cowork24 mappe tailles et flexibilité de réservation.',
  },
  {
    slug: 'zug',
    es: 'Zug',
    fr: 'Zoug',
    en: 'Zug',
    areaEs: 'Zug y el cantón',
    areaFr: 'Zoug et le canton',
    metaEs: 'Coworking Zug – Crypto Valley y sedes',
    metaFr: 'Coworking Zoug – Crypto Valley et sièges',
    descEs:
      'Coworking en Zug: sedes corporativas, lago y oficinas flexibles para startups y pymes en cowork24.',
    descFr:
      'Coworking à Zoug : sièges, lac et bureaux flexibles pour startups et PME sur cowork24.',
    introEs:
      'Zug es conocido por holdings, pioneros blockchain y vistas al lago entre Zúrich y Lucerna. En cowork24 encuentras espacio para equipos regulados y en rápida expansión.',
    introFr:
      'Zoug est connu pour les holdings, la blockchain et le lac entre Zurich et Lucerne. Sur cowork24, des espaces pour équipes régulées et en forte croissance.',
    why1Es:
      'Zug atrae holdings y fintech: el coworking ofrece capacidad flexible junto a oficinas clásicas.',
    why1Fr:
      'Zoug attire holdings et fintech : le coworking offre de la capacité flexible à côté des bureaux classiques.',
    why2Es:
      'Desde la ciudad vieja hasta Rotkreuz, cowork24 compara desplazamientos desde Zúrich o Lucerna.',
    why2Fr:
      'De la vieille ville à Rotkreuz, cowork24 compare les trajets depuis Zurich ou Lucerne.',
  },
];

function applyLocale(localeKey) {
  const L = locales[localeKey];
  const filePath = path.join(root, 'src', 'translations', `${localeKey}.json`);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  data['CityLandingPage.breadcrumbHome'] = L.breadcrumbHome;
  data['CityLandingPage.breadcrumbCoworking'] = L.breadcrumbCoworking;
  data['CityLandingPage.faqSectionTitle'] = L.faqSectionTitle;
  data['CityLandingPage.otherCitiesHeading'] = L.otherCitiesHeading;
  data['CityLandingPage.fetchError'] = L.fetchError;

  cities.forEach(c => {
    const name = localeKey === 'es' ? c.es : c.fr;
    const prefix = `CityLandingPage.${c.slug}`;
    const metaLine = localeKey === 'es' ? c.metaEs : c.metaFr;
    const descLine = localeKey === 'es' ? c.descEs : c.descFr;
    data[`${prefix}.metaTitle`] = `${metaLine}${L.suffix}`;
    data[`${prefix}.metaDescription`] = descLine;
    data[`${prefix}.h1`] =
      localeKey === 'es' ? `Coworking en ${c.es}` : `Coworking à ${c.fr}`;
    data[`${prefix}.intro`] = localeKey === 'es' ? c.introEs : c.introFr;
    data[`${prefix}.listingsHeading`] = L.listingsHeading(c);
    data[`${prefix}.noListings`] = L.noListings;
    data[`${prefix}.viewAllListings`] = L.viewAllListings;
    data[`${prefix}.whyTitle`] = L.whyTitle(c);
    data[`${prefix}.whyBody1`] = localeKey === 'es' ? c.why1Es : c.why1Fr;
    data[`${prefix}.whyBody2`] = localeKey === 'es' ? c.why2Es : c.why2Fr;
    data[`${prefix}.placeName`] = name;
    data[`${prefix}.linkLabel`] = name;
    data[`${prefix}.faq1q`] = L.faq1q(c);
    data[`${prefix}.faq1a`] = L.faq1a;
    data[`${prefix}.faq2q`] = L.faq2q(c);
    data[`${prefix}.faq2a`] = L.faq2a(c);
    data[`${prefix}.faq3q`] = L.faq3q;
    data[`${prefix}.faq3a`] = L.faq3a;
    data[`${prefix}.faq4q`] = L.faq4q(c);
    data[`${prefix}.faq4a`] = L.faq4a;
    data[`${prefix}.faq5q`] = L.faq5q;
    data[`${prefix}.faq5a`] = L.faq5a;
  });

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n');
}

applyLocale('es');
applyLocale('fr');
console.log('Updated es.json and fr.json CityLandingPage keys.');
