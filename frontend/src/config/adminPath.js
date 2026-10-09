const configuredPath = import.meta.env.VITE_ADMIN_PATH || '/ecomm-manager';

export const adminPath = `/${configuredPath.replace(/^\/+|\/+$/g, '')}`;
export const adminRoute = (section = '') => `${adminPath}${section ? `/${section.replace(/^\/+/, '')}` : ''}`;