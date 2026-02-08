export const PROFILE_CACHE_KEY = "profile";

export const getCachedProfile = () => {
    const raw = localStorage.getItem(PROFILE_CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
};

export const setCachedProfile = (profile) => {
    localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(profile));
};

export const clearCachedProfile = () => {
    localStorage.removeItem(PROFILE_CACHE_KEY);
};