import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { CART_REFRESH_EVENT } from '../utils/cartRefresh';

interface CartItem {
  id: string;
  game_id: string;
  numbers: string[];
  status: string;
  purchase_date: string;
}

interface FloatingCartProps {
  onPaymentSuccess?: () => void | Promise<void>;
}

const FloatingCart: React.FC<FloatingCartProps> = ({ onPaymentSuccess }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [cartLoading, setCartLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [visible, setVisible] = useState(true);

  const loadCartItems = async () => {
    try {
      setCartLoading(true);
      const response = await api.get('/users/me/cards');
      const openItems = (response.data as CartItem[])
        .filter((item) => item.status === 'no_carrinho')
        .sort((a, b) => new Date(b.purchase_date).getTime() - new Date(a.purchase_date).getTime());

      setCartItems(openItems);
      setVisible(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      if (error?.response?.status === 403) {
        setVisible(false);
      }
      setCartItems([]);
    } finally {
      setCartLoading(false);
    }
  };

  useEffect(() => {
    loadCartItems();

    const handleRefresh = () => {
      void loadCartItems();
    };

    const handleFocus = () => {
      void loadCartItems();
    };

    window.addEventListener(CART_REFRESH_EVENT, handleRefresh);
    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener(CART_REFRESH_EVENT, handleRefresh);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const runPaymentSuccess = async () => {
    if (onPaymentSuccess) {
      await onPaymentSuccess();
    }
    await loadCartItems();
  };

  const handlePayCartItem = async (item: CartItem) => {
    try {
      setCheckoutLoading(true);
      await api.post(`/games/${item.game_id}/cards/${item.id}/pay`);
      await runPaymentSuccess();
      alert('Pagamento confirmado com sucesso!');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      alert(error?.message || error.response?.data?.detail?.leigo || error.response?.data?.detail || 'Erro ao pagar cartela');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handlePayAllCart = async () => {
    if (cartItems.length === 0) {
      return;
    }

    try {
      setCheckoutLoading(true);
      for (const item of cartItems) {
        await api.post(`/games/${item.game_id}/cards/${item.id}/pay`);
      }
      await runPaymentSuccess();
      alert('Todas as cartelas do carrinho foram pagas!');
      setCartOpen(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      alert(error?.message || error.response?.data?.detail?.leigo || error.response?.data?.detail || 'Erro ao pagar carrinho');
      await loadCartItems();
    } finally {
      setCheckoutLoading(false);
    }
  };

  if (!visible) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        style={styles.floatingCartButton}
        onClick={() => setCartOpen(true)}
        aria-label="Abrir carrinho"
      >
        🛒
        {cartItems.length > 0 && <span style={styles.floatingCartBadge}>{cartItems.length}</span>}
      </button>

      {cartOpen && (
        <div style={styles.cartOverlay} onClick={() => setCartOpen(false)}>
          <aside style={styles.cartDrawer} onClick={(event) => event.stopPropagation()}>
            <div style={styles.cartHeader}>
              <h3 style={styles.cartTitle}>🛒 Carrinho de Cartelas</h3>
              <button style={styles.cartCloseButton} type="button" onClick={() => setCartOpen(false)}>
                ✕
              </button>
            </div>

            {cartLoading ? (
              <p style={styles.cartEmptyText}>Carregando carrinho...</p>
            ) : cartItems.length === 0 ? (
              <p style={styles.cartEmptyText}>Seu carrinho está vazio.</p>
            ) : (
              <>
                <div style={styles.cartItemsList}>
                  {cartItems.map((item) => (
                    <div key={item.id} style={styles.cartItemCard}>
                      <div style={styles.cartItemTop}>
                        <strong>Cartela #{item.id.slice(-6)}</strong>
                        <span style={styles.cartItemGame}>Concurso: {item.game_id}</span>
                      </div>
                      <p style={styles.cartItemNumbers}>{item.numbers.join(', ')}</p>
                      <button
                        type="button"
                        style={styles.cartPayItemButton}
                        onClick={() => handlePayCartItem(item)}
                        disabled={checkoutLoading}
                      >
                        {checkoutLoading ? 'Processando...' : 'Pagar esta cartela'}
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  style={styles.cartPayAllButton}
                  onClick={handlePayAllCart}
                  disabled={checkoutLoading}
                >
                  {checkoutLoading ? 'Processando pagamento...' : 'Pagar todas'}
                </button>
              </>
            )}
          </aside>
        </div>
      )}
    </>
  );
};

const styles = {
  floatingCartButton: {
    position: 'fixed' as const,
    right: '14px',
    bottom: '12px',
    zIndex: 1000,
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    border: 'none',
    color: '#fff',
    fontWeight: 'bold',
    fontSize: '24px',
    background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)',
    boxShadow: '0 10px 20px rgba(0, 0, 0, 0.2)',
    cursor: 'pointer',
  },
  floatingCartBadge: {
    position: 'absolute' as const,
    top: '-5px',
    right: '-5px',
    minWidth: '22px',
    height: '22px',
    borderRadius: '11px',
    background: '#ef4444',
    color: '#fff',
    fontSize: '12px',
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '2px solid #fff',
    padding: '0 5px',
  },
  cartOverlay: {
    position: 'fixed' as const,
    inset: 0,
    background: 'rgba(15, 23, 42, 0.45)',
    zIndex: 1001,
    display: 'flex',
    justifyContent: 'flex-end',
  },
  cartDrawer: {
    width: 'min(420px, 92vw)',
    height: '100%',
    background: '#fff',
    boxShadow: '-8px 0 24px rgba(0, 0, 0, 0.2)',
    display: 'flex',
    flexDirection: 'column' as const,
    padding: '16px',
    gap: '12px',
  },
  cartHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #e2e8f0',
    paddingBottom: '8px',
  },
  cartTitle: {
    margin: 0,
    fontSize: '18px',
    color: '#0f172a',
  },
  cartCloseButton: {
    border: '1px solid #cbd5e1',
    borderRadius: '8px',
    background: '#fff',
    width: '32px',
    height: '32px',
    cursor: 'pointer',
  },
  cartItemsList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '10px',
    overflowY: 'auto' as const,
    flex: 1,
    paddingRight: '2px',
  },
  cartItemCard: {
    border: '1px solid #e2e8f0',
    borderRadius: '10px',
    padding: '10px',
    background: '#f8fafc',
  },
  cartItemTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '6px',
    fontSize: '12px',
  },
  cartItemGame: {
    color: '#475569',
    fontSize: '11px',
  },
  cartItemNumbers: {
    margin: '0 0 10px 0',
    fontSize: '12px',
    color: '#334155',
    lineHeight: '1.4',
  },
  cartPayItemButton: {
    width: '100%',
    height: '36px',
    borderRadius: '8px',
    border: '1px solid #22c55e',
    background: '#22c55e',
    color: '#fff',
    fontWeight: 700,
    cursor: 'pointer',
  },
  cartPayAllButton: {
    height: '44px',
    borderRadius: '10px',
    border: 'none',
    background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)',
    color: '#fff',
    fontWeight: 700,
    fontSize: '15px',
    cursor: 'pointer',
  },
  cartEmptyText: {
    margin: 0,
    color: '#64748b',
  },
};

export default FloatingCart;
