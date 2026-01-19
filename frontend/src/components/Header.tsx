/**
 * Componente Header
 * 
 * Exibe o nome da paróquia no topo da página
 * Consome GET /paroquia/me (sistema monolítico - única paróquia)
 */

import { useEffect, useState } from 'react'
import { paroquiaService } from '../services/api'
import type { Paroquia } from '../types'

interface HeaderProps {
  showParoquia?: boolean
}

export function Header({ showParoquia = true }: HeaderProps) {
  const [paroquia, setParoquia] = useState<Paroquia | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!showParoquia) {
      setLoading(false)
      return
    }

    const fetchParoquia = async () => {
      try {
        setLoading(true)
        const data = await paroquiaService.getParoquiaAtual()
        setParoquia(data)
        setError(null)
      } catch (err) {
        console.error('Erro ao buscar paróquia:', err)
        setError('Erro ao carregar dados da paróquia')
      } finally {
        setLoading(false)
      }
    }

    fetchParoquia()
  }, [showParoquia])

  return (
    <header style={styles.header}>
      <div style={styles.container}>
        <h1 style={styles.title}>🎱 Sistema de Bingo Comunitário</h1>
        
        {showParoquia && (
          <div style={styles.paroquiaInfo}>
            {loading && <p style={styles.loading}>Carregando...</p>}
            
            {error && <p style={styles.error}>{error}</p>}
            
            {paroquia && (
              <div style={styles.paroquiaDetails}>
                <h2 style={styles.paroquiaNome}>⛪ {paroquia.nome}</h2>
                <p style={styles.paroquiaLocal}>
                  {paroquia.cidade && paroquia.estado && 
                    `${paroquia.cidade} - ${paroquia.estado}`
                  }
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  )
}

// Estilos inline simples (substituir por CSS modules ou styled-components depois)
const styles = {
  header: {
    backgroundColor: '#1a1a2e',
    color: '#fff',
    padding: '1.5rem 0',
    borderBottom: '3px solid #0f3460',
  },
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 1rem',
  },
  title: {
    fontSize: '1.8rem',
    fontWeight: 'bold',
    marginBottom: '1rem',
    textAlign: 'center' as const,
  },
  paroquiaInfo: {
    textAlign: 'center' as const,
    marginTop: '1rem',
  },
  loading: {
    color: '#aaa',
    fontSize: '0.9rem',
  },
  error: {
    color: '#ff6b6b',
    fontSize: '0.9rem',
  },
  paroquiaDetails: {
    padding: '0.5rem 0',
  },
  paroquiaNome: {
    fontSize: '1.4rem',
    fontWeight: '600',
    marginBottom: '0.3rem',
    color: '#e94560',
  },
  paroquiaLocal: {
    fontSize: '0.95rem',
    color: '#ccc',
    marginTop: '0.2rem',
  },
}

export default Header
