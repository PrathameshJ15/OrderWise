import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import WarehouseDigitalTwin from '../src/components/3d/WarehouseDigitalTwin';
import { ThemeProvider } from '../src/contexts/ThemeContext';

describe('WarehouseDigitalTwin 3D Visualization Tests', () => {
  const mockProducts = [
    { id: 1, sku: 'PUMP-X100', name: 'Industrial Pump Model X', on_hand_quantity: 150, reserved_quantity: 50 },
    { id: 2, sku: 'VALVE-B200', name: 'Safety Valve Type B', on_hand_quantity: 80, reserved_quantity: 20 },
    { id: 3, sku: 'GAUGE-P300', name: 'Pressure Gauge Pro', on_hand_quantity: 40, reserved_quantity: 30 },
    { id: 4, sku: 'CTRL-U400', name: 'Control Panel Unit', on_hand_quantity: 200, reserved_quantity: 40 },
  ];

  const mockActiveResult = {
    simulation: {
      id: 99,
      scenario_type: 'inventory_increase',
      name: 'Inventory Surge Test',
    },
    diff: {
      summary: {
        total_items_compared: 4,
        total_changed: 1,
        improvements: 1,
        degradations: 0,
      },
      item_diffs: [
        {
          order_id: 101,
          product_id: 3,
          product_name: 'Pressure Gauge Pro',
          sku: 'GAUGE-P300',
          requested_quantity: 25,
          previous_allocated: 0,
          current_allocated: 25,
          delta: 25,
          current_status: 'fulfilled',
        },
      ],
    },
  };

  it('renders WarehouseDigitalTwin header, telemetry badge, and controls', () => {
    render(
      <ThemeProvider>
        <WarehouseDigitalTwin products={mockProducts} activeResult={mockActiveResult} />
      </ThemeProvider>
    );

    expect(screen.getByText(/3D Warehouse Digital Twin/i)).toBeInTheDocument();
    expect(screen.getAllByText(/SIMULATED OUTCOME/i).length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: /^Baseline State$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Simulated Outcome$/i })).toBeInTheDocument();
  });

  it('toggles between Baseline State and Simulated Outcome modes', () => {
    render(
      <ThemeProvider>
        <WarehouseDigitalTwin products={mockProducts} activeResult={mockActiveResult} />
      </ThemeProvider>
    );

    const baselineBtn = screen.getByRole('button', { name: /^Baseline State$/i });
    fireEvent.click(baselineBtn);

    expect(screen.getByText(/LIVE BASELINE/i)).toBeInTheDocument();

    const simBtn = screen.getByRole('button', { name: /^Simulated Outcome$/i });
    fireEvent.click(simBtn);

    expect(screen.getAllByText(/SIMULATED OUTCOME/i).length).toBeGreaterThan(0);
  });

  it('renders camera angle presets (Isometric, Blueprint, Zone C, Docks)', () => {
    render(
      <ThemeProvider>
        <WarehouseDigitalTwin products={mockProducts} activeResult={mockActiveResult} />
      </ThemeProvider>
    );

    expect(screen.getAllByRole('button', { name: /Isometric/i }).length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: /Blueprint/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Zone C \(Scarce\)/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Docks/i })).toBeInTheDocument();
  });

  it('allows selecting a zone to reveal the floating inventory HUD card', () => {
    const handleSelectZone = vi.fn();
    const handleSelectProduct = vi.fn();

    render(
      <ThemeProvider>
        <WarehouseDigitalTwin
          products={mockProducts}
          activeResult={mockActiveResult}
          onSelectZone={handleSelectZone}
          onSelectProduct={handleSelectProduct}
        />
      </ThemeProvider>
    );

    // Click Zone C button
    const zoneCButtons = screen.getAllByRole('button', { name: /ZONE C/i });
    expect(zoneCButtons.length).toBeGreaterThan(0);
    fireEvent.click(zoneCButtons[0]);

    expect(handleSelectZone).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'zone-c',
        code: 'ZONE C',
      })
    );

    // Verify HUD inspection card appears with inventory details
    expect(screen.getAllByText(/Pressure Gauges/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Baseline On-Hand/i)).toBeInTheDocument();
    expect(screen.getByText(/Simulated Stock/i)).toBeInTheDocument();
  });

  it('toggles simulation play and pause state', () => {
    render(
      <ThemeProvider>
        <WarehouseDigitalTwin products={mockProducts} activeResult={mockActiveResult} />
      </ThemeProvider>
    );

    const pauseBtn = screen.getByTitle(/Pause simulation animations/i);
    expect(pauseBtn).toBeInTheDocument();

    fireEvent.click(pauseBtn);
    expect(screen.getByTitle(/Play simulation animations/i)).toBeInTheDocument();
  });

  it('displays the industrial allocation color legend', () => {
    render(
      <ThemeProvider>
        <WarehouseDigitalTwin products={mockProducts} activeResult={mockActiveResult} />
      </ThemeProvider>
    );

    expect(screen.getByText(/Fully Allocated/i)).toBeInTheDocument();
    expect(screen.getByText(/Partially Allocated/i)).toBeInTheDocument();
    expect(screen.getByText(/Shortage \/ Deferred/i)).toBeInTheDocument();
    expect(screen.getByText(/Available Free Stock/i)).toBeInTheDocument();
  });
});
