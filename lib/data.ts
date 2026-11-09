export const company = {
  name: "МОС ХИМЧИСТКА",
  phone: "+7 (495) 665-24-65",
  tel: "+74956652465",
  email: "zakaz@mos-drycleaning.ru",
  address: "Москва, Большая Грузинская, 30А, стр. 1, офис 302",
  hours: "Работаем без выходных",
  telegram: "https://t.me/Elitclean",
  vk: "https://vk.com/mosdrycleaning",
  reviewsUrl: "https://yandex.ru/profile/183965989861",
  source: "https://mos-drycleaning.ru",
};
export const categories = [
  { slug: "furniture", name: "Мягкая мебель" },
  { slug: "textile", name: "Текстиль" },
  { slug: "business", name: "Для бизнеса" },
  { slug: "special", name: "Особый уход" },
];
export const seedServices = [
  {
    slug: "sofa",
    title: "Химчистка диванов",
    short: "Диваны",
    category: "furniture",
    image: "sofa",
    source: "furniture",
    description:
      "Бережная глубокая чистка диванов с тканевой обивкой. Подбираем состав под синтетические и натуральные материалы.",
    duration: 120,
    prices: [
      ["2 места", "synthetic", 1500],
      ["3 места", "synthetic", 2250],
      ["4 места", "synthetic", 3000],
      ["2 места", "natural", 2500],
      ["3 места", "natural", 3500],
      ["4 места", "natural", 4500],
    ],
  },
  {
    slug: "carpet",
    title: "Чистка ковров",
    short: "Ковры",
    category: "textile",
    image: "carpet",
    source: "carpets",
    description:
      "Глубокая чистка ковров и ковровых покрытий с учётом состава волокон и длины ворса. Объём и единицу расчёта уточнит менеджер по фотографиям.",
    duration: 150,
    prices: [["Ковровое покрытие — оценка по фото", "consultation", 150]],
  },
  {
    slug: "mattress",
    title: "Чистка матрасов",
    short: "Матрасы",
    category: "textile",
    image: "bed",
    source: "matrasy",
    description:
      "Удаление пыли и въевшихся загрязнений. Экстракторная обработка и тщательное вымывание чистящего средства.",
    duration: 120,
    prices: [
      ["140 × 200", "standard", 8500],
      ["160 × 200", "standard", 9500],
      ["180 × 200", "standard", 10500],
      ["200 × 200", "standard", 12000],
      ["220 × 200", "standard", 13500],
      ["Евростандарт", "standard", 14500],
      ["160 × 200", "premium", 14000],
      ["180 × 200", "premium", 16000],
      ["200 × 200", "premium", 18000],
      ["220 × 200", "premium", 20000],
    ],
  },
  {
    slug: "armchair",
    title: "Чистка кресел и стульев",
    short: "Кресла",
    category: "furniture",
    image: "chair",
    source: "furniture",
    description:
      "Уход за креслами, стульями и компьютерными креслами. Чистим обивку и труднодоступные участки.",
    duration: 60,
    prices: [
      ["Кресло", "synthetic", 900],
      ["Стул", "synthetic", 700],
      ["Компьютерное кресло", "synthetic", 800],
      ["Кресло", "natural", 1500],
      ["Стул", "natural", 2500],
      ["Компьютерное кресло", "natural", 1000],
    ],
  },
  {
    slug: "curtains",
    title: "Химчистка штор",
    short: "Шторы",
    category: "textile",
    image: "hero",
    source: "curtains",
    description:
      "Деликатная чистка штор на весу: тюль, портьеры, велюр и бархат. Параметры и итоговую стоимость согласует технолог.",
    duration: 150,
    prices: [
      ["Тюль, м²", "synthetic", 150],
      ["Тюль, м²", "natural", 250],
      ["Шторы без подклада, м²", "synthetic", 350],
      ["Шторы на подкладе, м²", "synthetic", 450],
      ["Портьеры без подклада, м²", "natural", 500],
      ["Портьеры на подкладе, м²", "natural", 600],
      ["Дизайнерские портьеры, м²", "standard", 650],
      ["Римские шторы (тюль), м²", "standard", 300],
      ["Римские шторы (плотные), м²", "standard", 350],
    ],
  },
  {
    slug: "leather",
    title: "Уход за кожаной мебелью",
    short: "Кожа",
    category: "special",
    image: "sofa",
    source: "leather",
    description:
      "Профессиональный уход за натуральной и искусственной кожей. Технолог оценивает состояние покрытия до начала обработки.",
    duration: 150,
    prices: [
      ["Диван 2 места", "leather", 13000],
      ["Диван 3 места", "leather", 19500],
      ["Диван 4 места", "leather", 26000],
      ["Диван 6 мест", "leather", 39000],
      ["Посадочное место дивана", "leather", 6500],
      ["Кресло", "leather", 7500],
      ["Стул", "leather", 3500],
      ["Пуфик", "leather", 4500],
    ],
  },
  {
    slug: "nubuck",
    title: "Химчистка нубука",
    short: "Нубук",
    category: "special",
    image: "chair",
    source: "nubuck",
    description:
      "Специальная обработка мебели из нубука и замши. Точная стоимость после осмотра и определения материала.",
    duration: 180,
    prices: [
      ["Диван 2 места", "nubuck", 76000],
      ["Диван 3 места", "nubuck", 115000],
      ["Диван 4 места", "nubuck", 152000],
      ["Диван 6 мест", "nubuck", 228000],
      ["Изголовье", "nubuck", 38000],
      ["Кресло", "nubuck", 35000],
      ["Стул", "nubuck", 20000],
      ["Пуфик", "nubuck", 24000],
    ],
  },
  {
    slug: "office",
    title: "Химчистка для офисов",
    short: "Офисы",
    category: "business",
    image: "hero",
    source: "offices",
    description:
      "Выездная чистка офисной мебели, стульев и ковровых покрытий. Планируем работы с учётом графика вашей компании.",
    duration: 180,
    prices: [
      ["Диван 2 места", "standard", 2000],
      ["Диван 3 места", "standard", 3000],
      ["Угловой диван 4 места", "standard", 4000],
      ["Кресло", "standard", 800],
      ["Офисное кресло", "standard", 500],
      ["Стул", "standard", 300],
    ],
  },
  {
    slug: "restaurant",
    title: "Химчистка для кафе и ресторанов",
    short: "Рестораны",
    category: "business",
    image: "hero",
    source: "restaurants",
    description:
      "Чистка мягкой мебели в заведениях. Согласуем время выезда и материалы до начала работ.",
    duration: 180,
    prices: [
      ["Диван 2 места", "standard", 2000],
      ["Диван 3 места", "standard", 3000],
      ["Угловой диван 4 места", "standard", 4000],
      ["Кресло", "standard", 700],
      ["Стул", "standard", 300],
    ],
  },
  {
    slug: "restoration",
    title: "Реставрация кожаной мебели",
    short: "Реставрация",
    category: "special",
    image: "sofa",
    source: "restoration",
    description:
      "Локальный ремонт кожи: царапины, разрывы, прожоги и восстановление окраски. Возможность ремонта оценивается по фото.",
    duration: 180,
    prices: [
      ["Царапина до 10 мм", "leather", 1500],
      ["Царапина 10–50 мм", "leather", 2500],
      ["Порез до 10 мм", "leather", 1700],
      ["Порез 10–50 мм", "leather", 2700],
      ["Прожог до 10 мм", "leather", 2000],
      ["Частичная покраска", "leather", 3000],
    ],
  },
  {
    slug: "protection",
    title: "Гидрофобная защита мебели",
    short: "Защита мебели",
    category: "special",
    image: "chair",
    source: "gidrofobnaya-zashchita-mebeli",
    description:
      "Защитная обработка текстильных и кожаных поверхностей. Расход состава и технологию подбираем под материал.",
    duration: 180,
    prices: [
      ["Диван 2 места", "standard", 16000],
      ["Диван 3 места", "standard", 24000],
      ["Диван 4 места", "standard", 32000],
      ["Кресло", "standard", 8000],
      ["Стул", "standard", 6500],
      ["Пуфик", "standard", 5500],
    ],
  },
  {
    slug: "ozonation",
    title: "Сухой туман и озонирование",
    short: "Озонирование",
    category: "special",
    image: "hero",
    source: "ozonation",
    description:
      "Обработка помещений и устранение запахов. Технолог согласует порядок, время и условия безопасного доступа после обработки.",
    duration: 180,
    prices: [["Озонирование — расчёт технологом", "consultation", 1100]],
  },
  {
    slug: "cleaning",
    title: "Уборка квартир, домов и офисов",
    short: "Уборка",
    category: "business",
    image: "hero",
    source: "klining",
    description:
      "Генеральная и поддерживающая уборка. Площадь, состав работ и длительность согласуются с менеджером.",
    duration: 180,
    prices: [
      ["Поддерживающая уборка, м²", "standard", 80],
      ["Генеральная уборка, м²", "standard", 180],
      ["Уборка офиса, м²", "standard", 30],
    ],
  },
  {
    slug: "stone",
    title: "Полировка натурального камня",
    short: "Уход за камнем",
    category: "special",
    image: "carpet",
    source: "polirovka-pola-mramora-granita",
    description:
      "Профессиональный уход за мрамором, гранитом, керамогранитом и акрилом. Возможность обработки определяем по состоянию поверхности.",
    duration: 180,
    prices: [
      ["Полировка мрамора, м²", "standard", 700],
      ["Кристаллизация мрамора, м²", "standard", 300],
      ["Шлифовка мрамора, м²", "standard", 600],
    ],
  },
] as const;
export const materialNames: Record<string, string> = {
  synthetic: "Синтетика",
  natural: "Натуральная ткань",
  standard: "Стандарт",
  premium: "Премиум",
  leather: "Кожа",
  nubuck: "Нубук",
  consultation: "Требует уточнения",
};
export const faqs = [
  [
    "Сколько времени занимает чистка?",
    "Длительность зависит от размера, материала и степени загрязнения. Чистка стандартного двухместного дивана из синтетической ткани занимает около часа.",
  ],
  [
    "Когда мебелью снова можно пользоваться?",
    "Обычно мебель сохнет 4–6 часов. Время зависит от влажности и проветривания помещения.",
  ],
  [
    "Нужна ли предоплата?",
    "Предоплата не требуется. Оплата производится после завершения работ: наличными, картой, по QR-коду или безналичным расчётом.",
  ],
  [
    "Безопасны ли чистящие средства?",
    "Компания использует профессиональные гипоаллергенные средства для текстильных поверхностей и ковров. Сообщите мастеру об аллергии и особенностях материала заранее.",
  ],
  [
    "Вы работаете в выходные?",
    "Да, мастера работают без выходных в Москве и Московской области. Заявки на сайте можно оставить круглосуточно.",
  ],
  [
    "От чего зависит окончательная цена?",
    "От размера, материала, загрязнений и дополнительных услуг. Минимальный выезд — 4 500 ₽. Предварительную оценку из калькулятора менеджер уточнит до начала работ.",
  ],
];
export const statuses: Record<string, string> = {
  PENDING: "Ожидает подтверждения",
  CONFIRMED: "Подтверждено",
  IN_PROGRESS: "В работе",
  COMPLETED: "Выполнено",
  CANCELLED: "Отменено",
  EXPIRED: "Резерв истёк",
};
export const money = (n: number) =>
  new Intl.NumberFormat("ru-RU").format(n) + " ₽";

