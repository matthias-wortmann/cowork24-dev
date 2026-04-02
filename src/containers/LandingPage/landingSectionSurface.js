import css from './landingSectionSurfaces.module.css';

/**
 * @param {'white' | 'muted' | undefined} landingSurface
 * @returns {string} CSS module class for the section root
 */
export function landingSectionSurfaceClassName(landingSurface) {
  return landingSurface === 'muted' ? css.surfaceMuted : css.surfaceWhite;
}
