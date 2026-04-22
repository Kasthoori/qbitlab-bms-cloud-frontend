let navigate: (path: string) => void;

export function setNavigator(fn: (path: string) => void) {
  navigate = fn;
}

export function navigateTo(path: string) {
  if (navigate) {
    navigate(path);
  } else {
    // fallback (should not happen ideally)
    window.location.href = path;
  }
}