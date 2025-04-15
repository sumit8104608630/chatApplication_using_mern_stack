import {create} from "zustand"
import { axiosInstance } from "../lib/axios"
import {io} from "socket.io-client"

const API_URL = import.meta.env.VITE_DATA_BASE_LINK; // Your backend URL

export const groupStore=create((set,get)=>({
    isCreatingGroup:false,
    createGroup:async(formDta)=>{
        try {
            set({isCreatingGroup:true});
            const response=await axiosInstance.post(`/group/create_group`,formDta);
            console.log(response);
            if(response.status===201){
                set({isCreatingGroup:false});
            }
        } catch (error) {
            console.log(error)
            set({isCreatingGroup:false});

        }
    }
}))