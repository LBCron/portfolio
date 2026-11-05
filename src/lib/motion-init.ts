export const MOTION_STORAGE_KEY = 'jm.motion';

/**
 * Runs before first paint so a persisted "Pause animations" choice never
 * flashes motion. Kept tiny and dependency-free on purpose.
 */
export const MOTION_INIT_SCRIPT = `try{if(localStorage.getItem('${MOTION_STORAGE_KEY}')==='reduced')document.documentElement.dataset.motion='reduced'}catch(e){}`;
