import { connectDB, disconnectDB } from './config/db';
import User, { UserDoc } from './models/User';
import Store from './models/Store';
import Category, { ICategory } from './models/Category';
import Product from './models/Product';
import { UserRole } from './types';

const RESET = process.argv.includes('--reset');

interface SeedProduct {
  name: string;
  brand: string;
  price: number;
  stock: number;
  featured?: boolean;
  discount?: number;
}

interface SeedCategory {
  name: string;
  description: string;
  products: SeedProduct[];
}

const seedUsers = [
  { name: 'Admin', email: 'admin@ecommerce.local', password: 'Admin12345', role: UserRole.ADMIN },
  { name: 'Seller Demo', email: 'seller@ecommerce.local', password: 'Seller12345', role: UserRole.SELLER },
  { name: 'Customer Demo', email: 'customer@ecommerce.local', password: 'Customer12345', role: UserRole.CUSTOMER },
  { name: 'TexnoMarket', email: 'seller2@ecommerce.local', password: 'Seller2345', role: UserRole.SELLER },
  { name: 'ModaStore', email: 'seller3@ecommerce.local', password: 'Seller3456', role: UserRole.SELLER },
  { name: 'DomUstasi', email: 'seller4@ecommerce.local', password: 'Seller4567', role: UserRole.SELLER },
];

const seedStores = [
  {
    ownerEmail: 'seller@ecommerce.local',
    name: 'Seller Demo Store',
    description: 'Elektronika, kiyim va sport mahsulotlari',
    phone: '+998900000000',
    address: 'Toshkent sh.',
  },
  {
    ownerEmail: 'seller2@ecommerce.local',
    name: 'TexnoMarket',
    description: 'Telefonlar, kompyuterlar va gadjetlar',
    phone: '+998901111111',
    address: 'Toshkent, Chilonzor t.',
  },
  {
    ownerEmail: 'seller3@ecommerce.local',
    name: 'ModaStore',
    description: 'Zamonaviy kiyim, poyabzal va aksessuarlar',
    phone: '+998902222222',
    address: 'Toshkent, Yunusobod t.',
  },
  {
    ownerEmail: 'seller4@ecommerce.local',
    name: 'DomUstasi',
    description: 'Uy jihozlari, sport va go\'zallik mahsulotlari',
    phone: '+998903333333',
    address: 'Samarqand sh.',
  },
];

