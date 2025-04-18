import {create} from "zustand"
import { axiosInstance } from "../lib/axios"
import {io} from "socket.io-client"

const API_URL = import.meta.env.VITE_DATA_BASE_LINK; // Your backend URL

export const groupMessageStore=create((set,get)=>({
    messages:[],
    messageSendingLoading:false,
    messageLoading:false,
    sendGroupMessage:async(data)=>{
        try {
            const response=await axiosInstance.post("/groupMessage/save_groupMessage",data);
            
        } catch (error) {
            console.log(error)
        }
    }
}))