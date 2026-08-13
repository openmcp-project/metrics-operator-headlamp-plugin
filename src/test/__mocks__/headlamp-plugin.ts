// Minimal stub of @kinvolk/headlamp-plugin/lib for tests
export const K8s = {
  ApiProxy: {
    request: () => Promise.resolve({ items: [] }),
  },
  ResourceClasses: {
    CustomResourceDefinition: {
      useList: () => [[], null],
    },
  },
};

export const registerRoute = () => {};
export const registerSidebarEntry = () => {};
