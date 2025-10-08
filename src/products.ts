export interface Product {
  name: string;
  price: number; // UZSda
  image: string; // URL
  composition: string;
}

export const products: { [category: string]: Product[] } = {
  ichimliklar: [
    { name: 'Coca-Cola', price: 8000, image: 'https://i.imgur.com/7bX5j2y.jpg', composition: 'Gazlangan suv, shakar, kofein' },
    { name: 'Pepsi', price: 7000, image: 'https://i.imgur.com/8z3kL9Q.jpg', composition: 'Gazlangan suv, shakar, aroma' },
  ],
  yeguliklar: [
    { name: 'Burger', price: 25000, image: 'https://i.imgur.com/0y8fK2B.jpg', composition: 'Go\'sht, non, salat, pomidor' },
    { name: 'Pizza', price: 40000, image: 'https://i.imgur.com/5z6X2kD.jpg', composition: 'Xamir, pishloq, sosiska, pomidor sousi' },
  ],
  shirinliklar: [
    { name: 'Donut', price: 10000, image: 'https://i.imgur.com/9x3L2fZ.jpg', composition: 'Xamir, shakar, shokolad' },
    { name: 'Cake', price: 15000, image: 'https://i.imgur.com/2m7X9jW.jpg', composition: 'Un, tuxum, shakar, krem' },
  ],
};