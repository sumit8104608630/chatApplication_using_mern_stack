import {create} from "zustand"
import { axiosInstance } from "../lib/axios"
import { Contact } from "lucide-react"
import { authStore } from "./userAuth.store"

export const messageStore=create((set,get)=>({
    contacts:[],
    messages:[],
    messageSendingLoading:false,
    messageLoading:false,
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
    update_message_array_received:async(activeContact)=>{
        try {
            
            const response=await axiosInstance.post(`/message/update_message_array_received`,{activeContact});
            console.log(response);
        } catch (error) {
            console.log(error)
        }
    },
    locallyUpdateMessage: async() => {
        try {
            const {messages} = get() // Remove the await here
            let update_message = messages.map(message => 
                 message.status == "sent" && message.isOwn
                ? {...message, status: "received"} 
                : message
            )
            set({ messages: update_message });
        } catch (error) {
            console.log(error)
        }
    },
    update_message_array_to_seen:async(contact_id)=>{
        try {
            const response=await axiosInstance.post(`/message/update_message_array_seen`,{contact_id});
        } catch (error) {
            console.log(error)
        }
    },
    send_message:async(data)=>{
        try {
            set({messageSendingLoading:true})
            const {messages}=get();
            const response =await axiosInstance.post(`/message/save_message`,data);
            set({messages:[...messages,response.data.data]})
            if(response.status==201){
                set({messageSendingLoading:false})
            }
        } catch (error) {
            console.log(error)
            set({messageSendingLoading:false})
        }
    },
    getAll_messages:async(receiverId)=>{
        try {
            set({messageLoading:true})
            const response=await axiosInstance.get(`/message/get_message/${receiverId}`);
            set({messages:response.data.data})
            if(response.status==200){
                set({messageLoading:false})
            }
        } catch (error) {
            console.log(error)
            set({messageLoading:false})
        }
    },
    subScribe:()=>{
        const socket=authStore.getState().socket;
        if(!socket)return
        const{selectedUser}=get()
        socket.on('newMessage',(data)=>{
            if(data.sender==selectedUser||data.receiver==selectedUser){
            const {messages}=get();
            
            set({messages:[...messages,data]})
            }
        })
    },
    unSubScribe:()=>{
        // let's unSubScribe
        const socket=authStore.getState().socket;
        if(!socket)return
        socket.off('newMessage')
    },
    setSelectedUser:(selectedUserId)=>{
        
        set({selectedUser:selectedUserId})
    },
    locallyUpdate_toSeen: async() => {
        try {
            const {messages} = get() // Remove the await here
            let update_message = messages.map(message => 
                 message.status != "seen" && message.isOwn
                ? {...message, status: "seen"} 
                : message
            )
            set({ messages: update_message });
        } catch (error) {
            console.log(error)
        }
    },
}))