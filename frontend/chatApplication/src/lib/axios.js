import axios from "axios"
const API_URL = import.meta.env.VITE_DATA_BASE_LINK;
export const axiosInstance=axios.create({
    baseURL:API_URL,
    withCredentials:true,

})