const seedCategories: SeedCategory[] = [
  {
    name: 'Telefon va gadjetlar',
    description: 'Smartfonlar, quloqchinlar, smart-soatlar va boshqa gadjetlar',
    products: [
      { name: 'Smartfon Galaxy A55', brand: 'Samsung', price: 4500000, stock: 20, featured: true },
      { name: 'Smartfon iPhone 15', brand: 'Apple', price: 12900000, stock: 10, featured: true },
      { name: 'Smartfon Redmi Note 13', brand: 'Xiaomi', price: 2800000, stock: 25, discount: 12 },
      { name: 'Smartfon Poco X6 Pro', brand: 'Xiaomi', price: 3900000, stock: 12 },
      { name: 'Smartfon Tecno Spark 20', brand: 'Tecno', price: 2100000, stock: 18 },
      { name: 'Smartfon Infinix Note 40', brand: 'Infinix', price: 2600000, stock: 15 },
      { name: 'Simsiz quloqchin AirBuds 5', brand: 'Xiaomi', price: 450000, stock: 60, featured: true, discount: 15 },
      { name: 'Simsiz quloqchin Galaxy Buds FE', brand: 'Samsung', price: 850000, stock: 30 },
      { name: 'Simsiz quloqchin AirPods Pro 2', brand: 'Apple', price: 2400000, stock: 8 },
      { name: 'Smart-soat Watch S2', brand: 'Xiaomi', price: 1200000, stock: 22, featured: true },
      { name: 'Smart-soat Galaxy Watch 6', brand: 'Samsung', price: 3500000, stock: 9 },
      { name: 'Powerbank 20000 mAh', brand: 'Xiaomi', price: 350000, stock: 40, discount: 10 },
      { name: 'Powerbank 10000 mAh ultra-yupqa', brand: 'Baseus', price: 220000, stock: 45 },
      { name: 'Telefon uchun zaryadlovchi 65W', brand: 'Baseus', price: 180000, stock: 55 },
      { name: 'Simsiz zaryadlash paneli', brand: 'Samsung', price: 320000, stock: 28 },
      { name: 'Smartfon uchun himoya oynasi', brand: 'Generic', price: 45000, stock: 100 },
      { name: 'Silikon telefon qopqog\'i', brand: 'Generic', price: 35000, stock: 90 },
      { name: 'Bluetooth dinamik JBL Go 3', brand: 'JBL', price: 650000, stock: 24, featured: true, discount: 8 },
      { name: 'Bluetooth dinamik JBL Charge 5', brand: 'JBL', price: 1800000, stock: 10 },
      { name: 'Selfi tayoqchasi 1.4m', brand: 'Generic', price: 95000, stock: 35 },
      { name: 'Smart bilaguzuk Mi Band 9', brand: 'Xiaomi', price: 450000, stock: 30 },
      { name: 'Kamera qo\'l uchi ushlagichi', brand: 'Generic', price: 55000, stock: 70 },
      { name: 'USB-C hub 7-in-1', brand: 'Baseus', price: 380000, stock: 16 },
      { name: 'Tashqi SSD 1TB', brand: 'Samsung', price: 1300000, stock: 7 },
      { name: 'Fleshka 128GB', brand: 'SanDisk', price: 150000, stock: 40 },
    ],
  },
  {
    name: 'Noutbuk va kompyuter',
    description: 'Noutbuklar, monitorlar va kompyuter aksessuarlari',
    products: [
      { name: 'Noutbuk IdeaPad 5 15.6"', brand: 'Lenovo', price: 7200000, stock: 8, featured: true },
      { name: 'Noutbuk MacBook Air M2', brand: 'Apple', price: 14800000, stock: 5, featured: true },
      { name: 'Noutbuk ThinkPad E14', brand: 'Lenovo', price: 9800000, stock: 6 },
      { name: 'Noutbuk VivoBook 15', brand: 'Asus', price: 6500000, stock: 9, discount: 7 },
      { name: 'Noutbuk TUF Gaming F15', brand: 'Asus', price: 11500000, stock: 4 },
      { name: 'Noutbuk Aspire 5', brand: 'Acer', price: 5900000, stock: 11 },
      { name: 'Noutbuk Pavilion 14', brand: 'HP', price: 8200000, stock: 7 },
      { name: 'Monitor 24" FullHD', brand: 'LG', price: 1900000, stock: 14, featured: true },
      { name: 'Monitor 27" 2K', brand: 'Dell', price: 3200000, stock: 6 },
      { name: 'Monitor 23.8" IPS', brand: 'Samsung', price: 1700000, stock: 12 },
      { name: 'Simsiz sichqoncha MX Master 3S', brand: 'Logitech', price: 950000, stock: 20 },
      { name: 'Simsiz sichqoncha M185', brand: 'Logitech', price: 180000, stock: 40, discount: 5 },
      { name: 'Membran klaviatura K120', brand: 'Logitech', price: 160000, stock: 35 },
      { name: 'Mexanik klaviatura Redragon K552', brand: 'Redragon', price: 550000, stock: 18 },
      { name: 'Gaming sichqoncha G102', brand: 'Logitech', price: 320000, stock: 22 },
      { name: 'Veb-kamera C920', brand: 'Logitech', price: 750000, stock: 10 },
      { name: 'Wi-Fi router Archer AX23', brand: 'TP-Link', price: 850000, stock: 15, featured: true },
      { name: 'SSD 500GB NVMe', brand: 'Kingston', price: 650000, stock: 25 },
      { name: 'RAM 8GB DDR4', brand: 'Kingston', price: 380000, stock: 30 },
      { name: 'UPS 1000VA', brand: 'PowerCom', price: 1200000, stock: 9 },
    ],
  },
  {
    name: 'Erkaklar kiyimi',
    description: 'Ko\'ylaklar, shimlar, kurtkalar va aksessuarlar',
    products: [
      { name: 'Futbolka klassik paxta', brand: 'Adidas', price: 120000, stock: 80, featured: true },
      { name: 'Futbolka oversize', brand: 'Nike', price: 150000, stock: 70 },
      { name: 'Ko\'ylak ofitsiant/ish', brand: 'Koton', price: 280000, stock: 35 },
      { name: 'Ko\'ylak flanelli', brand: 'Koton', price: 320000, stock: 28 },
      { name: 'Shim chinlar', brand: 'Levis', price: 450000, stock: 30, featured: true, discount: 10 },
      { name: 'Jinsilar slim fit', brand: 'Levis', price: 520000, stock: 26 },
      { name: 'Sport shim', brand: 'Puma', price: 280000, stock: 40 },
      { name: 'Kurtka demi-season', brand: 'Zara', price: 650000, stock: 15 },
      { name: 'Sport kurtka', brand: 'Nike', price: 550000, stock: 22, featured: true },
      { name: 'Palto klassik', brand: 'Hugo Boss', price: 1800000, stock: 5 },
      { name: 'Kardigan trikotaj', brand: 'Koton', price: 350000, stock: 18 },
      { name: 'Jemver/ko\'fta', brand: 'Mango', price: 290000, stock: 24 },
      { name: 'Kamar charm', brand: 'Saks', price: 180000, stock: 50, discount: 20 },
      { name: 'Galstuk ipak', brand: 'Saks', price: 120000, stock: 45 },
      { name: 'Paypoqlar 5 juftlik', brand: 'H&M', price: 75000, stock: 100 },
      { name: 'Ichki kiyim 3 donalik', brand: 'H&M', price: 95000, stock: 90 },
      { name: 'Sharf — qishki', brand: 'Uniqlo', price: 140000, stock: 32 },
      { name: 'Qo\'lqop teri', brand: 'Uniqlo', price: 160000, stock: 25 },
      { name: 'Qalpoq kepka', brand: 'New Era', price: 190000, stock: 38 },
      { name: 'Plyaj shim-short', brand: 'Puma', price: 160000, stock: 33 },
      { name: 'Bruster/ko\'ylak yozgi', brand: 'Koton', price: 240000, stock: 27 },
      { name: 'Xudi', brand: 'Nike', price: 420000, stock: 20, featured: true },
      { name: 'Spor kostyum (2 dona)', brand: 'Adidas', price: 720000, stock: 12, discount: 15 },
      { name: 'Dembel/palto ustki', brand: 'Bershka', price: 950000, stock: 7 },
      { name: 'Jilet/trikotaj', brand: 'Mango', price: 310000, stock: 14 },
    ],
  },
  {
    name: 'Ayollar kiyimi',
    description: 'Liboslar, ko\'ftalar, yubkalar va aksessuarlar',
    products: [
      { name: 'Libos oqshom uzun', brand: 'Zara', price: 750000, stock: 10, featured: true },
      { name: 'Libos ofis', brand: 'Mango', price: 580000, stock: 16 },
      { name: 'Libos yozgi chintz', brand: 'Bershka', price: 320000, stock: 25, discount: 15 },
      { name: 'Ko\'fta bluzka', brand: 'Zara', price: 280000, stock: 30 },
      { name: 'Ko\'fta trikotaj', brand: 'Mango', price: 260000, stock: 28 },
      { name: 'Yubka qalam', brand: 'Zara', price: 340000, stock: 18 },
      { name: 'Yubka pleyd', brand: 'Bershka', price: 300000, stock: 20 },
      { name: 'Shim ayollar skinny', brand: 'H&M', price: 350000, stock: 24 },
      { name: 'Jinsi mom slim', brand: 'Levis', price: 560000, stock: 14 },
      { name: 'Palto ayollar uzun', brand: 'Mango', price: 1600000, stock: 6 },
      { name: 'Kurtka jeans', brand: 'Zara', price: 620000, stock: 12 },
      { name: 'Spor kostyum ayollar', brand: 'Nike', price: 780000, stock: 10, featured: true },
      { name: 'Hudi ayollar', brand: 'Adidas', price: 400000, stock: 22 },
      { name: 'Jemver oversize', brand: 'Bershka', price: 330000, stock: 19 },
      { name: 'Platya kombinezon', brand: 'Mango', price: 480000, stock: 15 },
      { name: 'Beach-kostyum (2 dona)', brand: 'H&M', price: 250000, stock: 26 },
      { name: 'Tanga/yo\'l-yo\'l trikotaj', brand: 'Uniqlo', price: 220000, stock: 34 },
      { name: 'Sharf ipak', brand: 'Zara', price: 190000, stock: 30 },
      { name: 'Sumka charm ekz', brand: 'Zara', price: 450000, stock: 20, featured: true },
      { name: 'Rivzak moda', brand: 'H&M', price: 280000, stock: 25 },
      { name: 'Belt-tasma ayollar', brand: 'Saks', price: 150000, stock: 40 },
      { name: 'Ziraklar kumush', brand: 'Saks', price: 320000, stock: 18 },
      { name: 'Mujina teshik', brand: 'H&M', price: 120000, stock: 44 },
      { name: 'Uy kiyimi piyama', brand: 'Uniqlo', price: 210000, stock: 23 },
      { name: 'Paltolar charm jaketi', brand: 'Zara', price: 980000, stock: 8, discount: 10 },
    ],
  },
  {
    name: 'Poyabzal',
    description: 'Krossovkalar, tuflilar, etiklar va sandallar',
    products: [
      { name: 'Krossovka Air Max', brand: 'Nike', price: 1600000, stock: 12, featured: true },
      { name: 'Krossovka Speedflow', brand: 'Adidas', price: 950000, stock: 18 },
      { name: 'Krossovka yugurish', brand: 'New Balance', price: 1200000, stock: 10, discount: 15 },
      { name: 'Krossovka erkaklar klassik', brand: 'Puma', price: 650000, stock: 20 },
      { name: 'Krossovka ayollar', brand: 'Reebok', price: 700000, stock: 15 },
      { name: 'Tufli erkaklar charm', brand: 'Geox', price: 850000, stock: 14 },
      { name: 'Tufli ayollar baland', brand: 'Zara', price: 580000, stock: 12 },
      { name: 'Tufli ayollar qulay', brand: 'Clarks', price: 640000, stock: 16 },
      { name: 'Etik qishki erkaklar', brand: 'Columbia', price: 1100000, stock: 9 },
      { name: 'Etik ayollar qishki', brand: 'Camel', price: 980000, stock: 11 },
      { name: 'Botinka erkaklar', brand: 'Timberland', price: 1250000, stock: 7 },
      { name: 'Mokasinlar', brand: 'Geox', price: 720000, stock: 13 },
      { name: 'Sandallar erkaklar', brand: 'Teva', price: 450000, stock: 21 },
      { name: 'Sandallar ayollar', brand: 'Birkenstock', price: 780000, stock: 8 },
      { name: 'Krossovka bolalar', brand: 'Nike', price: 520000, stock: 17 },
      { name: 'Sport tufli to\'piq', brand: 'Nike', price: 1100000, stock: 10, featured: true },
      { name: 'Yugurish poyabzali PowerRun', brand: 'Asics', price: 1350000, stock: 6 },
      { name: 'Slip-on ayollar', brand: 'Vans', price: 590000, stock: 14 },
      { name: 'Charme ipli sandalet', brand: 'Zara', price: 420000, stock: 22, discount: 12 },
      { name: 'Qishki ugg (muqovasiz)', brand: 'Ugg', price: 1500000, stock: 5 },
    ],
  },
  {
    name: 'Sport anjomlari',
    description: 'Gantellar, velosipedlar, fitnes va sport aksessuarlari',
    products: [
      { name: 'Gantel 10 kg', brand: 'FitnessPro', price: 280000, stock: 30, featured: true },
      { name: 'Gantel to\'plami 20 kg', brand: 'FitnessPro', price: 750000, stock: 12 },
      { name: 'Skakalka tezlik', brand: 'Adidas', price: 95000, stock: 45 },
      { name: 'Yoga gilami 6mm', brand: 'Reebok', price: 180000, stock: 40 },
      { name: 'Fitnes matras', brand: 'Reebok', price: 220000, stock: 35 },
      { name: 'Velosiped gorniy 26"', brand: 'Stels', price: 3200000, stock: 6, featured: true },
      { name: 'Velosiped shaxar 28"', brand: 'Forward', price: 2800000, stock: 8 },
      { name: 'Samosvyat (uchqun) 3 kg', brand: 'Kettler', price: 95000, stock: 50 },
      { name: 'Ekspander taqma', brand: 'Decathlon', price: 60000, stock: 60 },
      { name: 'Futbol to\'pi 5', brand: 'Adidas', price: 350000, stock: 25 },
      { name: 'Basketbol to\'pi', brand: 'Spalding', price: 290000, stock: 18 },
      { name: 'Suzish ko\'zoynagi', brand: 'Speedo', price: 120000, stock: 30 },
      { name: 'Suzish shapkasi', brand: 'Speedo', price: 45000, stock: 44 },
      { name: 'Tennis raketkasi', brand: 'Wilson', price: 850000, stock: 10 },
      { name: 'Badminton to\'plami', brand: 'Yonex', price: 250000, stock: 15 },
      { name: 'Shtanga 50 kg', brand: 'FitnessPro', price: 2800000, stock: 4 },
      { name: 'Turnik devorga', brand: 'FitnessPro', price: 380000, stock: 13 },
      { name: 'Boks qo\'lqoplari 12 oz', brand: 'Everlast', price: 420000, stock: 20, discount: 10 },
      { name: 'Roliklar inline', brand: 'Roces', price: 680000, stock: 9 },
      { name: 'Skuter elektrik', brand: 'Xiaomi', price: 4500000, stock: 7, featured: true },
    ],
  },
  {
    name: 'Go\'zallik',
    description: 'Parfyumeriya, kosmetika va parvarish vositalari',
    products: [
      { name: 'Parfyum Eau de Parfum 100ml', brand: 'Versace', price: 1400000, stock: 15, featured: true },
      { name: 'Parfyum ayollar 50ml', brand: 'Chanel', price: 1900000, stock: 8 },
      { name: 'Parfyum erkaklar 100ml', brand: 'Armani', price: 1600000, stock: 10 },
      { name: 'Namlovchi krem 50ml', brand: 'Nivea', price: 95000, stock: 60 },
      { name: 'Tonal krem', brand: 'Loreal', price: 220000, stock: 35 },
      { name: 'Tosh-po\'mar soch uchun 400ml', brand: 'Pantene', price: 85000, stock: 70 },
      { name: 'Soch konditsioneri 400ml', brand: 'Pantene', price: 85000, stock: 65 },
      { name: 'Yuz yuvish geli', brand: 'Garnier', price: 75000, stock: 55 },
      { name: 'Lab bo\'yog\'i', brand: 'Maybelline', price: 120000, stock: 40 },
      { name: 'Tush va kirpik uchun', brand: 'Maybelline', price: 95000, stock: 38 },
      { name: 'Set kosmetik tup', brand: 'MAC', price: 850000, stock: 12, featured: true },
      { name: 'Tish pastasi 100ml', brand: 'Colgate', price: 45000, stock: 100 },
      { name: 'Soqol uchun moy', brand: 'Boss', price: 110000, stock: 30 },
      { name: 'Elektro soch qirqadigan', brand: 'Philips', price: 850000, stock: 14, discount: 15 },
      { name: 'Fen soch quritgich', brand: 'Rowenta', price: 450000, stock: 20 },
      { name: 'Elektr tish cho\'tka', brand: 'Oral-B', price: 350000, stock: 18 },
      { name: 'Duvet (tashqi parfyum) 30ml', brand: 'Boss', price: 550000, stock: 16 },
      { name: 'Manikyur set', brand: 'Generic', price: 140000, stock: 45 },
      { name: 'Qosh pyanyu (serum)', brand: 'Loreal', price: 180000, stock: 25 },
      { name: 'Spa to\'plam ko\'pik', brand: 'Nivea', price: 260000, stock: 20 },
    ],
  },
  {
    name: 'Uy jihozlari',
    description: 'Oshxona buyumlari, tozalagichlar va uy-ro\'zg\'or texnikasi',
    products: [
      { name: 'Changyutgich siklons', brand: 'Samsung', price: 1800000, stock: 10, featured: true },
      { name: 'Robot-changyutgich', brand: 'Xiaomi', price: 2500000, stock: 8, featured: true },
      { name: 'Kofe qaynatgich kapsul', brand: 'Nespresso', price: 1900000, stock: 9 },
      { name: 'Choynak elektr 1.7L', brand: 'Tefal', price: 450000, stock: 30, discount: 10 },
      { name: 'Dazmol bug\'li', brand: 'Philips', price: 550000, stock: 25 },
      { name: 'Kir yuvish mashinasi 7kg', brand: 'LG', price: 5500000, stock: 6 },
      { name: 'Muzlatgich 350L', brand: 'Samsung', price: 6800000, stock: 5 },
      { name: 'Mikrotolqin pech', brand: 'Panasonic', price: 1500000, stock: 9 },
      { name: 'Idishlar set 24 dona', brand: 'Luminarc', price: 850000, stock: 12 },
      { name: 'Tovoq 3 dona', brand: 'Tefal', price: 650000, stock: 14 },
      { name: 'Qozon 10L', brand: 'Sufra', price: 320000, stock: 20 },
      { name: 'Toza (katta) taom tayyorlovchi', brand: 'Moulinex', price: 950000, stock: 7 },
      { name: 'Blender stakan 1.5L', brand: 'KitchenAid', price: 750000, stock: 13 },
      { name: 'Suv filtroi dispenser', brand: 'Aquaphor', price: 850000, stock: 15 },
      { name: 'Oshxona tarozi', brand: 'Tefal', price: 180000, stock: 22 },
      { name: 'Tozalagich shisha (squeegee)', brand: 'Generic', price: 55000, stock: 40 },
      { name: 'Yotgan choyshab to\'plami', brand: 'Texline', price: 450000, stock: 25, featured: true },
      { name: 'Ko\'rpacha qishki', brand: 'Texline', price: 650000, stock: 10 },
      { name: 'Ventilyator stol usti', brand: 'Xiaomi', price: 380000, stock: 18 },
      { name: 'Ionizator / havo tozalash', brand: 'Philips', price: 2400000, stock: 6 },
    ],
  },
  {
    name: 'Kitoblar',
    description: 'Badiiy adabiyot, biznes kitoblar va darsliklar',
    products: [
      { name: 'Atom odatlari', brand: 'Asaxiy', price: 90000, stock: 50, featured: true },
      { name: 'Boy Ota Boy Ota', brand: 'Asaxiy', price: 85000, stock: 45 },
      { name: 'Dengiz qasam', brand: 'Asaxiy', price: 75000, stock: 60 },
      { name: 'Yuz yillik yolg\'izlik', brand: 'ZiyoNashr', price: 65000, stock: 35 },
      { name: 'Mahbuba', brand: 'ZiyoNashr', price: 72000, stock: 40 },
      { name: 'Odam izlab', brand: 'ZiyoNashr', price: 68000, stock: 38 },
      { name: 'Kecha va kunduz', brand: 'Asaxiy', price: 78000, stock: 30 },
      { name: 'Biznes 101', brand: 'Asaxiy', price: 120000, stock: 25, discount: 10 },
      { name: 'Qora lochin', brand: 'ZiyoNashr', price: 95000, stock: 20 },
      { name: 'Vohadagi olma', brand: 'Asaxiy', price: 69000, stock: 33 },
      { name: 'Sibir deklaratsiyasi', brand: 'Asaxiy', price: 82000, stock: 22 },
      { name: 'Dunyoning ishlari', brand: 'ZiyoNashr', price: 88000, stock: 26 },
      { name: 'Chet tillar darsligi (inglizcha)', brand: 'Cambridge', price: 150000, stock: 30 },
      { name: 'Matematika 5-sinf', brand: 'Taqdim', price: 45000, stock: 55 },
      { name: 'Bolalar ensiklopediyasi', brand: 'Usborne', price: 180000, stock: 18, featured: true },
    ],
  },
  {
    name: 'Bolalar o\'yinchoqlari',
    description: 'Konstruktorlar, qo\'g\'irchoqlar va rivojlantiruvchi o\'yinlar',
    products: [
      { name: 'Konstruktor klassik 500 detal', brand: 'Lego', price: 850000, stock: 15, featured: true },
      { name: 'Konstruktor maydon 300 detal', brand: 'Lego', price: 550000, stock: 20 },
      { name: 'Qo\'g\'irchoq 30 sm', brand: 'Barbie', price: 350000, stock: 25 },
      { name: 'Mashina radioupravleniyami', brand: 'HPI', price: 450000, stock: 18 },
      { name: 'Puzzles 1000 dona', brand: 'Educa', price: 180000, stock: 30 },
      { name: 'Razvivayushiy kovrik', brand: 'Chicco', price: 420000, stock: 12 },
      { name: 'Yumshoq o\'yinchoq ayiqcha', brand: 'Gund', price: 220000, stock: 40 },
      { name: 'Quymoq (musiqali)', brand: 'VTech', price: 280000, stock: 22 },
      { name: 'Stollar va stullar to\'plami', brand: 'Ikea', price: 650000, stock: 10 },
      { name: 'Yugurish velosiped 3 g\'ildirak', brand: 'Stels', price: 550000, stock: 14, discount: 12 },
    ],
  },
];

