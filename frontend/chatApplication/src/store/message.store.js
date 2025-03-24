import {create} from "zustand"
import { axiosInstance } from "../lib/axios"
import { Contact } from "lucide-react"
import { authStore } from "./userAuth.store"

export const messageStore=create((set,get)=>({
    contacts:[],
    messages:[],
    selectedUser:null,
    contactsLoading:false,
    get_all_contacts:async()=>{
        try {
            set({contactsLoading:true})
            const response=await axiosInstance.get(`/user/get_contact`);
            set({contacts:response.data.data.contacts})
        } catch (error) {
            console.log(error)
        }
        finally{
            set({contactsLoading:false})

        }
    },
    send_message:async(data)=>{
        try {
            const {messages}=get();
            const response =await axiosInstance.post(`/message/save_message`,data);
            set({messages:[...messages,response.data.data]})
        } catch (error) {
            console.log(error)
        }
    },
    getAll_messages:async(receiverId)=>{
        try {
            const response=await axiosInstance.get(`/message/get_message/${receiverId}`);
            set({messages:response.data.data})
        } catch (error) {
            console.log(error)
        }
    },
    subScribe:()=>{
        const socket=authStore.getState().socket;
        if(!socket)return
        socket.on('newMessage',(data)=>{
            const {messages}=get();

            set({messages:[...messages,data]})
        })
    },
    unSubScribe:()=>{
        // let's unSubScribe
        const socket=authStore.getState().socket;
        socket.off('newMessage')
    },
    setSelectedUser:(selectedUserId)=>{
        set({selectedUser:selectedUserId})
    }
}))