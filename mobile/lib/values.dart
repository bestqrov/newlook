/// Must match server/src/lib/common.js (the server validates against it).
const cities = ['الدار البيضاء', 'الرباط', 'مراكش', 'طنجة', 'فاس', 'أكادير', 'وجدة', 'تطوان', 'مدينة أخرى'];
const cityFr = {
  'الدار البيضاء': 'Casablanca', 'الرباط': 'Rabat', 'مراكش': 'Marrakech', 'طنجة': 'Tanger', 'فاس': 'Fès',
  'أكادير': 'Agadir', 'وجدة': 'Oujda', 'تطوان': 'Tétouan', 'مدينة أخرى': 'Autre ville',
};
String cityLabel(String city, String lang) => lang == 'fr' ? (cityFr[city] ?? city) : city;