const DESCRIPTIONS: Record<string, string> = {
  'Telefon va gadjetlar': 'Zamonaviy texnologiya va ishonchli sifat. Uz xizmat muddati va kafolat bilan.',
  'Noutbuk va kompyuter': 'Samarali ishlash uchun professional jihozlar. Kafolat va qulay narx.',
  'Erkaklar kiyimi': 'Kundalik va ofis uchun uslubiy erkaklar kiyimlari. Sifatli mato, qulay kiyim.',
  'Ayollar kiyimi': 'Modali va qulay ayollar kiyimlari. Yangi kolleksiya har mavsumda.',
  'Poyabzal': 'Har qanday ob-havo va holat uchun qulay poyabzal. Sifatli charm va to\'qimachilik.',
  'Sport anjomlari': 'Faol hayot tarzi uchun sport anjomlari va fitnes uskunalari.',
  'Go\'zallik': 'Go\'zallik va parvarish uchun professional kosmetika. Tasdiqlangan brendlar.',
  'Uy jihozlari': 'Uyingiz uchun qulay va zamonaviy jihozlar. Sifat va qulay narx kafolati.',
  'Kitoblar': 'Eng yaxshi adabiyotlar — badiiy, biznes va bolalar uchun kitoblar.',
  'Bolalar o\'yinchoqlari': 'Xavfsiz va rivojlantiruvchi o\'yinchoqlar bolalar uchun.',
};

