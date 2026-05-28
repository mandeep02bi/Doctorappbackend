import axios from "axios";

const rawApiOrigin =
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    process.env.NEXT_PUBLIC_API ||
    "";

export const API_ORIGIN = rawApiOrigin.replace(/\/api\/?$/, "").replace(/\/$/, "");
export const API_BASE_URL = `${API_ORIGIN}/api`;

export const apiUrl = (path) => {
    if (!path) return API_BASE_URL;
    if (/^https?:\/\//i.test(path)) return path;
    return `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
};

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        "ngrok-skip-browser-warning": "true",
    },
});

const readAccessToken = (payload) => {
    return (
        payload?.data?.accessToken ||
        payload?.data?.access_token ||
        payload?.data?.token ||
        payload?.accessToken ||
        payload?.access_token ||
        payload?.token ||
        null
    );
};

const readRefreshToken = (payload) => {
    return (
        payload?.data?.refreshToken ||
        payload?.data?.refresh_token ||
        payload?.refreshToken ||
        payload?.refresh_token ||
        null
    );
};

const clearSession = () => {
    localStorage.removeItem("accesstoken");
    localStorage.removeItem("refreshtoken");
    localStorage.removeItem("user");
    localStorage.removeItem("aurahealth_session");
};

let refreshRequest = null;

//add access token in every request
api.interceptors.request.use(
    (config) => {
        const accesstoken = localStorage.getItem("accesstoken");
        if (accesstoken) {
            config.headers.Authorization = `Bearer ${accesstoken}`;
        }
        config.headers["ngrok-skip-browser-warning"] = "true";
        return config;
    },
    (error) => Promise.reject(error)
);

//handle expired accesstoken
api.interceptors.response.use(
    (response) => response,

    async (error) => {

        const originalrequest = error.config;

        if (!error.response || !originalrequest) {
            return Promise.reject(error);
        }

        if (error.response.status === 401 && !originalrequest._retry) {

            originalrequest._retry = true;

            try {

                const refreshtoken = localStorage.getItem("refreshtoken");
                if (!refreshtoken) {
                    throw new Error("Refresh token missing");
                }

                //request new access token
                if (!refreshRequest) {
                    refreshRequest = axios.post(apiUrl("/auth/refresh-token"),
                        {
                            refreshtoken,
                            refreshToken: refreshtoken,
                        },
                        {
                            headers: {
                                "Content-Type": "application/json",
                                "ngrok-skip-browser-warning": "true",
                            },
                        });
                }

                const response = await refreshRequest;
                refreshRequest = null;

                const newaccesstoken = readAccessToken(response.data);
                const newrefreshtoken = readRefreshToken(response.data);

                if (!newaccesstoken) {
                    throw new Error("Refresh response missing access token");
                }

                //update local storage
                localStorage.setItem("accesstoken", newaccesstoken);
                if (newrefreshtoken) {
                    localStorage.setItem("refreshtoken", newrefreshtoken);
                }

                //update header
                originalrequest.headers.Authorization = `Bearer ${newaccesstoken}`;

                //retry original api
                return api(originalrequest);

            } catch (err) {
                refreshRequest = null;
                clearSession();

                window.location.href = "/";

                console.error("Token refresh failed", err);
                return Promise.reject(err);
            }
        }
        return Promise.reject(error);
    }
)

export default api;
