import React from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import AnimatedRedWaves from '../src/components/ui/AnimatedRedWaves';

describe('AnimatedRedWaves Component', () => {
  it('renders all three wave compositions when variant is "full"', () => {
    const { container } = render(<AnimatedRedWaves variant="full" />);
    
    // Check root container
    const waveContainer = container.querySelector('.orderwise-waves');
    expect(waveContainer).toBeDefined();
    expect(waveContainer.getAttribute('aria-hidden')).toBe('true');

    // Check SVG animations for Top-Right, Bottom-Left, Bottom-Right
    expect(container.querySelector('.animate-wave-tr')).not.toBeNull();
    expect(container.querySelector('.animate-wave-bl')).not.toBeNull();
    expect(container.querySelector('.animate-wave-br')).not.toBeNull();

    // Check linear and radial gradient definitions
    expect(container.querySelector('#owRedWaveStrokeTR')).not.toBeNull();
    expect(container.querySelector('#owRedWaveStrokeBL')).not.toBeNull();
    expect(container.querySelector('#owAtmosphericGlowTR')).not.toBeNull();
  });

  it('renders only the corner composition when variant is "corner"', () => {
    const { container } = render(<AnimatedRedWaves variant="corner" />);

    expect(container.querySelector('.animate-wave-tr')).not.toBeNull();
    // Bottom-Left and Bottom-Right should not be rendered
    expect(container.querySelector('.animate-wave-bl')).toBeNull();
    expect(container.querySelector('.animate-wave-br')).toBeNull();
  });

  it('preserves pointer-events-none and decorative aria attributes for accessibility', () => {
    const { container } = render(<AnimatedRedWaves variant="full" />);
    const root = container.querySelector('.orderwise-waves');
    
    expect(root.className).toContain('pointer-events-none');
    expect(root.className).toContain('select-none');
    expect(root.className).toContain('z-0');
  });
});

