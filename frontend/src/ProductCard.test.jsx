import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ProductCard from './ProductCard';

describe('ProductCard Component', () => {
  const mockProduct = {
    id: 1,
    name: 'Café Premium Oro',
    price: 15.99,
    stock: 10,
    image_url: 'http://test.com/img.jpg'
  };

  it('debe renderizar el nombre y el precio del producto', () => {
    render(<ProductCard product={mockProduct} />);
    
    expect(screen.getByText('Café Premium Oro')).toBeInTheDocument();
    expect(screen.getByText('15.99€')).toBeInTheDocument();
  });

  it('debe llamar a onAdd al hacer clic en el botón Añadir', () => {
    const onAddMock = vi.fn();
    render(<ProductCard product={mockProduct} onAdd={onAddMock} />);
    
    const addButton = screen.getByText('Añadir');
    fireEvent.click(addButton);
    
    expect(onAddMock).toHaveBeenCalledWith(mockProduct);
  });

  it('debe mostrar "Agotado" y deshabilitar botones si el stock es 0', () => {
    const zeroStockProduct = { ...mockProduct, stock: 0 };
    render(<ProductCard product={zeroStockProduct} />);
    
    const addButton = screen.getByText('Agotado');
    expect(addButton).toBeDisabled();
  });
});
