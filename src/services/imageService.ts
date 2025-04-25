import imageData from '../data/images.json';

export interface Image {
  id: string;
  title: string;
  src: string;
  ratio: string;
  category: string;
}

export const getAllImages = (): Image[] => {
  return imageData.images;
};

export const getImageById = (id: string): Image | undefined => {
  return imageData.images.find(image => image.id === id);
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