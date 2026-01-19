/**
 * Página Home
 * 
 * Página inicial do sistema após login
 */

import Header from '../components/Header'

export function Home() {
  return (
    <div>
      <Header showParoquia={true} />
      
      <main style={styles.main}>
        <div style={styles.container}>
          <h2>Bem-vindo ao Sistema de Bingo Comunitário!</h2>
          <p>Em breve: lista de sorteios, compra de cartelas e muito mais.</p>
        </div>
      </main>
    </div>
  )
}

const styles = {
  main: {
    minHeight: 'calc(100vh - 200px)',
    padding: '2rem 0',
  },
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 1rem',
  },
}

export default Home
