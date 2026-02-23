import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import ParishManagement from '../ParishManagement';

const { getMock, postMock, putMock, mockNavigate } = vi.hoisted(() => ({
  getMock: vi.fn(),
  postMock: vi.fn(),
  putMock: vi.fn(),
  mockNavigate: vi.fn(),
}));

vi.mock('../../services/api', () => ({
  default: {
    get: getMock,
    post: postMock,
    put: putMock,
  },
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('ParishManagement', () => {
  beforeEach(() => {
    getMock.mockReset();
    postMock.mockReset();
    putMock.mockReset();
    mockNavigate.mockReset();
    vi.spyOn(window, 'alert').mockImplementation(() => undefined);
  });

  it('exibe estado sem paróquia e permite abrir modal de cadastro', async () => {
    const user = userEvent.setup();
    getMock.mockImplementation((url: string) => {
      if (url === '/paroquias') return Promise.resolve({ data: [] });
      if (url === '/usuarios') return Promise.resolve({ data: [] });
      return Promise.resolve({ data: [] });
    });

    render(
      <MemoryRouter>
        <ParishManagement />
      </MemoryRouter>
    );

    expect(await screen.findByText(/nenhuma paróquia cadastrada no sistema/i)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /cadastrar paróquia/i }));

    expect(screen.getByRole('heading', { name: /cadastrar paróquia/i })).toBeInTheDocument();
    expect(screen.getByDisplayValue('Fortaleza')).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toBeDisabled();
  });

  it('valida obrigatórios no cadastro e cria paróquia com sucesso', async () => {
    const user = userEvent.setup();
    getMock.mockImplementation((url: string) => {
      if (url === '/paroquias') return Promise.resolve({ data: [] });
      if (url === '/usuarios') {
        return Promise.resolve({
          data: [{ id: 'ADM-1', nome: 'Admin Local', tipo: 'paroquia_admin' }],
        });
      }
      return Promise.resolve({ data: [] });
    });
    postMock.mockResolvedValueOnce({ data: { id: 'PAR-1' } });

    render(
      <MemoryRouter>
        <ParishManagement />
      </MemoryRouter>
    );

    await screen.findByText(/nenhuma paróquia cadastrada no sistema/i);
    await user.click(screen.getByRole('button', { name: /cadastrar paróquia/i }));

    await user.click(screen.getByRole('button', { name: /salvar alterações/i }));
    expect(postMock).not.toHaveBeenCalled();

    const modal = screen.getByRole('heading', { name: /cadastrar paróquia/i }).closest('.modal-content') as HTMLElement;
    const textboxes = within(modal).getAllByRole('textbox');
    const nomeInput = textboxes[0];
    const emailInput = textboxes[2];
    const pixInput = within(modal).getByPlaceholderText(/cnpj, e-mail, telefone ou chave aleatória/i);

    await user.type(nomeInput, 'Paróquia São José');
    await user.type(emailInput, 'saojose@example.com');
    await user.type(pixInput, 'pix@saojose.com');
    await user.click(screen.getByRole('button', { name: /salvar alterações/i }));

    await waitFor(() => {
      expect(postMock).toHaveBeenCalledWith('/paroquias', {
        nome: 'Paróquia São José',
        email: 'saojose@example.com',
        telefone: null,
        endereco: null,
        cidade: 'Fortaleza',
        estado: 'CE',
        cep: null,
        chave_pix: 'pix@saojose.com',
      });
    });
    expect(window.alert).toHaveBeenCalledWith('Paróquia cadastrada com sucesso!');
  });

  it('carrega paróquia existente e edita informações', async () => {
    const user = userEvent.setup();

    getMock.mockImplementation((url: string) => {
      if (url === '/paroquias') {
        return Promise.resolve({
          data: [
            {
              id: 'PAR-EXISTE',
              nome: 'Paróquia Matriz',
              email: 'matriz@example.com',
              telefone: '85999990000',
              endereco: 'Rua A',
              cidade: 'Fortaleza',
              estado: 'CE',
              cep: '60000000',
              chave_pix: 'pix@matriz.com',
              criado_em: '2026-01-01T10:00:00Z',
            },
          ],
        });
      }

      if (url === '/usuarios') {
        return Promise.resolve({
          data: [
            { id: 'ADM-1', nome: 'Admin 1', tipo: 'paroquia_admin' },
            { id: 'USR-2', nome: 'Fiel 2', tipo: 'fiel' },
          ],
        });
      }

      return Promise.resolve({ data: [] });
    });

    putMock.mockResolvedValueOnce({ data: { ok: true } });

    render(
      <MemoryRouter>
        <ParishManagement />
      </MemoryRouter>
    );

    expect(await screen.findByText('Paróquia Matriz')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /editar informações/i }));
    const modal = await screen.findByRole('heading', { name: /editar informações da paróquia/i });
    const modalContainer = modal.closest('.modal-content') as HTMLElement;

    const nomeInput = within(modalContainer).getAllByRole('textbox')[0];
    await user.clear(nomeInput);
    await user.type(nomeInput, 'Paróquia Matriz Atualizada');
    await user.click(within(modalContainer).getByRole('button', { name: /salvar alterações/i }));

    await waitFor(() => {
      expect(putMock).toHaveBeenCalledWith('/paroquias/PAR-EXISTE', {
        nome: 'Paróquia Matriz Atualizada',
        email: 'matriz@example.com',
        telefone: '85999990000',
        endereco: 'Rua A',
        cidade: 'Fortaleza',
        estado: 'CE',
        cep: '60000000',
        chave_pix: 'pix@matriz.com',
      });
    });

    expect(window.alert).toHaveBeenCalledWith('Paróquia atualizada com sucesso!');
  });

  it('volta para dashboard admin-site ao clicar em voltar', async () => {
    const user = userEvent.setup();
    getMock.mockImplementation((url: string) => {
      if (url === '/paroquias') return Promise.resolve({ data: [] });
      if (url === '/usuarios') return Promise.resolve({ data: [] });
      return Promise.resolve({ data: [] });
    });

    render(
      <MemoryRouter>
        <ParishManagement />
      </MemoryRouter>
    );

    await screen.findByText(/nenhuma paróquia cadastrada/i);
    await user.click(screen.getByRole('button', { name: /voltar/i }));

    expect(mockNavigate).toHaveBeenCalledWith('/admin-site/dashboard');
  });
});
