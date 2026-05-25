// Categories
export const categories = [
  'Pattu',
  'Bridal Collection',
  'Fancy pattu',
  'Fancy',
  'Semi Pattu',
  'Tusser',
  'Dress materials',
  'Cotton',
  'Kota',
  'Mangalagiri',
]

// Fabrics mapped to their categories
export const categoryFabricMap = {
  'Pattu': [
    'Mangalagiri pattu',
    'Gadwal pattu',
    'Kuppadam pattu',
    'Venkatagiri pattu',
    'Dharmavaram pattu',
    'Narayanapeta pattu',
    'Kanchi pattu',
    'Kalamkari pattu',
  ],
  'Bridal Collection': [
    'Mangalagiri pattu',
    'Gadwal pattu',
    'Kuppadam pattu',
    'Venkatagiri pattu',
    'Dharmavaram pattu',
    'Narayanapeta pattu',
    'Kanchi pattu',
    'Kalamkari pattu',
  ],
  'Fancy pattu': [
    'Kalamkari pattu fancy',
    'Green mango',
    'Ikkat pattu',
    'Kathan pattu',
    'Pattola',
  ],
  'Fancy': [
    'Chandheri silk',
    'Maheswari silk',
    'Russian silk',
    'Mona silk',
    'Semi patola fabric',
    'Tissue sarees',
    'Dola silk',
    'Bandhini sarees',
  ],
  'Semi Pattu': [
    'Semi Pattu',
    'Soft Pattu',
    'Semi Fancy Pattu',
  ],
  'Tusser': [
    'Semi tusser',
    'Khadhi tusser',
    'Bagalpuri tusser',
    'Pure tusser',
  ],
  'Dress materials': [
    'Mangalagiri',
    'Narayanapeta',
  ],
  'Cotton': [
    'Chandheri',
    'Maheswari',
    'Narayanapeta',
    'Chettinadu cotton',
    'Kota cotton',
    'Gadwal cotton',
  ],
  'Kota': [
    'Kota',
  ],
  'Mangalagiri': [
    'Mangalagiri Powerloom',
    'Mangalagiri Handloom',
  ],
}

// Get all unique fabrics (for backward compatibility / global list)
export const fabricTypes = Array.from(
  new Set(Object.values(categoryFabricMap).flat())
).sort()

// Helper function to get fabrics for a specific category
export function getFabricsForCategory(category) {
  return categoryFabricMap[category] || []
}
