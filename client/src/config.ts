const normalizeUrl = (url?: string): string => {
    return (url ?? "").trim().replace(/\/+$/, "");
};

const config = {
    api: {
        URL: normalizeUrl(import.meta.env.VITE_SERVER_API_URL) || "http://localhost:8200"
    }
};

export default config;
