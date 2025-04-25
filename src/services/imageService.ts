import imageData from '../../images.json';

export interface Image {
  id: string;
  title: string;
  src: string;
  ratio: string;
  category: string;
}

export const getAllImages = (): Image[] => {
  // Map the JSON data to our Image interface, correcting the paths
  return imageData.images.map((img, index) => ({
    id: String(index),
    title: img.name || `Image ${index + 1}`,
    // Use just the filename without the A/A/ path prefix
    src: `/${img.name}`,
    ratio: img.ratio || '2:3',
    category: 'Leonardo AI'
  }));
};

export const getImageById = (id: string): Image | undefined => {
  return getAllImages().find(image => image.id === id);
};

// export const getImagesByCategory = (category: string): Image[] => {
//   if (category === 'all') {
//     return imageData.images;
//   }
//   return imageData.images.filter(image => image.category === category);
// };

// export const getAllCategories = (): string[] => {
//   return imageData.categories;
// };