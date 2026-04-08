if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = query => {
    const minWidthMatch = query.match(/min-width:\s*(\d+)px/);
    const maxWidthMatch = query.match(/max-width:\s*(\d+)px/);

    const minWidth = minWidthMatch ? Number(minWidthMatch[1]) : null;
    const maxWidth = maxWidthMatch ? Number(maxWidthMatch[1]) : null;

    // Default test viewport emulates desktop width.
    const viewportWidth = 1280;
    const matchesMin = minWidth == null || viewportWidth >= minWidth;
    const matchesMax = maxWidth == null || viewportWidth <= maxWidth;
    const matches = matchesMin && matchesMax;

    return {
      matches,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    };
  };
}
