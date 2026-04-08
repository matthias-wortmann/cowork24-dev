const scriptPromises = {};

const createScriptTag = (src, attributes = {}) => {
  const script = document.createElement('script');
  script.src = src;

  Object.entries(attributes).forEach(([key, value]) => {
    if (value === true) {
      script.setAttribute(key, '');
    } else if (value !== false && value != null) {
      script.setAttribute(key, String(value));
    }
  });

  return script;
};

export const loadScriptOnce = (src, attributes = {}) => {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error(`Cannot load script on server: ${src}`));
  }

  if (scriptPromises[src]) {
    return scriptPromises[src];
  }

  const existingScript = document.querySelector(`script[src="${src}"]`);
  if (existingScript) {
    scriptPromises[src] = Promise.resolve(existingScript);
    return scriptPromises[src];
  }

  scriptPromises[src] = new Promise((resolve, reject) => {
    const script = createScriptTag(src, attributes);
    script.onload = () => resolve(script);
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
    document.head.appendChild(script);
  });

  return scriptPromises[src];
};