const QUALITY_TERMS = [
  'Sertifikatlangan', 'Yuqori sifat', 'Ishonchli', 'Zamonaviy dizayn', 'Kafolat bilan',
];

function buildDescription(categoryName: string, name: string, index: number): string {
  const base = DESCRIPTIONS[categoryName] ?? 'Sifatli mahsulot.';
  const term = QUALITY_TERMS[index % QUALITY_TERMS.length];
  return `${name}. ${term}. ${base}`;
}

async function seed(): Promise<void> {
  await connectDB();

  if (RESET) {
    await Product.deleteMany({});
    await Store.deleteMany({});
    await Category.deleteMany({});
    await User.deleteMany({ role: { $ne: UserRole.ADMIN } });
    console.log('[seed] RESET: eski ma\'lumotlar tozalandi');
  }

  const users: Record<string, UserDoc> = {};
  for (const data of seedUsers) {
    const existing = await User.findOne({ email: data.email });
    if (existing) {
      users[data.email] = existing;
      console.log(`[seed] Mavjud user: ${data.email}`);
      continue;
    }
    const user = await User.create({ ...data, isVerified: true, isApproved: true });
    users[data.email] = user;
    console.log(`[seed] User yaratildi: ${data.email} (${data.role})`);
  }

  for (const data of seedStores) {
    const owner = users[data.ownerEmail];
    if (!owner) continue;

    const existing = await Store.findOne({ owner: owner._id });
    if (existing) {
      console.log(`[seed] Mavjud do\'kon: ${data.name}`);
      continue;
    }

    const store = await Store.create({
      name: data.name,
      description: data.description,
      phone: data.phone,
      address: data.address,
      owner: owner._id,
    });
    await User.findByIdAndUpdate(owner._id, { storeId: store._id });
    console.log(`[seed] Do\'kon yaratildi: ${store.name} (/${store.slug})`);
  }

  const categories: Record<string, ICategory> = {};
  for (const data of seedCategories) {
    const existing = await Category.findOne({ name: data.name });
    if (existing) {
      categories[data.name] = existing;
      console.log(`[seed] Mavjud kategoriya: ${data.name}`);
      continue;
    }
    const cat = await Category.create({ name: data.name, description: data.description });
    categories[data.name] = cat;
    console.log(`[seed] Kategoriya yaratildi: ${data.name}`);
  }

  const productCount = await Product.countDocuments();
  if (productCount > 0) {
    console.log(`[seed] Mahsulotlar allaqachon mavjud (${productCount}). --reset bilan qayta to\'ldiring.`);
  } else {
    const sellers = seedUsers
      .filter((u) => u.role === UserRole.SELLER)
      .map((u) => users[u.email])
      .filter(Boolean) as UserDoc[];

    if (sellers.length === 0) {
      console.error('[seed] Seller topilmadi — mahsulotlar yaratilmadi');
    } else {
      const tasks: Promise<unknown>[] = [];
      let sellerIdx = 0;
      for (const cat of seedCategories) {
        const catDoc = categories[cat.name];
        if (!catDoc) continue;

        cat.products.forEach((p, i) => {
          const seller = sellers[sellerIdx % sellers.length];
          sellerIdx += 1;

          const seedBase = `${p.name}-${cat.name}-${i}`;
          const images = [0, 1, 2].map(
            (n) => `https://picsum.photos/seed/${encodeURIComponent(seedBase)}-${n}/600/600`
          );
          const compareAtPrice =
            p.discount !== undefined ? Math.round(p.price * (1 + p.discount / 100)) : undefined;

          tasks.push(
            Product.create({
              seller: seller._id,
              category: catDoc._id,
              name: p.name,
              description: buildDescription(cat.name, p.name, i),
              brand: p.brand,
              price: p.price,
              compareAtPrice,
              stock: p.stock,
              sku: `${p.brand.toUpperCase().slice(0, 4)}-${(i + 1) * 17}`,
              images,
              isActive: true,
              isFeatured: p.featured ?? false,
              averageRating: 0,
              ratingCount: 0,
            })
          );
        });
      }

      await Promise.all(tasks);
      const created = await Product.countDocuments();
      console.log(`[seed] Mahsulotlar yaratildi: ${created} ta`);
    }
  }

  console.log('\n[seed] Tayyor! Kirish uchun:');
  for (const u of seedUsers) {
    console.log(`  ${u.role.padEnd(8)} | ${u.email} | ${u.password}`);
  }

  await disconnectDB();
  process.exit(0);
}

seed().catch((err) => {
  console.error('[seed] Xatolik:', err);
  process.exit(1);
});
