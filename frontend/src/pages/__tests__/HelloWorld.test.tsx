import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

function HelloWorld() {
  return <h1>Olá, mundo!</h1>;
}

describe('HelloWorld', () => {
  it('renderiza o texto', () => {
    render(<HelloWorld />);
    expect(screen.getByText('Olá, mundo!')).toBeInTheDocument();
  });
});
