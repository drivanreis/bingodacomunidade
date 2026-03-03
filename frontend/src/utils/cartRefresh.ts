export const CART_REFRESH_EVENT = 'bingo-cart-refresh';

export const notifyCartRefresh = () => {
  window.dispatchEvent(new Event(CART_REFRESH_EVENT));
};
