import axios from "axios"
const API_URL = import.meta.env.VITE_DATA_BASE_LINK;
console.log(API_URL)
export const axiosInstance=axios.create({
    baseURL:API_URL,
    withCredentials:true,
})