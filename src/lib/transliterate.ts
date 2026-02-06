// English to Arabic transliteration mapping
const transliterationMap: Record<string, string> = {
  'a': 'ا',
  'b': 'ب',
  'c': 'ك',
  'd': 'د',
  'e': 'ي',
  'f': 'ف',
  'g': 'غ',
  'h': 'ه',
  'i': 'ي',
  'j': 'ج',
  'k': 'ك',
  'l': 'ل',
  'm': 'م',
  'n': 'ن',
  'o': 'و',
  'p': 'ب',
  'q': 'ق',
  'r': 'ر',
  's': 'س',
  't': 'ت',
  'u': 'و',
  'v': 'ف',
  'w': 'و',
  'x': 'كس',
  'y': 'ي',
  'z': 'ز',
  'sh': 'ش',
  'th': 'ث',
  'kh': 'خ',
  'dh': 'ذ',
  'gh': 'غ',
  'aa': 'ا',
  'ee': 'ي',
  'oo': 'و',
  'ou': 'و',
  'ai': 'اي',
  'ei': 'اي',
  'au': 'او',
  'aw': 'او',
  'ah': 'ة',
  'ahmed': 'احمد',
  'mohammed': 'محمد',
  'mohammad': 'محمد',
  'muhammad': 'محمد',
  'ali': 'علي',
  'omar': 'عمر',
  'khalid': 'خالد',
  'khaled': 'خالد',
  'abdullah': 'عبدالله',
  'abdulrahman': 'عبدالرحمن',
  'abdulaziz': 'عبدالعزيز',
  'saleh': 'صالح',
  'salah': 'صلاح',
  'hassan': 'حسن',
  'hussein': 'حسين',
  'ibrahim': 'ابراهيم',
  'ismail': 'اسماعيل',
  'youssef': 'يوسف',
  'yousef': 'يوسف',
  'yusuf': 'يوسف',
  'saeed': 'سعيد',
  'said': 'سعيد',
  'nasser': 'ناصر',
  'sultan': 'سلطان',
  'hamad': 'حمد',
  'hamdan': 'حمدان',
  'rashid': 'راشد',
  'majid': 'ماجد',
  'faisal': 'فيصل',
  'fahad': 'فهد',
  'turki': 'تركي',
  'saud': 'سعود',
  'bandar': 'بندر',
  'nawaf': 'نواف',
  'waleed': 'وليد',
  'walid': 'وليد',
  'tariq': 'طارق',
  'talal': 'طلال',
  'badr': 'بدر',
  'zayed': 'زايد',
  'mansour': 'منصور',
  'mansoor': 'منصور',
  'saif': 'سيف',
  'rashed': 'راشد',
  'jassim': 'جاسم',
  'jasem': 'جاسم',
  'mubarak': 'مبارك',
  'nayef': 'نايف',
  'naif': 'نايف',
  'adel': 'عادل',
  'adil': 'عادل',
  'hamed': 'حامد',
  'jameel': 'جميل',
  'jamal': 'جمال',
  'karim': 'كريم',
  'kareem': 'كريم',
  'ayman': 'ايمن',
  'amin': 'امين',
  'ameen': 'امين',
  'akram': 'اكرم',
  'anwar': 'انور',
  'ashraf': 'اشرف',
  'basem': 'باسم',
  'bassam': 'بسام',
  'bilal': 'بلال',
  'emad': 'عماد',
  'essam': 'عصام',
  'eyad': 'اياد',
  'hani': 'هاني',
  'hazem': 'حازم',
  'hesham': 'هشام',
  'hosam': 'حسام',
  'imad': 'عماد',
  'issam': 'عصام',
  'jihad': 'جهاد',
  'khaldoun': 'خلدون',
  'maher': 'ماهر',
  'mahmoud': 'محمود',
  'marwan': 'مروان',
  'mazen': 'مازن',
  'mohannad': 'مهند',
  'moustafa': 'مصطفى',
  'mustafa': 'مصطفى',
  'nabil': 'نبيل',
  'nadim': 'نديم',
  'nader': 'نادر',
  'nasir': 'ناصر',
  'osama': 'اسامة',
  'rami': 'رامي',
  'ramzi': 'رمزي',
  'reda': 'رضا',
  'rida': 'رضا',
  'samer': 'سامر',
  'sami': 'سامي',
  'samir': 'سمير',
  'shadi': 'شادي',
  'sherif': 'شريف',
  'tarek': 'طارق',
  'tamer': 'تامر',
  'wael': 'وائل',
  'wassim': 'وسيم',
  'yasser': 'ياسر',
  'yasir': 'ياسر',
  'zaher': 'زاهر',
  'zakaria': 'زكريا',
  'ziad': 'زياد',
  // Common compound names
  'abdul': 'عبد',
  'abu': 'ابو',
  'bin': 'بن',
  'al': 'ال',
};

export function transliterateToArabic(englishName: string): string {
  if (!englishName) return '';
  
  const words = englishName.toLowerCase().trim().split(/\s+/);
  const arabicWords: string[] = [];
  
  for (const word of words) {
    // Check if the whole word exists in the map
    if (transliterationMap[word]) {
      arabicWords.push(transliterationMap[word]);
      continue;
    }
    
    // Otherwise, transliterate character by character
    let arabicWord = '';
    let i = 0;
    
    while (i < word.length) {
      // Try two-character combinations first
      if (i < word.length - 1) {
        const twoChar = word.substring(i, i + 2);
        if (transliterationMap[twoChar]) {
          arabicWord += transliterationMap[twoChar];
          i += 2;
          continue;
        }
      }
      
      // Single character
      const char = word[i];
      if (transliterationMap[char]) {
        arabicWord += transliterationMap[char];
      }
      i++;
    }
    
    arabicWords.push(arabicWord);
  }
  
  return arabicWords.join(' ');
}