export const defaultPricingRules: Record<
  string,
  Record<string, { label: string; amount: number; percent?: boolean }>
> = {
  sofa: {
    heavy: { label: "Сильное загрязнение", amount: 20, percent: true },
    odor: { label: "Устранение запаха", amount: 3000 },
    steam: { label: "Обработка паром", amount: 2500 },
    antistatic: { label: "Антистатик", amount: 50, percent: true },
    dry: { label: "Сушка", amount: 3500 },
  },
  armchair: {
    heavy: { label: "Сильное загрязнение", amount: 20, percent: true },
    odor: { label: "Устранение запаха", amount: 3000 },
    steam: { label: "Обработка паром", amount: 2500 },
    antistatic: { label: "Антистатик", amount: 50, percent: true },
    dry: { label: "Сушка", amount: 3500 },
  },
  mattress: {
    heavy: { label: "Сильное загрязнение", amount: 20, percent: true },
    odor: { label: "Нейтрализация запахов", amount: 3000 },
    steam: { label: "Обработка паром", amount: 2500 },
    antistatic: { label: "Антистатик", amount: 50, percent: true },
    dry: { label: "Сушка", amount: 3500 },
    antibacterial: { label: "Антибактериальная обработка", amount: 3500 },
  },
  carpet: {
    heavy: { label: "Сильное загрязнение", amount: 20, percent: true },
    odor: { label: "Устранение запаха", amount: 3500 },
    antibacterial: { label: "Антибактериальная обработка", amount: 2500 },
  },
};
export const defaultTexts = {
  heroLine1: "Химчистка мебели,",
  heroLine2: "ковров и текстиля",
  heroAccent: "на дому",
  heroDescription:
    "Глубокая чистка, удаление пятен и запахов.\nБережный уход за тем, что делает дом уютным.",
  aboutTitle: "Любимые вещи заслуживают бережного ухода.",
  aboutDescription:
    "«МосХимчистка» — специализированный сервис выездной чистки. Работаем с тканями, коврами, натуральной кожей и деликатным текстилем.",
};
