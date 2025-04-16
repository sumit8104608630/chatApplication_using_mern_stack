import {create} from "zustand"
import { axiosInstance } from "../lib/axios"
import {io} from "socket.io-client"

const API_URL = import.meta.env.VITE_DATA_BASE_LINK; // Your backend URL

export const groupStore=create((set,get)=>({
    isCreatingGroup:false,
    isGroupLoading:false,
    groups:null,
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
    },
    get_all_group:async()=>{
        try {
            set({isGroupLoading:true})
            const response=await axiosInstance.get(`/group/get_all_group`);
           // console.log(response)
            if(response.status==200){
                set({isGroupLoading:false})
                set({groups:response.data.data});
            }
        } catch (error) {
            set({isGroupLoading:false})
            console.log(error)
        }
    }
}))